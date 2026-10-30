# Manual de la aplicación — Emprendedores

Versión pública actual: **1.0.0** (internamente seq 149; desde aquí la numeración
reinicia y avanza 1.1.0, 1.2.0 … hasta 1.10.0, y luego 1.1.1, 1.2.1, etc.)
Repositorio: **https://github.com/kerm1977/emprendedores**

---

## 1. Arquitectura general

La aplicación es **offline-first** y funciona en dos capas:

- **Frontend completo en `www/`** — toda la interfaz (vistas, lógica, estilos)
  empaquetada como app Android con **Capacitor**. También se sirve como web
  desde PythonAnywhere.
- **Flask en PythonAnywhere** — es **solamente conectividad**: sirve la API
  (`/api/*`), los datos, los archivos subidos y los paquetes de actualización.
  No renderiza la app (la app es el `www/` dentro del APK).

Producción: `https://kenth1977.pythonanywhere.com` · directorio remoto `/home/kenth1977/syncapp`.

## 2. Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | Python 3 + Flask + SQLite (`tribu.sqlite`, `usuarios.sqlite`, `emprendimientos.sqlite`) |
| Frontend | HTML + CSS + JavaScript puro en `www/` (sin frameworks) |
| Offline | IndexedDB con LocalForage como respaldo local; SQLite es la fuente oficial |
| Empaquetado | Capacitor → APK Android |
| Plugins Capacitor | Updater (OTA), Social Login (Google), Biometric Auth, Filesystem, Share, Local Notifications |
| Mapas | Leaflet vendorizado (tiles OSM en línea), sin CDN |
| Librerías | Todas vendorizadas localmente — **cero CDNs** |

## 3. Persistencia y sincronización

- `loadData()`/`saveData()` leen y escriben por la API de Flask hacia SQLite.
- Cada escritura se coalesce 600 ms y también queda en IndexedDB (funciona offline).
- **«Sincronizar ahora»** hace una sincronización total: sube el documento
  completo (negocios, categorías, contactos, alias, likes, reportes,
  notificaciones, ajustes, estadísticas), baja la versión del servidor, sube
  fotos de perfil pendientes a `/uploads` y refresca los eventos.
- El servidor es la fuente de verdad; si hay choque se conserva lo local más nuevo.

## 4. Secciones de la aplicación

- **Inicio** — categorías en acordeón con subcategorías; Destacados muestra
  solo emprendimientos del espacio pagado vigente. El botón `+` solo aparece
  dentro de una subcategoría y registra con esa categoría preseleccionada.
- **Negocios** — espacio pagado (promociones vigentes, 2 por fila) y, abajo,
  «Descubrí más emprendimientos»: dos filas de tarjetas en desplazamiento
  infinito en sentidos opuestos, nunca ocultas.
- **Directorio** — «Directorio de Emprendedores y Negocios»: contactos y
  negocios ordenados alfabéticamente; un solo buscador por nombre, negocio,
  teléfono, provincia, cantón y distrito.
- **Eventos de emprendedores** — ferias, cursos, anuncios, denuncias; etiquetas
  con tarifa o gratuitas; aprobación del superusuario; cobro por SINPE/cuentas.
- **Perfil** — datos de sesión, notificaciones, dashboard (super), ajustes,
  Negocios y Eventos, Mis empresas, bloqueo, reportar problema, foto de perfil,
  cerrar sesión.
- **Registro** — wizard de 6 pasos (categoría → datos → contacto → ubicación →
  redes → pluses/horario/descripción) con antiduplicidad.

## 5. Sistema de actualización OTA

Motor con `@capgo/capacitor-updater` (no cambiar sin orden explícita):

1. Se edita el código y se sube `www/version.json` (seq + `nombre` público).
2. `python herramientas/publicar.py` sube el backend, empaqueta `www/` en un
   ZIP con su SHA-256, y publica el manifiesto:
   - `descargas/beta.json` → **canal beta: solo superusuarios**
   - `descargas/version.json` → **canal público** (con `--publico`)
3. La app revisa `/api/version` al abrir, al volver a primer plano y cada
   5 min; si hay versión nueva muestra el modal con nombre, tamaño en KB/MB
   y lista de cambios.
4. El superusuario instala primero la prueba; desde Ajustes toca
   **«Publicar al mundo»** y la versión llega a todos los teléfonos.
5. `notifyAppReady` protege el arranque (rollback si falla).
6. Cambios nativos (permisos, plugins) requieren APK nuevo — el OTA solo
   actualiza la capa web.

## 6. Capacidades del superusuario

- Recibir e instalar actualizaciones beta antes que nadie, y publicarlas al mundo.
- Panel de **estadísticas** globales (gráficos, reportes, likes, alertas, actividad).
- **Eventos**: definir etiquetas, tarifas y datos de pago; aprobar/denegar eventos.
- **Promociones**: confirmar pagos, extender plazos, configurar capacidad y planes.
- **Bloqueos administrativos**: tickets con motivo (incluida opción «pago
  pendiente») que ocultan un usuario/negocio hasta ponerse al día.
- **Usuarios**: gestionar roles (super, admin1, admin2, user) y cuentas.
- **Palabras prohibidas y diccionario** de sinónimos del buscador.
- **Datos de prueba**: cargar/eliminar 10 contactos y 10 negocios ficticios.
- Notificaciones centralizadas de reportes, problemas y bloqueos.
- Registro de actualizaciones con historial y publicación controlada.

## 7. Usuarios regulares

- Navegación pública sin login (catálogo, directorio, eventos).
- Con sesión: likes privados, destacados, registro de emprendimientos,
  promoción de negocio, Mis empresas (editar/eliminar/agregar + contador del
  espacio pagado), reportar problemas, bloquear usuarios/negocios,
  foto de perfil con editor (mover/zoom).
- Login por Google, correo, biometría y recuperación.

## 8. Versionado

- Versión pública: **1.0.0** (muestra en la app y el modal).
- Secuencia interna: número que compara el motor OTA (149 en adelante) —
  siempre crece; el nombre público avanza 1.1.0 → 1.2.0 → … → 1.10.0 y luego
  1.1.1, 1.2.1, 1.3.1 … según el esquema acordado.
- Cada publicación se registra en «Registro de actualizaciones» en Ajustes,
  con fecha, cambios y detalle por versión.

## 9. Seguridad y reglas del proyecto

- Sin CDNs; todo vendorizado.
- Archivos de código ≤ 300 líneas (`herramientas/verificar_lineas.py`).
- La API key de PythonAnywhere vive solo en `.env` local / GitHub Secrets —
  nunca en el APK, el repo ni el manifiesto.
- Google OAuth, el descargador de tarjetas, los reportes y el motor OTA son
  secciones blindadas del código: no se modifican sin autorización explícita.
