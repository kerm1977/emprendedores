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

## 8. Blindajes adicionales de layout (APROBADOS - prohibido tocar)

- **Hero de Inicio (`.hero-card`)**: margen superior `14px` — queda simetrico
  con los 14px de `.stats-row`. Prohibido modificar esos margenes o los
  recuadros de stats.
- **Indicador del navbar**: en vistas sin item de barra (Registrar,
  formularios, detalle) el circulo se OCULTA (`opacity: 0`); no debe quedar
  un circulo varado. El icono activo se centra con posicion absoluta
  (`top: -1px` / `0px` en <=360px), nunca con translateY aproximado.
- **Login**: la X de cierre respeta `env(safe-area-inset-top)`; tocar fuera
  del cuadro cierra y vuelve a Inicio. Campos del registro en linea vertical
  (`.login-fila` columna), sin columnas paralelas.
- **Registro de emprendimiento**: al guardar se descarga automaticamente la
  tarjeta digital del emprendimiento nuevo.
- **Acordeon de categorias (BLINDADO TOTAL)**: PROHIBIDO blur/difuminado
  sobre los grupos de abajo — todo queda siempre visible y tocable.
  Las subcategorias van indentadas ~12px a la derecha con linea vertical
  naranja de 3px a la izquierda (`border-left` en `.cat-chips`) que abraza
  toda la lista, del color del cuadro Emprendedores.
- **Enfoque de categoria abierta (`.cats-enfoque`)**: el titulo del grupo
  abierto crece a 0.95rem con opacidad 100%; los grupos sin tocar bajan a
  0.75rem con opacidad 50% y color suave (look "disabled" SOLO visual,
  siguen tocables). Al cerrar todo vuelve a 0.82rem. Transicion 0.25s.
- **Negocios**: paginacion de 10 por pagina con reinicio al cambiar filtro.
- **Sistema de antiduplicidad**: registro hace merge por cedula/telefono/
  email (nunca duplica) y vincula emprendimientos al mismo usuario.
- **Motores de busqueda por vista (BLINDADO - el alma del buscador)**:
  misma barra, motor distinto segun `App.vistaActual` en
  `renderResultados`. Negocios = solo emprendimientos; Directorio = solo
  contactos (emprendimiento/referencia/telefono); Ferias = solo ferias;
  demas vistas = busqueda global completa. El placeholder refleja el
  motor activo. NUNCA mezclar los motores entre pestanas.
- **Motor de ubicacion del registro (BLINDADO TOTAL, orden del
  usuario)**: PROHIBIDO tocar `resolverUbicacion`, `ponerMarcador`,
  `usarGeolocalizacion` en `17-registro-wizard.js` ni `22-geo-cr.js`
  salvo orden explicita. Flujo aprobado: GPS siempre vuelve (flyTo
  + alta precision); API = verdad (una sola escritura, sin parpadeo);
  anti-carrera `_ubiSeq`; poligonos locales solo sin red. Links
  Maps/Waze se guardan con el emprendimiento para navegar desde la
  ubicacion del usuario. La ubicacion queda persistida y editable.
