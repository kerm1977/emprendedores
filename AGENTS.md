# Reglas del proyecto AGENDATRIBUPRO / Flask

## 1. REGLA SAGRADA - Límite de 250 líneas (BLINDADO)

- **NINGÚN archivo puede superar las 250 líneas de código. Sin excepciones.**
- Aplica a TODO archivo de código: `.js`, `.css`, `.html`, `.py` y cualquier otro.
- Si un módulo se acerca al límite (~230+), dividirlo ANTES de superarlo, no esperar a que pase.
- Verificar siempre tras editar con `python herramientas/verificar_lineas.py`.
- Usar `herramientas/partir_si_pasa.py` para partir automáticamente cualquier archivo que supere el límite.
- Única excepción documentada: `templates/base.html` (monolito original CONGELADO, reemplazado por `www/`; no editar, está en desuso).

## 2. Librerías y dependencias

- No se permiten CDNs. Todas las librerías (Bootstrap, Font Awesome, jsPDF, pdf.js, html2canvas, LocalForage) deben estar en `static/vendor/`.
- Los estilos propios van en `static/css/`.
- La lógica JavaScript propia va en `static/js/`, ordenada numéricamente por dependencia.

## 3. Persistencia

- La base de datos oficial es **SQLite** (`tribu.sqlite` por defecto).
- `loadData()` y `saveData()` deben leer/escribir a través de los endpoints `/api/data` de Flask.
- La importación de JSON debe terminar guardando en SQLite.

## 4. PWA

- `static/sw.js` no debe cachear en desarrollo.
- `static/manifest.json` debe apuntar a rutas locales bajo `/static/`.

## 5. Compilaciones APK (BLINDADO)

- Toda compilación (APK/AAB) debe copiarse SIEMPRE a `C:\Users\MINIOS\Desktop\App\` con nombre descriptivo (`Emprende-debug.apk`, `Emprende-v1.apk`, etc.).
- Comando build: `cd android && ./gradlew assembleDebug` → salida en `android/app/build/outputs/apk/debug/app-debug.apk`.
- `local.properties` usa `sdk.dir=C:/Users/MINIOS/android-sdk` (slashes normales, nunca invertidas dobles).

## 6. Modularidad del HTML

- Las vistas, modales y parciales deben estar en `templates/vistas/`, `templates/modales/` y `templates/parciales/`.
- `templates/_cuerpo.html` debe reconstruirse idéntica al `<body>` original.

## 7. Decisiones blindadas del frontend (APROBADAS - no revertir)

- **Modal de categorías del wizard**: aprobado como "perfecto e inmejorable". Caja centrada (máx 480px, 80vh), fondo blur, X roja fija (`#dc2626`, 48px, ícono blanco) SIEMPRE visible con `position: fixed`. NO cambiar su diseño.
- **Inputs del registro**: borde naranja (`--primary-color`) SIEMPRE visible con glow suave, no solo en focus. Incluye `.emp-campo`, `.emp-dia-horas` y `.emp-cat-btn`.
- **Wizard de registro** (`#view-registro-emp`): 6 pasos (categoría → datos básicos → contacto → ubicación/mapa → redes → pluses+horario+descripción). Título centrado, "Paso X de 6" grande, cada paso centra contenido vertical/horizontal, `.paso[hidden]` debe tener `display:none` explícito (flex lo anula).
- **Nomenclatura anti-colisión**: el acordeón de Inicio usa `.cat-*`; el modal del wizard usa `.mcat-*`. NUNCA reutilizar clases `.cat-*` fuera del acordeón de Inicio.
- **Destacados**: son favoritos POR USUARIO (corazón en tarjeta, requiere sesión, `App.data.destacados[email]`). La sección en Inicio se OCULTA si el usuario no tiene destacados. Ya no es ranking por clics.
- **Teléfonos CR**: se ignoran códigos de país (se toman los últimos 8 dígitos). WhatsApp solo habilitado si el número local empieza con 6, 7 u 8; el resto va deshabilitado visible.
- **Mapas**: los links "cómo llegar" (Maps/Waze) se AUTO-GENERAN desde la ubicación marcada en el mapa Leaflet (vendored, tiles OSM online). `urlDireccion()` arma rutas `dir/?api=1&destination=` y `waze.com/ul?navigate=yes`.
- **APK**: builds con nombre versionado en `Desktop\App\` (`Emprende-debug.apk`, `Emprende-debug-v2.apk`...) sin sobreescribir anteriores.
