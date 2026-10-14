# 📲 Cómo conseguir el APK de ROCKANOID sin saber programar

No necesitas instalar nada en tu ordenador ni escribir comandos. Solo una cuenta gratuita de GitHub
y un navegador (Chrome o Edge). GitHub compilará el APK por ti en unos 8 minutos.

---

## ⚡ Vía rápida: desde el propio juego (recomendada)

Abre el juego en el navegador y pulsa el botón rojo **📦 CREAR APK (OPCIÓN B)** que hay debajo de la pantalla
(también se abre con la dirección del juego seguida de `#apk`). El asistente hace todo lo de abajo por ti:

1. **①** Si no tienes cuenta de GitHub, créala con el botón (gratis) y **confirma el correo**.
2. **②** Pulsa **CREAR LLAVE**: se abre GitHub con todo ya marcado. Baja hasta el final, pulsa el botón verde
   **Generate token** y copia el texto que empieza por `ghp_`.
3. **③** Pega la llave en el juego y pulsa **🚀 SUBIR Y COMPILAR APK**.

El juego sube su propio código a tu GitHub, arranca la compilación y, cuando termina (6‑10 min), te muestra el
botón **⬇ DESCARGAR rockanoid-debug.apk** y el enlace permanente para abrirlo desde el móvil.
La llave solo se usa en tu navegador; cuando tengas el APK puedes borrarla en <https://github.com/settings/tokens>.

Si prefieres hacerlo a mano (arrastrando archivos), sigue los pasos siguientes.

> **¿Por qué tengo que hacerlo yo?** Un APK solo puede fabricarlo un ordenador con las herramientas de
> Android instaladas. El asistente que creó el juego no las tiene ni puede entrar en tu cuenta de GitHub,
> pero ha dejado preparado un "robot" (`.github/workflows/build-apk.yml`) que lo hace todo solo en cuanto
> los archivos estén en tu repositorio. Tu única tarea es **subir los archivos**.

---

## Paso 1 · Descarga el proyecto a tu ordenador

1. Descarga este proyecto (botón de **Descargar / Exportar** de la herramienta donde lo creaste) y descomprime el ZIP.
2. Abre la carpeta. Si dentro ves las carpetas **`node_modules`** o **`dist`**, **bórralas** (son muy pesadas y no hacen falta).
3. Deben quedar, más o menos, estos archivos y carpetas:

```
.github/            ← contiene el "robot" que compila el APK (carpeta oculta en Mac, ver nota)
public/
scripts/
src/
capacitor.config.json
index.html
package.json
tsconfig.json
vite.config.ts
README.md
COMO-SUBIR-A-GITHUB.md
```

> 🍎 **En Mac** las carpetas que empiezan por punto (`.github`) están ocultas. Pulsa **Cmd + Shift + .** dentro
> de la carpeta para verlas. **En Windows** se ven normalmente.

---

## Paso 2 · Crea una cuenta y un repositorio en GitHub

1. Entra en <https://github.com> y pulsa **Sign up** (es gratis). Confirma el correo.
2. Arriba a la derecha pulsa el botón **＋** → **New repository**.
3. En **Repository name** escribe: `rockanoid`
4. Deja marcado **Public**. No marques nada más.
5. Pulsa el botón verde **Create repository**.

---

## Paso 3 · Sube los archivos arrastrándolos

1. En la página que aparece, busca la frase *"…or **uploading an existing file**"* y haz clic en ese enlace.
2. Abre la carpeta del proyecto en tu ordenador, **selecciona TODO lo que hay dentro** (Ctrl+A en Windows,
   Cmd+A en Mac) y **arrástralo** a la zona que dice *"Drag files here to add them to your repository"*.

   ⚠️ Arrastra el **contenido** de la carpeta, no la carpeta en sí. Si arrastras la carpeta `rockanoid` entera,
   quedará todo metido en una subcarpeta y no funcionará.

   ⚠️ Usa **arrastrar y soltar**. El botón *"choose your files"* no permite subir carpetas.

   ⚠️ Súbelo **todo de una vez**. Si lo subes en varias tandas, las primeras ejecuciones del robot saldrán en
   rojo (faltan archivos) y solo la última saldrá en verde. No pasa nada, pero asusta.

3. Espera a que termine la barra de progreso de cada archivo.
4. Baja hasta el final y pulsa el botón verde **Commit changes**.

---

## Paso 4 · Activa el "robot" (GitHub Actions)

1. Pulsa la pestaña **Actions** (arriba, junto a *Code* y *Pull requests*).
2. Si aparece un botón verde **"I understand my workflows, go ahead and enable them"**, púlsalo.
3. Debes ver a la izquierda un workflow llamado **"Compilar APK de Android"**.
   - Lo normal es que **ya se esté ejecutando** (se lanza solo al subir los archivos). Verás un punto amarillo 🟡.
   - Si no se está ejecutando, haz clic en su nombre → botón **Run workflow** → **Run workflow** (verde).

> ❓ **¿No aparece ningún workflow?** Es que la carpeta oculta `.github` no se subió (pasa en Mac). Solución:
> 1. Vuelve a la pestaña **Code** → botón **Add file** → **Create new file**.
> 2. En el nombre escribe exactamente: `.github/workflows/build-apk.yml`
> 3. Pega dentro el contenido que hay al final de esta guía (sección *"Contenido del workflow"*).
> 4. Pulsa **Commit changes** (dos veces). El robot arrancará solo.

---

## Paso 5 · Espera y descarga el APK

1. En **Actions**, la ejecución pasa de 🟡 (en marcha) a ✅ verde en unos **6‑10 minutos**.
2. Haz clic en la ejecución verde: arriba del todo verás un recuadro **"✅ ¡APK generado correctamente!"**
   con el enlace de descarga.
3. También puedes ir a la pestaña **Code** → columna derecha → **Releases** → **"Rockanoid APK (build 1)"** →
   en *Assets* está **`rockanoid-debug.apk`**. Ese es tu juego.

**Enlace directo** (sirve siempre para la última versión, puedes abrirlo desde el móvil):

```
https://github.com/TU-USUARIO/rockanoid/releases/latest
```

Sustituye `TU-USUARIO` por tu nombre de usuario de GitHub.

---

## Paso 6 · Instálalo en el móvil Android

1. Abre el enlace anterior en el **Chrome del móvil** y toca **`rockanoid-debug.apk`** para descargarlo.
2. Toca la descarga para abrirla.
3. Android dirá *"Por seguridad, tu teléfono no puede instalar aplicaciones desconocidas de esta fuente"* →
   pulsa **Ajustes** → activa **"Permitir de esta fuente"** → vuelve atrás → **Instalar**.
4. Si **Play Protect** avisa de "aplicación desconocida", elige **"Instalar de todos modos"**
   (es normal: es un APK de pruebas que no viene de la Play Store).
5. ¡Listo! Verás el icono de **Rockanoid** (un hueso y una piedra) en tu pantalla de inicio.

---

## Opcional · Jugar/instalar desde el navegador (sin APK)

También puedes publicar el juego como **aplicación web instalable (PWA)**, ideal para iPhone o para compartirlo
con un enlace:

1. **Actions** → workflow **"Publicar PWA en GitHub Pages"** → **Run workflow** → **Run workflow**.
2. Al acabar (✅), tu juego estará en: `https://TU-USUARIO.github.io/rockanoid/`
3. Ábrelo en el móvil: en **Chrome (Android)** → menú ⋮ → **"Instalar aplicación"**;
   en **Safari (iPhone)** → botón Compartir → **"Añadir a pantalla de inicio"**.

> Si ese workflow falla con un error de permisos de *Pages*: **Settings** (del repositorio) → **Pages** →
> en *Build and deployment / Source* elige **GitHub Actions**, y vuelve a lanzarlo.

---

## Si algo sale mal

- **La ejecución sale en rojo ❌**: haz clic en ella. Arriba verá un recuadro con el motivo en español
  (por ejemplo, *"Faltan archivos en el repositorio"*). Si no está claro, haz clic en el paso rojo, copia el
  texto del error y pégaselo al asistente que te creó el juego: te dirá qué cambiar. Después, repite
  **Run workflow** (o **Re-run jobs**).
- **Cada vez que cambies algo** en el proyecto y lo vuelvas a subir, se generará un APK nuevo automáticamente
  (aparecerá como una nueva *Release*: build 2, build 3…).

---

## Contenido del workflow (solo si tuviste que crearlo a mano en el Paso 4)

Copia **todo** este bloque (botón 📋 arriba a la derecha del bloque) y pégalo en el archivo
`.github/workflows/build-apk.yml`:

```yaml
name: Compilar APK de Android

on:
  push:
    branches: ['**']
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: apk-${{ github.ref }}
  cancel-in-progress: true

jobs:
  apk:
    name: Generar rockanoid-debug.apk
    runs-on: ubuntu-latest
    timeout-minutes: 45

    steps:
      - name: Descargar el codigo del repositorio
        uses: actions/checkout@v7

      - name: Comprobar que se subieron todos los archivos
        run: |
          faltan=0
          for f in package.json index.html vite.config.ts tsconfig.json capacitor.config.json \
                   src/main.tsx src/App.tsx src/game/game.ts src/game/renderer.ts \
                   public/manifest.webmanifest scripts/make-icons.mjs; do
            if [ ! -e "$f" ]; then
              echo "::error::Falta el archivo $f"
              faltan=1
            fi
          done
          if [ "$faltan" = 1 ]; then
            {
              echo "## ❌ Faltan archivos en el repositorio"
              echo ""
              echo "Sube el **contenido** de la carpeta del proyecto (no la carpeta entera), incluidas las subcarpetas"
              echo "\`src\`, \`public\` y \`scripts\` y los archivos \`package.json\`, \`index.html\`, \`vite.config.ts\`,"
              echo "\`tsconfig.json\` y \`capacitor.config.json\`. Después, este proceso se repetirá solo."
            } >> "$GITHUB_STEP_SUMMARY"
            exit 1
          fi
          echo "✔ Todos los archivos necesarios están presentes."

      - name: Instalar Node 22
        uses: actions/setup-node@v7
        with:
          node-version: 22
          package-manager-cache: false

      - name: Instalar JDK 21 (requisito de Capacitor 8)
        uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: 21

      - name: Instalar SDK de Android
        uses: android-actions/setup-android@v4

      - name: Instalar dependencias del proyecto
        run: npm install --no-audit --no-fund

      - name: Generar iconos pixel-art (PWA + Android)
        continue-on-error: true
        run: node scripts/make-icons.mjs

      - name: Compilar el juego (web)
        run: npm run build

      - name: Crear el proyecto Android con Capacitor
        run: |
          if [ ! -d android ]; then npx cap add android; fi
          npx cap sync android

      - name: Icono de launcher y pantalla de carga nativos
        continue-on-error: true
        run: >
          npx --yes @capacitor/assets generate --android
          --iconBackgroundColor '#14121c' --iconBackgroundColorDark '#14121c'
          --splashBackgroundColor '#14121c' --splashBackgroundColorDark '#14121c'

      - name: Forzar orientacion horizontal y pantalla completa
        continue-on-error: true
        run: |
          M=android/app/src/main/AndroidManifest.xml
          S=android/app/src/main/res/values/styles.xml
          grep -q 'screenOrientation' "$M" || sed -i '0,/<activity/s//<activity android:screenOrientation="sensorLandscape"/' "$M"
          grep -q 'windowFullscreen' "$S" || sed -i 's#<item name="windowNoTitle">true</item>#&<item name="android:windowFullscreen">true</item>#' "$S"

      - name: Compilar APK con Gradle
        working-directory: android
        run: |
          chmod +x gradlew
          ./gradlew assembleDebug --no-daemon

      - name: Renombrar el APK
        run: cp android/app/build/outputs/apk/debug/app-debug.apk rockanoid-debug.apk

      - name: Guardar APK como artefacto de la ejecucion
        uses: actions/upload-artifact@v7
        with:
          name: rockanoid-apk
          path: rockanoid-debug.apk
          if-no-files-found: error

      - name: Publicar APK en Releases (descarga directa)
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v1.0.${{ github.run_number }}
          name: Rockanoid APK (build ${{ github.run_number }})
          files: rockanoid-debug.apk
          body: |
            ## ROCKANOID - La Era de Piedra
            Descarga `rockanoid-debug.apk` desde el movil, abrelo y acepta
            "Instalar aplicaciones desconocidas". Si Play Protect avisa,
            elige "Instalar de todos modos".
            (C) 2026 Physical Dreams

      - name: Resumen con el enlace de descarga
        if: success()
        run: |
          {
            echo "## ✅ ¡APK generado correctamente!"
            echo ""
            echo "### 📲 Descárgalo desde el móvil: https://github.com/${{ github.repository }}/releases/latest"
          } >> "$GITHUB_STEP_SUMMARY"

      - name: Ayuda si algo fallo
        if: failure()
        run: |
          {
            echo "## ❌ La compilación ha fallado"
            echo ""
            echo "Haz clic en el paso marcado en rojo (arriba), copia el texto del error y pégaselo al asistente que creó el juego."
          } >> "$GITHUB_STEP_SUMMARY"
```
