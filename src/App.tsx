import { useEffect, useRef, useState, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent } from 'react';
import { Game } from './game/game';
import { Renderer } from './game/renderer';
import { W, H } from './game/defs';
import GitHubUploader from './github/GitHubUploader';

const isTyping = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
};

const KEYMAP: Record<string, string[]> = {
  ArrowLeft: ['left'],
  KeyA: ['left'],
  ArrowRight: ['right'],
  KeyD: ['right'],
  ArrowUp: ['up'],
  KeyW: ['up'],
  ArrowDown: ['down'],
  KeyS: ['down'],
  Space: ['fire', 'confirm'],
  Enter: ['confirm'],
  NumpadEnter: ['confirm'],
  Escape: ['back', 'pause'],
  KeyP: ['pause'],
  KeyQ: ['quit'],
  KeyM: ['mute'],
};

const REPEATABLE = new Set(['left', 'right', 'up', 'down']);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  Boolean((window as unknown as { Capacitor?: unknown }).Capacitor) ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

const lockLandscape = () => {
  const o = screen.orientation as unknown as { lock?: (t: string) => Promise<void> } | undefined;
  o?.lock?.('landscape').catch(() => undefined);
};

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [scale, setScale] = useState(3);
  const [coarse, setCoarse] = useState(false);
  const [sound, setSound] = useState(true);
  const [app, setApp] = useState(false);
  const [installEvt, setInstallEvt] = useState<InstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [showGit, setShowGit] = useState(() => location.hash === '#apk');

  // Instalación como app (PWA): Chrome/Edge avisan con beforeinstallprompt; iOS necesita instrucciones
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    setIosHint(isIOS() && !isStandalone());
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    const { outcome } = await installEvt.userChoice;
    if (outcome === 'accepted') setInstallEvt(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new Game();
    const renderer = new Renderer(canvas);
    gameRef.current = game;

    const press = (acts: string[], repeat: boolean) => {
      game.sfx.ensure();
      for (const a of acts) {
        if (a === 'mute') {
          if (!repeat) {
            game.sfx.enabled = !game.sfx.enabled;
            setSound(game.sfx.enabled);
          }
          continue;
        }
        game.input.held.add(a);
        if (!repeat || REPEATABLE.has(a)) game.input.pressed.add(a);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      const acts = KEYMAP[e.code];
      if (!acts) return;
      e.preventDefault();
      press(acts, e.repeat);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      const acts = KEYMAP[e.code];
      if (!acts) return;
      for (const a of acts) game.input.held.delete(a);
    };
    const toLogicalX = (clientX: number) => {
      const r = canvas.getBoundingClientRect();
      return ((clientX - r.left) / r.width) * W;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.buttons === 0) return;
      game.input.mouseX = toLogicalX(e.clientX);
      game.input.mouseMoved = true;
    };
    const onPointerDown = (e: PointerEvent) => {
      game.sfx.ensure();
      game.input.mouseX = toLogicalX(e.clientX);
      if (e.pointerType !== 'mouse') game.input.mouseMoved = true;
      game.input.pressed.add('fire');
      game.input.pressed.add('confirm');
      e.preventDefault();
    };
    const onContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('contextmenu', onContextMenu);

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const STEP = 1000 / 60;
    const loop = (now: number) => {
      acc += Math.min(now - last, 100);
      last = now;
      let n = 0;
      while (acc >= STEP && n < 4) {
        game.update();
        acc -= STEP;
        n++;
      }
      if (n === 4) acc = 0;
      renderer.render(game);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const mq = window.matchMedia('(pointer: coarse)');
    const onResize = () => {
      const touch = mq.matches;
      const standalone = isStandalone();
      setCoarse(touch);
      setApp(standalone);
      const fs = !!document.fullscreenElement;
      const compact = touch || standalone || fs;
      // espacio reservado para cabecera/controles
      const padW = compact ? 8 : 32;
      const padH = fs ? 0 : compact ? (touch ? 62 : 12) : 150;
      const availW = window.innerWidth - padW;
      const availH = window.innerHeight - padH;
      const raw = Math.min(availW / W, availH / H);
      // escala entera para píxeles perfectos en pantallas grandes; fraccionaria en móviles
      const s = raw >= 2 ? Math.floor(raw) : Math.max(0.5, Math.floor(raw * 20) / 20);
      setScale(s);
    };
    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('fullscreenchange', onResize);
    mq.addEventListener('change', onResize);
    if (isStandalone()) lockLandscape();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('fullscreenchange', onResize);
      mq.removeEventListener('change', onResize);
    };
  }, []);

  const touch = (act: string, down: boolean) => {
    const game = gameRef.current;
    if (!game) return;
    game.sfx.ensure();
    if (down) {
      game.input.held.add(act);
      game.input.pressed.add(act);
    } else {
      game.input.held.delete(act);
    }
  };

  const toggleSound = () => {
    const game = gameRef.current;
    if (!game) return;
    game.sfx.ensure();
    game.sfx.enabled = !game.sfx.enabled;
    setSound(game.sfx.enabled);
  };

  const fullscreen = () => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      const p = el.requestFullscreen?.();
      if (p && typeof p.then === 'function') p.then(lockLandscape).catch(() => undefined);
    }
  };

  const compact = coarse || app;
  const btn =
    'select-none touch-none rounded-lg border-b-4 border-stone-900 bg-stone-700 px-3 py-2 text-base font-bold text-amber-100 active:translate-y-1 active:border-b-0';
  const hold = (act: string) => ({
    onPointerDown: (e: RPointerEvent) => {
      e.preventDefault();
      touch(act, true);
    },
    onPointerUp: () => touch(act, false),
    onPointerLeave: () => touch(act, false),
    onPointerCancel: () => touch(act, false),
    onContextMenu: (e: RMouseEvent) => e.preventDefault(),
  });

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center bg-[#14121c] font-mono text-stone-300 ${compact ? 'gap-1 p-1' : 'gap-3 px-4 py-4'}`}
      style={{ paddingTop: 'max(env(safe-area-inset-top), 4px)', paddingBottom: 'max(env(safe-area-inset-bottom), 4px)' }}
    >
      {!compact && (
        <header className="flex items-center gap-3 text-xs tracking-widest text-stone-400 uppercase">
          <span className="rounded-sm bg-red-700 px-2 py-0.5 text-[10px] font-black text-white">8-BIT</span>
          <span className="font-bold text-amber-300">ROCKANOID</span>
          <span>· LA ERA DE PIEDRA · 40 RONDAS</span>
        </header>
      )}

      <div
        ref={shellRef}
        className={`flex items-center justify-center bg-black ${
          compact ? 'rounded-md border-2 border-[#2a2733]' : 'rounded-2xl border-[10px] border-[#2a2733] p-1 shadow-[0_0_0_2px_#3b3745,0_20px_60px_rgba(0,0,0,0.7)]'
        }`}
      >
        <canvas
          ref={canvasRef}
          style={{ width: W * scale, height: H * scale, imageRendering: 'pixelated', touchAction: 'none' }}
          className={`block bg-black ${coarse ? '' : 'cursor-none'}`}
          aria-label="Rockanoid: juego estilo Master System"
        />
      </div>

      {!compact && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-stone-500">
          <span>
            <b className="text-stone-300">← →</b> / ratón mover
          </span>
          <span>
            <b className="text-stone-300">ESPACIO</b> lanzar · disparar
          </span>
          <span>
            <b className="text-stone-300">ENTER</b> aceptar
          </span>
          <span>
            <b className="text-stone-300">P</b> pausa
          </span>
          <button onClick={toggleSound} className="rounded border border-stone-600 px-2 py-0.5 text-stone-300 hover:bg-stone-800">
            {sound ? '♪ SONIDO: SI' : '♪ SONIDO: NO'}
          </button>
          <button onClick={fullscreen} className="rounded border border-stone-600 px-2 py-0.5 text-stone-300 hover:bg-stone-800">
            ⛶ PANTALLA COMPLETA
          </button>
          {installEvt && (
            <button onClick={installApp} className="rounded border border-amber-500 bg-amber-600/20 px-2 py-0.5 font-bold text-amber-300 hover:bg-amber-600/40">
              📲 INSTALAR COMO APP
            </button>
          )}
          <button
            onClick={() => setShowGit(true)}
            className="rounded border border-red-500 bg-red-700/30 px-2 py-0.5 font-bold text-red-200 hover:bg-red-700/60"
            title="Sube el juego a tu GitHub y genera el APK (Opción B) sin salir de aquí"
          >
            📦 CREAR APK (OPCIÓN B)
          </button>
        </div>
      )}

      {coarse && !app && (
        <button
          onClick={() => setShowGit(true)}
          className="rounded border border-red-500 bg-red-700/30 px-3 py-1 text-[11px] font-bold text-red-200"
        >
          📦 CREAR APK CON GITHUB (OPCIÓN B)
        </button>
      )}

      {showGit && <GitHubUploader onClose={() => setShowGit(false)} />}

      {(installEvt || iosHint) && !app && (
        <div className="flex max-w-xl flex-wrap items-center justify-center gap-2 rounded-lg border border-amber-700/60 bg-amber-900/20 px-3 py-2 text-center text-[11px] text-amber-200">
          {installEvt ? (
            <>
              <span>Puedes tener ROCKANOID como una app en este dispositivo:</span>
              <button onClick={installApp} className="rounded bg-amber-500 px-3 py-1 font-bold text-stone-900 active:translate-y-px">
                📲 INSTALAR COMO APP
              </button>
            </>
          ) : (
            <span>
              iPhone/iPad: pulsa <b>Compartir</b> (cuadrado con flecha) → <b>Añadir a pantalla de inicio</b> para tenerlo como app.
            </span>
          )}
        </div>
      )}

      {coarse && (
        <div className="flex w-full max-w-2xl items-center justify-between gap-2 px-1">
          <div className="flex gap-2">
            <button className={btn} {...hold('left')}>
              ◀
            </button>
            <button className={btn} {...hold('right')}>
              ▶
            </button>
          </div>
          <div className="flex gap-1 text-[10px] text-stone-500">
            <button onClick={toggleSound} className="rounded border border-stone-700 px-2 py-1">
              {sound ? '♪ SI' : '♪ NO'}
            </button>
            {!app && (
              <button onClick={fullscreen} className="rounded border border-stone-700 px-2 py-1">
                ⛶
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button className={btn} {...hold('up')}>
              ▲
            </button>
            <button className={btn} {...hold('down')}>
              ▼
            </button>
            <button className={btn} {...hold('pause')}>
              II
            </button>
            <button
              className={btn + ' bg-red-800'}
              onPointerDown={(e) => {
                e.preventDefault();
                touch('fire', true);
                touch('confirm', true);
              }}
              onPointerUp={() => {
                touch('fire', false);
                touch('confirm', false);
              }}
              onPointerCancel={() => {
                touch('fire', false);
                touch('confirm', false);
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
