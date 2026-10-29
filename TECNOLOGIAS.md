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
