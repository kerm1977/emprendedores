# Tecnologías de la aplicación Emprendedores

Documento técnico de todo el stack utilizado (cero CDNs, offline-first).

## Backend (solo conectividad)

| Tecnología | Uso |
|---|---|
| Python 3.13 | Lenguaje del servidor |
| Flask + Blueprints | `app.py` orquesta `data_routes`, `auth_routes`, `emergency_routes` |
| Werkzeug | Servidor WSGI de desarrollo |
| bcrypt (Python) | Hash seguro de contraseñas |
| Socket.io (vendored) | Canal en vivo preparado (`21-socket.js`); cliente en `www/vendor/js/socket.io.min.js` |
| PythonAnywhere | Destino de producción |

## Bases de datos — SQLite x3 (tipo MySQL)

| Base | Contenido | Índices |
|---|---|---|
| `tribu.sqlite` | Sistema: `app_data` (blob JSON), `sync_log`, `deploy_config`, `github_config` | PK |
| `usuarios.sqlite` | Solo usuarios | UNIQUE `email`; `cedula`, `telefono`, `rol` |
| `emprendimientos.sqlite` | Solo emprendimientos como tabla real | `nombre`, `categoria`, `owner`, `telefono`, PK `emp_id` |

**PRAGMAs aplicados en cada conexión (`db.py::_conectar`):**

- Velocidad: `journal_mode=WAL`, `synchronous=NORMAL`, `cache_size=-64000` (64 MB RAM), `temp_store=MEMORY`, `mmap_size=256MB`, `busy_timeout=5000`
- Seguridad: `foreign_keys=ON`, `trusted_schema=OFF` (anti inyección por esquema), `secure_delete=ON` (borrado real)
- Consultas 100 % parametrizadas (`?`) — sin inyección SQL
- Espejo automático: cada guardado replica emprendimientos a su base dedicada (redundancia anti-pérdida)

## Frontend `www/` (app Capacitor/PWA)

| Tecnología | Uso |
|---|---|
| HTML5 + CSS3 (Flexbox) | Shell de app, tema claro/oscuro, safe-area nativa `env(safe-area-inset-*)` |
| JavaScript ES5 modular | ~22 módulos numerados (`00-*.js` → `99-init.js`) |
| LocalForage | Persistencia offline-first en IndexedDB |
| Service Worker + Manifest | PWA offline (`emprende-v5`); nunca cachea datos viejos en dev |
| Bootstrap (vendored) | Utilidades |
| Font Awesome (vendored) | Íconos (`webfonts` locales) |
| Leaflet (vendored) | Mapa para marcar ubicación (tiles OpenStreetMap = requieren red) |
| QRious (vendored) | Códigos QR por emprendimiento |
| bcrypt.js (vendored) | Verificación de contraseña offline |
| Socket.io client (vendored) | Sync en vivo cuando el servidor lo soporte |
| Nominatim OSM | Geocodificación inversa (provincia/cantón/distrito al marcar el mapa) |

## Android / APK

- Capacitor (`android/`, `capacitor.config.json`) — app nativa que empaqueta `www/`
- Gradle + JDK 21 + Android SDK (`local.properties: sdk.dir`)
- Salida: `android/app/build/outputs/apk/debug/app-debug.apk` → copiada a `Desktop\App\Emprende-debug-vN.apk`

## Seguridad de datos

- Contraseñas: bcrypt con salt por usuario (nunca texto plano)
- Secretos por variables de entorno (`EMERGENCY_CODE`, `DATABASE_PATH`…)
- `.gitignore`: bases sqlite, `node_modules`, builds Android, `local.properties`
- Antiduplicidad: merge por cédula/teléfono/email sin sobreescribir irrepetibles
- Links externos `target=_blank`/`_system` + `rel="noopener"`

## Infraestructura de búsqueda

- Motor propio: fuzzy (Levenshtein corto) + dígitos + normalización NFD sin tildes
- `ALIAS_TABLA` por rubro (~700 sinónimos) editable desde el Dashboard del superusuario
- Motor por pestaña: Negocios→emprendimientos, Directorio→contactos, Ferias→ferias
- `trusted` toggle en Dashboard desactiva la búsqueda inteligente

---

# ARQUITECTURA COMPLETA (plantilla replicable punto por punto)

## 1. Stack
- Frontend: `www/` Capacitor (HTML parciales + JS numerado + CSS modular, CERO CDNs, todo vendor local)
- Backend: Flask REST API en PythonAnywhere (`/home/kenth1977/syncapp/`) — solo conectividad, no renderiza la app
- Datos: 3 SQLite dedicadas (`usuarios.sqlite`, `emprendimientos.sqlite`, `tribu.sqlite`) + IndexedDB local (offline-first, server-first cuando hay red)
- APK: `cd android && ./gradlew assembleDebug` → copiar a `Desktop\App\Emprende-debug-vN.apk`
- Regla sagrada: ningun archivo >250 lineas (`python herramientas/verificar_lineas.py`)

## 2. Estructura frontend (`www/`)
- `index.html`: shell, vistas (`view-*`), magic navbar, overlays (login, toast)
- `parciales/`: vistas cargadas por fetch (`emprendimiento`, `editar`, `perfil`, `ajustes`, `modales`, `login`, `ferias`)
- `js/00-99`: estado (01), datos offline-first `apiUrl()`/`saveData()` (02), ui (03), nav (04), render (05), tema (06), auth (07), usuarios (08), emergencia (09), buscador (10), perfil (12), emprendimientos (13), contacto/detalle (14), wizard (17), ubi/geo (17b+22), qr (18), ferias (19), diccionario (20), conexion (23), editar (25), google (26), huella (27), reportes (28), prohibidas (29), notificaciones (30), init (99)
- `vendor/`: bootstrap, fontawesome, leaflet, qrious, localforage, bcrypt, socket.io (local, no CDN)

## 3. Backend Flask (`syncapp/`)
- `app.py`: app + blueprints + CORS + rutas `/app/` (www), `/privacidad`, `/uploads/`
- `db.py`: 3 bases, WAL/PRAGMAs, `ensure_db()`, `seed_superusers()`, `user_dict()`
- `auth_routes.py`: `/api/auth/register`, `/api/auth/login`, `/api/usuarios` CRUD (antiduplicidad email/cedula/telefono, bcrypt)
- `google_routes.py`: `/api/auth/google` — verifica idToken contra tokeninfo.googleapis, merge por email, guarda foto
- `data_routes.py`: `/api/data` GET/POST — payload JSON completo (server-first)
- `uploads_routes.py`: `/api/uploads` POST -> `uploads/`, GET sirve
- `emergency_routes.py`: codigo antiduplicidad ante DBs corruptas
- `wsgi_app.py` = `from app import app as application` (el WSGI apunta a syncapp)

## 4. Google OAuth (BLINDADO)
- Proyecto `crud-457015`, consent screen External "En produccion"
- Clientes OAuth: Web `68651650199-vd3t...` (serverClientId) + Android `68651650199-dkec...` (package + SHA-1 debug `F6:1F:...`)
- `android/app/google-services.json` hecho a mano (ambos oauth_client + api_key placeholder, SIN Firebase)
- Plugin `@capgo/capacitor-social-login` + `MainActivity implements ModifiedMainActivityForSocialLoginPlugin`
- Flujo: `loginGoogle()` -> SL.initialize(webClientId) -> SL.login -> idToken -> POST `/api/auth/google` -> `guardarSesion(user,'google-oauth')`

## 5. Recuperacion de contrasena (emergencia)
- `09-emergencia.js` + `emergency_routes.py`: codigo de emergencia (`EMERGENCY_CODE` en db.py) para reclamar cuentas duplicadas/recuperar acceso
- Login tiene tab "Recuperar" -> verifica codigo -> resetea contra `/api/usuarios`

## 6. Conectividad PythonAnywhere
- `apiUrl()`: mismo origen en Flask local / `https://kenth1977.pythonanywhere.com` en APK
- `apiDisponible()`: evita llamadas en preview estatica (:50335)
- Server-first: carga remota autoritativa, cachea a IndexedDB; offline -> cache
- CORS en `app.py` (`Access-Control-Allow-Origin: *`)
- Deploy: `cp *.py syncapp/` + Reload web app; bases se autocrean

## 7. Extras
- Huella: `@aparajita/capacitor-biometric-auth` (BiometricPrompt nativo, todo sensor) + `27-huella.js`
- Reportes/likes/terminos: `28-reportes.js` | Palabras prohibidas: `29-prohibidas.js` | Notificaciones super: `30-notificaciones.js`
- QR + tarjeta digital: `18-qr.js` (visor in-app en Capacitor, descarga HTML en web)
- Mapas: `17b-ubi.js` + `22-geo-cr.js` BLINDADO (geocoding anti-mezcla/anti-carrera + poligonos CR)
- SW: `www/sw.js` cache `emprende-vN` (subir version tras cada cambio)
