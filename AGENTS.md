# Reglas del proyecto AGENDATRIBUPRO / Flask

## 1. REGLA SAGRADA - Límite de 250 líneas (BLINDADO)

- **NINGÚN archivo puede superar las 300 líneas de código. Sin excepciones.**
- Aplica a TODO archivo de código: `.js`, `.css`, `.html`, `.py` y cualquier otro.
- Si un módulo se acerca al límite (~280+), dividirlo ANTES de superarlo, no esperar a que pase.
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

- Orden vigente del usuario: compilar cada cambio para probar paso a paso; reemplaza la pausa anterior de compilaciones. Verificar antes de compilar y no afirmar funcionamiento en el teléfono sin probarlo.

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

## 7. Google OAuth - BLINDADO TOTAL (funcionando, no tocar)

Configuracion verificada funcionando. Prohibido modificar cualquier pieza sin orden explicita del usuario:

- Plugin: `@capgo/capacitor-social-login` (frontend `www/js/26-google.js`, `SocialLogin` en `Capacitor.Plugins`)
- `capacitor.config.json` y `android/app/google-services.json`: ambos clientes OAuth (web `68651650199-vd3t...` y android `68651650199-dkec...`) del proyecto `crud-457015`
- `android/app/.../MainActivity.java` implementa `ModifiedMainActivityForSocialLoginPlugin` (interfaz marcador exigida por el plugin)
- Consent screen: "En produccion" (publicado) — cualquier cuenta Google entra
- SHA-1 debug: `F6:1F:8A:B9:66:CE:FE:D2:1E:E4:DA:52:08:EE:52:73:7C:01:9D:21`
- Backend: `google_routes.py` (`/api/auth/google`, verifica idToken, antiduplicidad por email, guarda foto)
- Sin Firebase, sin servicios pagos: google-services.json es solo el descriptor OAuth

## 9. BLINDAJE TOTAL (orden del usuario - prohibido tocar)

**REGLA**: Nada de esta lista se puede modificar, eliminar ni quitar
ni un punto ni una coma SIN orden explicita del usuario. Antes de
tocar cualquier pieza de aqui, PREGUNTAR al usuario.

- **Layout responsivo sin marcos**: `.app-main` y `.app-topbar` a
  `width:100%` sin max-width; `.emp-form` y `.perfil-card` sin tope;
  contenido directo en pantalla, flexbox/fluido. PROHIBIDO volver a
  meter columnas centradas ni marcos de celular.
- **Service worker** (`www/sw.js`): solo mismo origen + GET, siempre
  devuelve Response (503 si falla), nunca `undefined`. Prohibido
  regresar `caches.match` sin fallback Response.
- **Init paralelo y aislado** (`99-init.js`): parciales via
  `Promise.all` con catch por init; listeners de ajustes
  (`btn-sync-ahora`, `btn-usuarios`, `btn-logout`) delegados en
  `document` — PROHIBIDO cablearlos por `getElementById` directo.
- **saveData coalescido** (`02-datos.js`): escrituras agrupadas 600ms
  (IndexedDB + POST). Server-first intacto.
- **Ajustes centralizado** (`parciales/ajustes.html`): las 12 filas
  (perfil, sync, DB, servidor, usuarios, prohibidas, terminos,
  acerca, cerrar sesion + busqueda inteligente, diccionario,
  conexion del Dashboard).
- **Perfil completo**: `perfil-datos` (telefono/cedula), campana
  notificaciones, botones Dashboard/Ajustes/Cerrar sesion,
  `perfil-stats` (metricas con tarjetas explicadas),
  `renderPerfil` con try/catch (nunca en blanco).
- **Likes privados, regla vigente posterior** (`28-reportes.js`): activar y desactivar libremente cuantas veces quiera el usuario. Retirar descuenta el voto actual; reactivar reutiliza ese mismo registro, elimina `retiradoEn` y reinicia `ts` sin inflar el total. Tres meses calendario en Costa Rica desde la última activación; al vencer el corazón se apaga, el histórico no se resta y el siguiente like suma un nuevo registro. `totalLikes`/`likesContables` excluyen retirados. El creador nunca puede votar su propio negocio.
- **Listado, orden vigente de espacios pagados**: dos tarjetas por fila, sin corazones, banderas ni descarga; provincia y distrito debajo. El espacio pagado muestra todas las promociones vigentes hasta la capacidad configurada (10 iniciales), sin esconder anunciantes pagados en otra página. La antigua paginación del catálogo no aplica a este espacio nuevo. Los gratuitos siguen visibles abajo en carrusel por categorías aleatorias, lento y deslizable; no alterar relevancia del buscador ni reordenar datos del servidor. Catálogo mantiene Verdurero: NO agregar Verdulería duplicada.
- **Reportes**: 6 motivos (contenido peligroso, falsedad empresa, falsedad productos, robo, fraude y Otro) + descripción -> `App.data.reportes`. Orden posterior del usuario: mostrar advertencia sobre denuncias por competencia o sin fundamento y posible suspensión temporal tras revisión. Es solo una advertencia: no implementar sanciones automáticas.
- **Palabras prohibidas** (`29-prohibidas.js`): envuelve los 4
  buscadores; query prohibida = "no encontrado".
- **Notificaciones super** (`30-notificaciones.js`): reporte,
  prohibida, eliminacion de negocio; `renderDashboard` = resumen
  global + lista de reportes.
- **Roles** (`31-roles.js`): super todo / admin1 sin borrar supers ni
  dar rol super / admin2 sin borrar usuarios / user normal. Selector
  de rol en tarjetas de usuarios. Todas las vias de registro
  (Google/huella/correo) = mismas capacidades.
- **Pausa de negocio**: `e.pausa` oculta en buscador y listas;
  reactivable; advertencia previa. **Eliminar**: confirmacion 4 pasos.
- **Paso 4 ubicacion**: toggle "con/sin direccion fisica" ->
  `e.sinUbicacion` oculta mapa/campos; detalle dice
  "Servicio a domicilio". Motor de geolocalizacion ya estaba blindado.
- **Horario**: checkboxes 24h y feriados + boton "24 horas-365 dias"
  (7 dias a 00:00-23:59 -> `horarioTexto` = "24 horas-365 dias").
- **Pluses de pago**: PayPal, wallet, cripto, transferencia,
  pagos en linea (iconos fas).
- **Pagina web**: `emp-web` -> `e.web` -> boton globe en detalle.
- **Foto de perfil registro (orden vigente)**: compresión en `07b-foto-perfil.js`, JPEG máximo 640 px y 800 KB de bytes reales (nunca 1 MB). Subida confirmada por `/api/uploads`, sin aceptar base64 local como prueba de subida remota; PUT `/api/usuarios/{id}` conserva ruta `/uploads/usr-{id}.jpg`. Avatar resuelve rutas con `urlLogoNegocio`. `uploads_routes.py` aplica 800 KB; su directorio es `BASE_DIR/uploads`, que al desplegar en `/home/kenth1977/syncapp` corresponde a la carpeta de PythonAnywhere indicada por el usuario. Cambios de backend requieren despliegue y recarga de la web remota.
- **Permisos iniciales Android (integración autorizada)**: `PermisosIniciales.java` solicita una sola vez cámara, imágenes/selección parcial, ubicación en primer plano, lectura de contactos y notificaciones según versión. Persistir intento también ante rechazo, sin insistir en siguientes aperturas ni leer contactos. Se autorizó únicamente `onCreate` en MainActivity para llamar al gestor, conservando interfaz y método de Google.
- **Detalle y edición**: abrir negocio en la parte superior; nombre y categoría centrados con lápiz al lado. Mapa de edición bloqueado inicialmente y sin cambiar coordenadas hasta activación explícita; centrar vuelve a bloquear. Corrección autorizada de referencia `e` en initEditar: pausa/eliminación se enlazan al abrir el negocio seleccionado, sin cambiar confirmaciones.
- **Buscador por relevancia**: score 0 nombre contiene query,
  1 grupo, 2 alias recomendado. Match exacto SIEMPRE primero.
- **Google OAuth**: ya estaba blindado (ver seccion 7).
- **Creador y estadísticas (orden posterior del usuario)**: para estadísticas y likes recibidos usar exclusivamente `e.owner` comparado con el correo de sesión, sin distinguir mayúsculas y quitando espacios. El correo de contacto `e.email` NO concede permisos. Estadísticas del negocio: solo creador o rol `super`. Si falta `owner`, no inventar autoría a partir de datos de contacto.
- **Sin autorreporte ni autolike**: el creador no ve Reportar ni corazones en sus tarjetas o detalle (arriba y abajo), tampoco puede ejecutar esas acciones directamente, incluso si es superusuario. Se conservan los likes y reportes históricos. Esta orden solo autoriza guardas de autoría; NO modificar persistencia, motivos, estados, notificaciones o vencimiento de reportes.
- **Detalle del negocio**: logos de `/uploads/` resueltos mediante `apiUrl`; mapa del detalle aislado en `14b-detalle-mapa.js`, cerrado y bloqueado inicialmente, con activar/bloquear/centrar. No tocar el motor de ubicación del registro ni la micropágina exportada al trabajar aquí.
- **Categorias**: Community Manager + Mercadeo en Comercio y ventas.

## Tarjeta digital: descarga BLINDADA (orden explícita del usuario)

- `www/js/15b-tarjeta-descarga.js` contiene exclusivamente el mecanismo aprobado de descarga de la v110, aislado sin cambiar su comportamiento. PROHIBIDO modificar, eliminar, reemplazar o reimplementar este archivo o `descargarTarjeta` sin preguntar y obtener autorización explícita del usuario.
- No volver al visor iframe superpuesto. Mantener Filesystem CACHE UTF-8 + Share en Android, descarga Blob en navegador, protección contra doble toque y liberación tras cancelación/error.
- `www/js/15-tarjeta.js` prepara y escapa los datos públicos (`htmlTarjeta`). La plantilla HTML, estilos integrados y controles del mapa están aislados en `www/js/15a-tarjeta-plantilla.js`. Cambiar la presentación NO autoriza tocar el descargador ni sus dependencias o integración.
- APARIENCIA BLINDADA por orden del usuario: NO modificar la plantilla, colores, logos, distribución, contenido visual ni helpers que alteren su apariencia sin preguntar y obtener autorización explícita. No importar estilos de la aplicación ni CDN. Preservar la marca pequeña sobre blanco, negocio circular centrado en naranja, dirección debajo del nombre, botones de marca y firma discreta debajo de fecha/hora: «Hecho con ♥ por La Tribu de los Libres», corazón rojo.
- Mapa exportado: colapsado inicialmente, iframe sin interacción hasta activación explícita, bloqueo restaurado al cerrar/reabrir o centrar; botón para bloquear de nuevo. No modificar el motor de mapas/ubicación de la aplicación al trabajar en esta micropágina.
- La micropágina exportada lleva estilos integrados, sin CDN. Solo información pública del negocio; nunca reportes, métricas privadas, correos de sesión ni identidades de likes.

## 10. INSTRUCCION: reportes BLOQUEADOS (orden del usuario)

Nadie puede volver a tocar el sistema de reportes (28-reportes.js,
34-est-acciones.js, seccion reportes de 32-estadisticas.js, envio,
estado pendiente/resuelto, expiracion, acordeones por mes) sin
orden explicita. Los reportes se escriben con saveDataAhora()
(inmediato) — nunca con el saveData coalescido, porque el sync
puede pisar App.data antes del POST y el reporte se pierde.

## 11. Promociones independientes (BLINDADO por orden del usuario)

- Todo archivo nuevo de este sistema debe tener MENOS de 250 líneas. No mezclar el carrusel, tarifas o cobro con reportes, tarjeta exportada ni mapas.
- Servidor: `promociones_manual.py` (aprobación real manual), `promociones_cobro.py` (cobro futuro DESHABILITADO, nunca cobra), `promociones_store.py` (tablas SQLite separadas del JSON del catálogo), `promo_auth.py` (tokens hash, caducidad y permisos verificados en servidor).
- Frontend separado: `36-promociones-api.js`, `37-promociones-tarifas.js`, `38-promociones-manual.js`, `39-carrusel-gratuitos.js`, `40-promociones-avisos.js`, `41-promociones-cobro.js`. Prohibido alterar estos módulos accidentalmente al trabajar en otra función; pedir autorización para cambios de funcionamiento. Imágenes ampliadas y logo a Inicio están aislados en `35-interacciones.js`.
- Tarifas iniciales VACÍAS: nunca convertir ejemplos del usuario en precios reales. Planes 3/7/15/22 días, 1/2/3/4/5/6/8/12 meses. Personalizados 1–365 días: prorratear la tarifa configurada de tres días, con recargo configurable para uno o dos días. Mensaje y capacidad configurables solo por superusuario.
- Inicio al confirmar pago real por superusuario, reloj servidor. Renovación antes de vencer suma desde el vencimiento actual, sin perder tiempo pagado; si venció empieza al confirmar. Calendario y misma hora de Costa Rica, ajustando fin de mes. Aprobaciones idempotentes, transacciones serializadas y capacidad comprobada en servidor. Nunca registrar pago confirmado por declaración del cliente.
- Autorización concedida por el usuario: emitir sesión al responder un login/registro válido sin cambiar archivos/plugin/credenciales OAuth; registro no reemplaza contraseñas existentes sin prueba, y editar usuarios exige sesión. Tokens se envían únicamente al origen del API; logout revoca. No transferir autoría de negocios ya publicados por coincidencias de contacto.
- Avisos dos días antes y último día: modales al sincronizar y notificaciones locales Android si hay permiso. No son push remoto: una aprobación hecha con la app cerrada se aprende al volver a sincronizar; Android puede diferir alarmas. No insistir en permisos rechazados. Renovar cancela/reprograma los avisos del dispositivo; cerrar sesión cancela avisos de la cuenta anterior.
- Verificación: `python herramientas/verificar_promociones.py` usa SQLite temporal y prueba permisos, concurrencia/cupos, cotización, idempotencia, renovación y protección de cuentas. `node herramientas/verificar_promociones.js` verifica likes, imágenes, logo, autenticación de requests, carrusel y avisos simulados. No ejecutar pruebas con bases reales ni confirmar pagos reales para probar.
- Despliegue exige subir `app.py`, `auth_routes.py` y los cuatro módulos Python nuevos a PythonAnywhere y recargar la web. Las tablas nuevas se crean sin reemplazar bases de datos existentes. Compilar APK NO despliega el servidor.

## 12. Eventos independientes (orden del usuario, archivos menores de 250 líneas)

- Sección visible: Eventos de emprendedores; acción Nuevo evento. Mantener IDs internos de ferias para compatibilidad, sin cambiar otros motores de búsqueda. La búsqueda de esta pestaña solo consulta eventos aprobados y vigentes; resultados abren su modal completo.
- Backend aislado en `eventos_store.py`, `eventos_routes.py`, `eventos_legacy.py`; frontend en `42-eventos-api.js`, `43-eventos-formulario.js`, `44-eventos-vistas.js`, `45-eventos-administracion.js`, `css/eventos.css`. No mezclar con tarifas/cobros de negocios, reportes ni la tarjeta exportada. Los únicos puentes de promociones son accesos a esta administración independiente.
- Solo superusuarios administran etiquetas, tarifas, mensaje, SINPE y cuenta bancaria. Usuarios autenticados crean solicitudes; el correo creador se asigna desde la sesión del servidor, nunca desde el contacto ni un campo enviado por el cliente. No inventar precios; tarifa vacía o destino sin configurar impide nuevas solicitudes.
- Antes de guardar, mostrar modal con importe, instrucciones y destino. Guardar genera pendiente, no confirma pagos ni cobra. Solo superusuario comprueba pago real y aprueba. Publicación INMEDIATA al aprobar y retiro EXACTAMENTE 24 horas después del horario final en Costa Rica. Final anterior a inicio significa día siguiente; horas iguales se rechazan.
- Creador por correo y superusuarios son los únicos que ven Editar y pueden editar en servidor. Crear y editar reutilizan EL MISMO formulario, completamente precargado. Orden elegida: editar aprobado publica directamente y conserva importe, destino y pago anteriores, incluso al cambiar etiqueta/fecha; no hay recobro automático.
- Cancelar, negar o revocar NO elimina: queda pendiente, conservando historial y pago previo si existe. Solo superusuarios pueden volver a aprobarlo. Administración permite buscar por evento, creador o contacto y paginar todos los registros, sin ocultar los rechazados. Revisiones optimistas impiden aprobar/editar una versión diferente de la revisada.
- Ferias/notas anteriores se copian una sola vez a pendientes sin modificar el JSON original ni inventar pagos. Si falta correo creador válido, solo el superusuario las administra; correo de contacto no concede autoría. Deben completarse fecha, horario y tarifa antes de aprobar.
- SQLite del servidor es oficial; caché secundaria únicamente para eventos públicos vigentes. No cachear datos de pago privados ni fingir guardado remoto. Las tablas de eventos no se reemplazan importando el JSON del catálogo. Respaldo integral requiere preservar SQLite del servidor.
- Verificar con `python herramientas/verificar_eventos.py`, `node herramientas/verificar_eventos.js` y las pruebas previas de promociones. Los tests usan bases temporales, nunca producción. Comprobar límite menor de 250 en cada archivo nuevo, ejecutar verificador global y compilar APK versionada sin sobreescribir.
- Desplegar `app.py` y los tres módulos Python de eventos junto al backend de sesión autorizado; recargar PythonAnywhere sin reemplazar SQLite. No afirmar despliegue ni comportamiento físico de Android sin probarlos.

## 13. Registro de actualizaciones e instrucciones (orden del usuario)

- Ajustes > Registro de actualizaciones: paginación de 20 en 20 en cuanto hay más de 20 solicitudes/instrucciones; cambiar de página no cierra el acordeón.
- Botón «Exportar todo a TXT» (`www/js/55-historial-ota.js`): exporta TODAS las páginas (versión, fecha, estado e instrucciones). Android: Filesystem CACHE + Share; navegador: Blob. No reutiliza ni toca `15b-tarjeta-descarga.js`.
- Fuente: registro local + `descargas/historial.json`, que `herramientas/publicar.py` actualiza en cada bundle con todas las líneas de `notas-version.txt` (sin el tope de 20 del manifiesto) y que nunca se sobreescribe si el remoto está corrupto. Escribir en `notas-version.txt` las instrucciones del usuario de cada versión.
