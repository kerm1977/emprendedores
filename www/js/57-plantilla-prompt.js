/* 57-plantilla-prompt.js - Solo super: plantilla clonable de la arquitectura.
   Seccion en Ajustes bajo "Datos de prueba" con el prompt maestro para crear
   una app nueva limpia conectada a OTRA cuenta de PythonAnywhere. */

var PROMPT_PLANTILLA = `Crear una aplicacion nueva basada en esta arquitectura probada:

ARQUITECTURA GENERAL
- Backend Python Flask SOLO como API + archivos estaticos. Sin render de vistas.
- Frontend 100% en www/: index.html, js/ modulares numerados por orden de
  carga (00-99), css/ separado, parciales/ para vistas HTML.
- Aplicacion offline-first, sin CDN: toda libreria en static/vendor/ o www/vendor/.
- Persistencia SQLite en el servidor; el cliente lee/escribe via loadData()/
  saveData() contra POST/GET /api/data (documento JSON completo, server-first,
  IndexedDB como respaldo local).
- Capacitor para Android: www/ es el webDir; plugins usados: CapacitorUpdater
  (OTA), Filesystem, Share, biometric-auth, capacitor-social-login.

DESPLIEGUE EN PYTHONANYWHERE
- Webapp Flask en /home/<usuario>/<carpeta>/ con app.py como WSGI.
- .env local guarda PA_API_TOKEN (token API de pythonanywhere.com/api/v0),
  dominio y usuario; NUNCA se sube al servidor.
- herramientas/publicar.py sube backend (app.py + *_routes.py), el bundle
  www-vN.zip a descargas/ y beta.json, y llama al endpoint reload de la API
  de PythonAnywhere. Si reload da timeout, reintentar con timeout 120s: a
  veces responde lento pero igual recarga.

SISTEMA OTA (actualizaciones)
- www/version.json local guarda {"version": seq interna, "nombre": "1.x.x"}.
- publicar.py empaqueta www/ en descargas/www-vN.zip + escribe descargas/
  beta.json {version, nombre, url, checksum sha256, cambios[]}.
- GET /api/version devuelve el manifesto publico (version.json); si el Bearer
  es rol super agrega "beta". _manifesto() debe incluir nombre, url,
  checksum, apk y cambios.
- POST /api/version/publicar (solo super) copia beta.json -> version.json.
- El cliente compara versiones por segmentos numericos; el nombre publico es
  solo presentacion. Canal beta = solo superusuarios ven la prueba.
- En Android, CapacitorUpdater.download() aplica el zip sin reinstalar APK.

REGLA DE ORO DEL PROYECTO
- Ningun archivo de codigo supera 300 lineas; verificar con
  herramientas/verificar_lineas.py y partir modulos antes del limite.

LO QUE SE PIDE CONSTRUIR
- Plantilla limpia: SOLO la barra de menu inferior (Inicio / Buscar /
  Directorio / Eventos / Perfil o los items que yo indique) y las vistas
  vacias, completamente planas, con el tema visual base (variables CSS,
  colores naranja primario). Sin negocios, sin auth real, sin contenido.
- Toda la tuberia funcional: app.py con /api/data, /api/version y
  /descargas/<nombre>; publicar.py; verificar_lineas.py; www/version.json
  empezando en {"version":"1","nombre":"1.0.0"}.
- El OTA debe quedar probado: publicar v1 -> v2 y que la app la reciba.

CONECTAR A OTRA CUENTA DE PYTHONANYWHERE (sin conflictos)
- Crear webapp Flask nueva en pythonanywhere (dominio NUEVO distinto:
  otracuenta.pythonanywhere.com). NO tocar la webapp original.
- Generar PA_API_TOKEN nuevo en Settings > API token de ESA cuenta.
- .env de la plantilla: PA_API_TOKEN=<token nuevo>, usuario y dominio nuevos.
- apiUrl() del frontend debe apuntar al dominio nuevo (configurar base).
- Base de datos SQLite nueva y carpeta uploads/ y descargas/ propias:
  nada se comparte con la app original, asi no hay colision de datos.
- version.json arranca en 1; los manifests viven en la carpeta descargas/
  de la cuenta nueva.
- Si se usa login Google u otro OAuth, crear credenciales OAuth propias
  del proyecto nuevo (cliente web + android, SHA-1 de la app nueva); no
  reusar los de la app original.
- Probar: login/registro, /api/data guarda en la SQLite nueva, publicar.py
  sube al dominio nuevo y reload responde, OTA v2 llega al telefono.

Restricciones: sin CDN, archivos <=300 lineas, backend solo API, SQLite
oficial, offline-first con IndexedDB de respaldo, bundle servido desde
descargas/ del dominio propio.`;

function prepararPlantillaPrompt() {
    var u = usuarioActual();
    if (!u || u.rol !== 'super') return;
    if (document.getElementById('plantilla-box')) return;
    var destino = typeof contenedorExtrasAjustes === 'function'
        ? contenedorExtrasAjustes() : document.getElementById('view-ajustes');
    if (!destino) return;
    var box = document.createElement('div');
    box.id = 'plantilla-box';
    box.innerHTML = '<button class="list-group-item list-group-item-action" type="button" id="plan-fila">' +
        '<i class="fas fa-scroll ajuste-icono"></i><div><div class="ajuste-titulo">Crear plantilla a través de prompt</div>' +
        '<div class="ajuste-sub">Prompt maestro copiable de la arquitectura</div></div>' +
        '<i class="fas fa-chevron-right ajuste-flecha" id="plan-flecha"></i></button><div id="plan-panel" hidden style="padding:0 8px">' +
        '<p class="rep-sub">Prompt maestro con toda la arquitectura (Flask, PythonAnywhere, OTA y conexión a otra cuenta) para clonar la app como plantilla limpia.</p>' +
        '<textarea readonly rows="12" style="width:100%;font-size:.72rem;font-family:monospace" id="plantilla-prompt"></textarea>' +
        '<button class="emp-btn-guardar" id="plantilla-copiar" style="margin-top:8px"><i class="fas fa-copy"></i> Copiar prompt completo</button></div>';
    box.querySelector('#plan-fila').onclick = function () {
        var p = box.querySelector('#plan-panel'), f = box.querySelector('#plan-flecha');
        p.hidden = !p.hidden;
        f.className = 'fas ajuste-flecha ' + (p.hidden ? 'fa-chevron-right' : 'fa-chevron-down');
    };
    destino.appendChild(box);
    box.querySelector('#plantilla-prompt').value = PROMPT_PLANTILLA;
    box.querySelector('#plantilla-copiar').onclick = function () {
        var ta = box.querySelector('#plantilla-prompt');
        ta.select();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(PROMPT_PLANTILLA).then(function () {
                showToast('Prompt copiado (' + PROMPT_PLANTILLA.length + ' caracteres)');
            });
        } else { document.execCommand('copy'); showToast('Prompt copiado'); }
    };
}

/* Se inserta despues de Datos de prueba: prepararFicticios corre primero en
   el mismo ciclo, asi este acordeon queda justo debajo. */
document.addEventListener('DOMContentLoaded', function () {
    var intentos = 0, timer = setInterval(function () {
        if (document.getElementById('plantilla-box') || ++intentos > 20) { clearInterval(timer); return; }
        prepararPlantillaPrompt();
    }, 1000);
});
