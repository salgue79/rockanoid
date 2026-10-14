# 🦕 ROCKANOID – La Era de Piedra

Arkanoid prehistórico estilo **Sega Master System** (256×192, paleta de 64 colores, sonido PSG) con **40 rondas**,
5 zonas, 13 tipos de bloque, 7 huevos mágicos y un T‑Rex final. Hecho con React + Vite + Canvas.

```bash
npm install
node scripts/make-icons.mjs   # genera iconos (PWA + Android) en pixel-art, una sola vez
npm run dev                   # jugar en el navegador
npm run build                 # genera dist/ (un único index.html + public/)
```

---

## 📱 Instalar el juego en el móvil

Hay tres formas, de la más rápida a la más "oficial":

| Vía | Qué necesitas | Resultado |
| --- | --- | --- |
| **A. PWA** (Añadir a pantalla de inicio) | Subir `dist/` a cualquier hosting HTTPS | Icono en el móvil, pantalla completa, sin conexión. 2 minutos. |
| **B. APK con GitHub Actions** | Una cuenta de GitHub | Un `rockanoid-debug.apk` descargable. Sin instalar nada en tu PC. |
| **C. APK en tu PC** | Android Studio + JDK 21 | APK debug o release firmado, listo para Play Store. |

> ⚠️ Un APK solo puede compilarse con el SDK de Android (Java + Gradle). Este repositorio ya trae todo configurado
> (Capacitor, iconos, workflow) para que lo generes con un clic por la vía B o C.

---

### A) PWA – instalar desde el navegador

1. `node scripts/make-icons.mjs && npm run build`
2. Sube la carpeta `dist/` a un hosting HTTPS (Netlify, Vercel, GitHub Pages, Cloudflare Pages…).
   Debe servirse desde la raíz del dominio (`https://tu-sitio/`).
3. Abre la URL en **Chrome (Android)** → menú ⋮ → **"Instalar aplicación"** / **"Añadir a pantalla de inicio"**.
   En **Safari (iPhone)** → Compartir → **"Añadir a pantalla de inicio"**.

La app se abre a pantalla completa en horizontal, con su icono, y funciona sin conexión gracias al service worker
(`public/sw.js`). El manifiesto está en `public/manifest.webmanifest`.

---

### B) APK automático con GitHub Actions (recomendado)

> ⚡ **Lo más fácil: desde el propio juego.** Pulsa el botón **📦 CREAR APK (OPCIÓN B)** bajo la pantalla del
> juego (o abre la URL con `#apk`). Con una llave (token) de tu cuenta de GitHub, el juego sube su código a tu
> repositorio, lanza la compilación y te muestra el botón de descarga del APK cuando termina.
>
> 👉 **Guía sin conocimientos técnicos, paso a paso:
> [COMO-SUBIR-A-GITHUB.md](./COMO-SUBIR-A-GITHUB.md)** (incluye la vía manual arrastrando archivos).

1. Crea un repositorio en GitHub y sube este proyecto (arrastrando los archivos en la web o con `git push`).
2. El workflow **"Compilar APK de Android"** arranca solo con cada subida a `main`
   (o lánzalo desde la pestaña **Actions** → **Run workflow**).
3. Al terminar (~6‑10 min) el APK aparece en la sección **Releases** del repositorio:
   `https://github.com/TU-USUARIO/rockanoid/releases/latest` → `rockanoid-debug.apk`
   (también como artefacto `rockanoid-apk` dentro de la ejecución).
4. Ábrelo desde el móvil y acepta **"Instalar apps de origen desconocido"**.

El workflow (`.github/workflows/build-apk.yml`) hace exactamente esto: Node 22 + JDK 21 + Android SDK →
`npm install` → iconos → `npm run build` → `npx cap add android` → `npx cap sync` → iconos nativos →
orientación horizontal + pantalla completa → `./gradlew assembleDebug` → Release con el APK.

También hay un segundo workflow manual, **"Publicar PWA en GitHub Pages"** (`.github/workflows/deploy-pwa.yml`),
que deja el juego instalable desde el navegador en `https://TU-USUARIO.github.io/rockanoid/`.

---

### C) APK en tu ordenador (Android Studio)

Requisitos: [Android Studio](https://developer.android.com/studio) (incluye el SDK y un JDK 21), Node 22+.

```bash
npm install
node scripts/make-icons.mjs        # iconos PWA + assets/ para Android
npm run build                      # dist/
npx cap add android                # crea la carpeta android/ (solo la primera vez)
npx cap sync android               # copia dist/ dentro del proyecto nativo

# icono de launcher + splash en pixel-art (opcional pero recomendado)
npx @capacitor/assets generate --android --iconBackgroundColor '#14121c' --splashBackgroundColor '#14121c'

# Opción 1: desde terminal
cd android && ./gradlew assembleDebug        # → android/app/build/outputs/apk/debug/app-debug.apk

# Opción 2: con Android Studio
npx cap open android                         # Build ▸ Build Bundle(s)/APK(s) ▸ Build APK(s)
```

**Recomendado**: en `android/app/src/main/AndroidManifest.xml` añade a la `<activity>` principal
`android:screenOrientation="sensorLandscape"` (el juego es horizontal), y en
`android/app/src/main/res/values/styles.xml` añade `<item name="android:windowFullscreen">true</item>`
al estilo `AppTheme.NoActionBar` para ocultar la barra de estado. (El workflow de GitHub lo hace automáticamente.)

#### APK/AAB de release (Play Store)

```bash
keytool -genkey -v -keystore rockanoid.keystore -alias rockanoid -keyalg RSA -keysize 2048 -validity 10000
cd android && ./gradlew bundleRelease    # .aab para Google Play
cd android && ./gradlew assembleRelease  # .apk release
```

Configura la firma en `android/app/build.gradle` (`signingConfigs`) o fírmalo desde Android Studio
(**Build ▸ Generate Signed Bundle / APK**). No subas nunca el `.keystore` al repositorio.

---

### Alternativa sin código: PWABuilder

Si ya tienes la PWA publicada (vía A), entra en <https://www.pwabuilder.com>, pega la URL y descarga el paquete
Android (TWA). Genera un APK/AAB listo para la tienda a partir del manifiesto.

---

## Estructura relevante

```
capacitor.config.json          # appId com.physicaldreams.rockanoid, webDir dist
scripts/make-icons.mjs         # iconos PWA + assets/ Android (PNG puro, sin dependencias)
public/manifest.webmanifest    # manifiesto PWA (fullscreen, landscape)
public/sw.js                   # service worker (offline)
.github/workflows/build-apk.yml# compilación del APK en la nube
src/game/                      # motor: niveles, sprites, audio, física, render
```

## Controles

| Acción | Teclado | Móvil |
| --- | --- | --- |
| Mover | ← → / A D / ratón | Arrastrar sobre la pantalla o botones ◀ ▶ |
| Lanzar / disparar / aceptar | Espacio / Enter | Tocar la pantalla o botón **OK** |
| Menú arriba/abajo | ↑ ↓ | ▲ ▼ |
| Pausa | P / Esc | **II** |
| Sonido | M | ♪ |

Para empaquetar **otro juego** con el mismo método, copia `capacitor.config.json` (cambiando `appId`/`appName`),
`scripts/make-icons.mjs`, `public/manifest.webmanifest`, `public/sw.js` y el workflow a ese proyecto.
