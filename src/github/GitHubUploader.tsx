import { useEffect, useState } from 'react';
import { PROJECT_FILES } from './projectFiles';

// Enlace que abre el formulario de GitHub con el nombre y los permisos ya marcados
const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=repo,workflow&description=Rockanoid%20APK';
const SIGNUP_URL = 'https://github.com/signup';
const TOKENS_PAGE = 'https://github.com/settings/tokens';
const API = 'https://api.github.com';

type Phase = 'idle' | 'uploading' | 'waiting' | 'running' | 'success' | 'failed' | 'error';

interface Ctx {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  sha: string;
}
interface RunInfo {
  id: number;
  status: string;
  conclusion: string | null;
  html_url: string;
  head_sha: string;
}

class GhError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function gh<T = unknown>(token: string, path: string, opts: { method?: string; json?: unknown } = {}): Promise<{ status: number; data: T }> {
  const res = await fetch(API + path, {
    method: opts.method ?? (opts.json !== undefined ? 'POST' : 'GET'),
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      ...(opts.json !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data: data as T };
}

function ok<T>(r: { status: number; data: T }, statuses: number[], what: string): T {
  if (!statuses.includes(r.status)) {
    const msg = (r.data as { message?: string } | null)?.message ?? `HTTP ${r.status}`;
    throw new GhError(`${what}: ${msg}`, r.status);
  }
  return r.data;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function uploadProject(token: string, repoName: string, log: (s: string) => void): Promise<Ctx> {
  const user = ok(await gh<{ login: string }>(token, '/user'), [200], 'La llave no es válida');
  const owner = user.login;
  log(`✔ Conectado a GitHub como ${owner}`);

  let repoRes = await gh<{ default_branch: string }>(token, `/repos/${owner}/${repoName}`);
  let fresh = false;
  if (repoRes.status === 404) {
    log(`Creando el repositorio ${owner}/${repoName}…`);
    repoRes = await gh<{ default_branch: string }>(token, '/user/repos', {
      json: {
        name: repoName,
        description: 'ROCKANOID - La Era de Piedra (Physical Dreams)',
        private: false,
        auto_init: true,
        has_issues: false,
        has_projects: false,
        has_wiki: false,
      },
    });
    ok(repoRes, [201], 'No se pudo crear el repositorio');
    fresh = true;
    log('✔ Repositorio creado');
  } else {
    ok(repoRes, [200], 'No se pudo acceder al repositorio');
    log(`✔ Usando el repositorio existente ${owner}/${repoName}`);
  }
  const branch = repoRes.data.default_branch || 'main';
  const base = `/repos/${owner}/${repoName}`;

  // Commit actual de la rama (tras crear el repositorio puede tardar unos segundos en existir)
  let parent: string | null = null;
  let baseTree: string | null = null;
  for (let i = 0; i < 12; i++) {
    const ref = await gh<{ object: { sha: string } }>(token, `${base}/git/ref/heads/${branch}`);
    if (ref.status === 200) {
      parent = ref.data.object.sha;
      baseTree = ok(await gh<{ tree: { sha: string } }>(token, `${base}/git/commits/${parent}`), [200], 'No se pudo leer el commit').tree.sha;
      break;
    }
    if (!fresh) break; // repositorio vacío creado a mano: se crea la rama desde cero
    await sleep(1000);
  }

  log(`Subiendo ${PROJECT_FILES.length} archivos…`);
  const tree: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  const BATCH = 4;
  for (let i = 0; i < PROJECT_FILES.length; i += BATCH) {
    const chunk = PROJECT_FILES.slice(i, i + BATCH);
    const shas = await Promise.all(
      chunk.map(async (f) => ok(await gh<{ sha: string }>(token, `${base}/git/blobs`, { json: { content: f.content, encoding: 'utf-8' } }), [201], `No se pudo subir ${f.path}`).sha),
    );
    chunk.forEach((f, k) => tree.push({ path: f.path, mode: '100644', type: 'blob', sha: shas[k] }));
    log(`  ${Math.min(i + BATCH, PROJECT_FILES.length)} de ${PROJECT_FILES.length}`);
  }

  const treeSha = ok(
    await gh<{ sha: string }>(token, `${base}/git/trees`, { json: { ...(baseTree ? { base_tree: baseTree } : {}), tree } }),
    [201],
    'No se pudo crear la lista de archivos',
  ).sha;
  const commitSha = ok(
    await gh<{ sha: string }>(token, `${base}/git/commits`, {
      json: { message: 'ROCKANOID: proyecto completo (subido desde el juego)', tree: treeSha, parents: parent ? [parent] : [] },
    }),
    [201],
    'No se pudo crear el commit',
  ).sha;
  if (parent) ok(await gh(token, `${base}/git/refs/heads/${branch}`, { method: 'PATCH', json: { sha: commitSha, force: true } }), [200], 'No se pudo actualizar la rama');
  else ok(await gh(token, `${base}/git/refs`, { json: { ref: `refs/heads/${branch}`, sha: commitSha } }), [201], 'No se pudo crear la rama');
  log('✔ Archivos subidos. GitHub está arrancando la compilación…');
  return { token, owner, repo: repoName, branch, sha: commitSha };
}

const linkCls = 'rounded bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-900 hover:bg-amber-400 active:translate-y-px';

export default function GitHubUploader({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState('');
  const [show, setShow] = useState(false);
  const [repoName, setRepoName] = useState('rockanoid');
  const [phase, setPhase] = useState<Phase>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [run, setRun] = useState<RunInfo | null>(null);
  const [apkUrl, setApkUrl] = useState('');
  const [started, setStarted] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const addLog = (s: string) => setLog((l) => [...l, s]);

  const start = async () => {
    const t = token.trim();
    const name = repoName.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '-') || 'rockanoid';
    if (!t) {
      setError('Pega primero la llave (empieza por ghp_).');
      return;
    }
    setRepoName(name);
    setError('');
    setLog([]);
    setRun(null);
    setApkUrl('');
    setPhase('uploading');
    try {
      const c = await uploadProject(t, name, addLog);
      setCtx(c);
      setStarted(Date.now());
      setPhase('waiting');
    } catch (e) {
      let msg = e instanceof Error ? e.message : String(e);
      if (/workflow/i.test(msg)) msg += ' — La llave necesita el permiso "workflow". Crea una nueva con el botón del paso 2 (ya viene marcado).';
      else if (e instanceof GhError && e.status === 401) msg = 'La llave no es válida o ha caducado. Crea una nueva con el botón del paso 2.';
      else if (e instanceof GhError && e.status === 403) msg += ' — GitHub ha limitado las peticiones temporalmente. Espera un minuto y vuelve a intentarlo.';
      else if (!(e instanceof GhError)) msg = 'No hay conexión con GitHub. Comprueba tu internet e inténtalo de nuevo.';
      setError(msg);
      setPhase('error');
    }
  };

  // Vigila la compilación en GitHub Actions
  useEffect(() => {
    if (!ctx || (phase !== 'waiting' && phase !== 'running')) return;
    let cancelled = false;
    let timer = 0;
    const tick = async () => {
      try {
        const r = await gh<{ workflow_runs: RunInfo[] }>(ctx.token, `/repos/${ctx.owner}/${ctx.repo}/actions/runs?per_page=10&branch=${encodeURIComponent(ctx.branch)}`);
        if (r.status === 200) {
          const found = r.data.workflow_runs.find((w) => w.head_sha === ctx.sha);
          if (found && !cancelled) {
            setRun(found);
            if (found.status === 'completed') {
              if (found.conclusion === 'success') {
                const rel = await gh<{ assets: { name: string; browser_download_url: string }[] }>(ctx.token, `/repos/${ctx.owner}/${ctx.repo}/releases/latest`);
                const asset = rel.status === 200 ? rel.data.assets.find((a) => a.name.endsWith('.apk')) : undefined;
                setApkUrl(asset?.browser_download_url ?? `https://github.com/${ctx.owner}/${ctx.repo}/releases/latest`);
                setPhase('success');
              } else {
                setPhase('failed');
              }
              return;
            }
            if (phase !== 'running') setPhase('running');
          }
        }
      } catch {
        /* sin conexión momentánea: se reintenta */
      }
      if (!cancelled) {
        setElapsed(Math.floor((Date.now() - started) / 1000));
        timer = window.setTimeout(tick, 10000);
      }
    };
    timer = window.setTimeout(tick, 4000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ctx, phase, started]);

  const busy = phase === 'uploading' || phase === 'waiting' || phase === 'running';
  const repoUrl = ctx ? `https://github.com/${ctx.owner}/${ctx.repo}` : '';
  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border-2 border-amber-700 bg-[#1b1726] p-5 font-mono text-sm text-stone-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-base font-black tracking-wide text-amber-300">📦 CREAR EL APK CON GITHUB (OPCIÓN B) — DESDE AQUÍ</h2>
          <button onClick={onClose} className="rounded border border-stone-600 px-2 text-stone-300 hover:bg-stone-700" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-stone-400">
          El asistente no puede entrar en GitHub, pero <b className="text-stone-200">tu navegador sí</b>. Con una "llave" de tu cuenta, este botón sube el
          juego a tu GitHub y GitHub fabrica el APK en unos 8 minutos. Después, lo descargas aquí mismo.
        </p>

        <ol className="space-y-4">
          <li className="rounded-lg border border-stone-700 bg-black/30 p-3">
            <div className="mb-1 font-bold text-white">① Cuenta de GitHub (gratis)</div>
            <p className="mb-2 text-xs text-stone-400">Si ya tienes cuenta, salta este paso. Importante: confirma el correo, sin eso GitHub no compila.</p>
            <a href={SIGNUP_URL} target="_blank" rel="noreferrer" className={linkCls}>
              CREAR CUENTA ↗
            </a>
          </li>

          <li className="rounded-lg border border-stone-700 bg-black/30 p-3">
            <div className="mb-1 font-bold text-white">② Crea tu llave</div>
            <p className="mb-2 text-xs text-stone-400">
              Se abre una página con todo ya marcado. Baja hasta el final, pulsa el botón verde <b className="text-stone-200">Generate token</b> y copia el
              texto que empieza por <b className="text-stone-200">ghp_</b> (solo se muestra una vez).
            </p>
            <a href={TOKEN_URL} target="_blank" rel="noreferrer" className={linkCls}>
              CREAR LLAVE ↗
            </a>
          </li>

          <li className="rounded-lg border border-stone-700 bg-black/30 p-3">
            <div className="mb-2 font-bold text-white">③ Pega la llave y pulsa el botón</div>
            <div className="mb-2 flex gap-2">
              <input
                type={show ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                autoComplete="off"
                spellCheck={false}
                disabled={busy}
                className="min-w-0 flex-1 rounded border border-stone-600 bg-black px-2 py-1.5 text-stone-100 outline-none focus:border-amber-500"
              />
              <button onClick={() => setShow((s) => !s)} className="rounded border border-stone-600 px-2 text-xs text-stone-300 hover:bg-stone-700" type="button">
                {show ? 'OCULTAR' : 'VER'}
              </button>
            </div>
            <label className="mb-3 flex items-center gap-2 text-xs text-stone-400">
              Nombre del repositorio:
              <input
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                disabled={busy}
                className="w-40 rounded border border-stone-600 bg-black px-2 py-1 text-stone-100 outline-none focus:border-amber-500"
              />
            </label>
            <button
              onClick={start}
              disabled={busy}
              className="w-full rounded-lg border-b-4 border-red-950 bg-red-700 px-4 py-3 text-base font-black tracking-wide text-amber-100 hover:bg-red-600 active:translate-y-1 active:border-b-0 disabled:cursor-wait disabled:opacity-50"
            >
              {phase === 'uploading' ? '⏳ SUBIENDO…' : busy ? '⏳ COMPILANDO EN GITHUB…' : '🚀 SUBIR Y COMPILAR APK'}
            </button>
          </li>
        </ol>

        {(log.length > 0 || error) && (
          <div className="mt-4 rounded-lg border border-stone-700 bg-black p-3 text-xs">
            {log.map((l, i) => (
              <div key={i} className="text-stone-300">
                {l}
              </div>
            ))}
            {error && <div className="mt-1 text-red-400">✖ {error}</div>}
            {(phase === 'waiting' || phase === 'running') && (
              <div className="mt-2 text-amber-300">
                {phase === 'waiting' ? '⏳ Esperando a que GitHub arranque el robot…' : `⚙️ Compilando el APK… (${mins}:${secs})`}
                <span className="text-stone-500"> Suele tardar entre 6 y 10 minutos. Puedes seguir jugando: te avisaremos aquí.</span>
                {run && (
                  <>
                    {' '}
                    <a href={run.html_url} target="_blank" rel="noreferrer" className="underline">
                      ver progreso en GitHub ↗
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {phase === 'success' && ctx && (
          <div className="mt-4 rounded-lg border-2 border-green-600 bg-green-950/40 p-4 text-center">
            <div className="mb-2 text-lg font-black text-green-300">✅ ¡APK LISTO!</div>
            <a
              href={apkUrl}
              className="inline-block rounded-lg border-b-4 border-green-950 bg-green-600 px-6 py-3 text-base font-black text-white hover:bg-green-500 active:translate-y-1 active:border-b-0"
            >
              ⬇ DESCARGAR rockanoid-debug.apk
            </a>
            <p className="mt-3 text-xs text-stone-300">
              Enlace permanente (ábrelo desde el móvil):
              <br />
              <a href={`${repoUrl}/releases/latest`} target="_blank" rel="noreferrer" className="break-all text-amber-300 underline">
                {repoUrl}/releases/latest
              </a>
            </p>
            <p className="mt-2 text-[11px] text-stone-400">
              En el móvil: abre el archivo → permite "instalar aplicaciones desconocidas" → Instalar. Si Play Protect avisa, elige "Instalar de todos modos".
            </p>
          </div>
        )}

        {phase === 'failed' && run && (
          <div className="mt-4 rounded-lg border-2 border-red-700 bg-red-950/40 p-3 text-xs">
            <div className="mb-1 font-bold text-red-300">❌ La compilación en GitHub ha fallado.</div>
            <a href={run.html_url} target="_blank" rel="noreferrer" className="text-amber-300 underline">
              Abrir la ejecución en GitHub ↗
            </a>
            <span className="text-stone-400"> → haz clic en el paso rojo, copia el texto del error y pégaselo al asistente para que lo corrija.</span>
          </div>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
          🔒 La llave solo se usa en tu navegador para hablar con GitHub: no se guarda ni se envía a ningún otro sitio. Cuando tengas el APK puedes borrarla
          en{' '}
          <a href={TOKENS_PAGE} target="_blank" rel="noreferrer" className="underline">
            github.com/settings/tokens
          </a>
          . Se suben {PROJECT_FILES.length} archivos de texto (el código del juego); el APK es de prueba (debug), sin firma de tienda.
        </p>
      </div>
    </div>
  );
}
