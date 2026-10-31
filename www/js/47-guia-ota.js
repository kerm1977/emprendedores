/* 47-guia-ota.js - Guia documentada del sistema de actualizacion OTA.
   Se inyecta como acordeon en Ajustes para consulta y para replicar
   el sistema en aplicaciones nuevas. */

/* Acordeon compartido en Ajustes (orden del usuario): agrupa Guia OTA,
   datos ficticios y plantilla prompt bajo un solo boton desplegable. */
function contenedorExtrasAjustes() {
    var lista = document.querySelector('#view-ajustes .ajustes-lista') ||
                document.getElementById('view-ajustes');
    if (!lista) return null;
    var items = document.getElementById('ajustes-extras-items');
    if (items) return items;
    var det = document.createElement('details');
    det.className = 'ajuste-det';
    det.innerHTML = '<summary class="list-group-item" style="list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px">' +
        '<i class="fas fa-ellipsis ajuste-icono"></i><div><div class="ajuste-titulo">Extras del sitio</div>' +
        '<div class="ajuste-sub">OTA, datos de prueba y plantillas</div></div>' +
        '<i class="fas fa-chevron-down ajuste-flecha" style="margin-left:auto"></i></summary>' +
        '<div id="ajustes-extras-items"></div>';
    lista.appendChild(det);
    return det.querySelector('#ajustes-extras-items');
}

function prepararGuiaOta() {
    if (document.getElementById('ota-guia')) return true;
    var destino = contenedorExtrasAjustes();
    if (!destino) return false;
    var box = document.createElement('div');
    box.id = 'ota-guia';
    box.innerHTML =
        '<button class="list-group-item list-group-item-action" type="button" id="guia-fila">' +
        '<i class="fas fa-book ajuste-icono"></i><div><div class="ajuste-titulo">Guía del actualizador OTA</div>' +
        '<div class="ajuste-sub">Cómo funciona el sistema de actualizaciones</div></div>' +
        '<i class="fas fa-chevron-right ajuste-flecha" id="guia-flecha"></i></button><div id="guia-panel" hidden>' +
        '<p><b>¿Qué es?</b> Un sistema que actualiza la capa web de la app (la carpeta <code>www/</code>: pantallas, estilos y lógica) en todos los celulares, sin reinstalar el APK. Android no permite que una app se reemplace a sí misma en silencio; por eso el OTA solo actualiza lo web. Cambios nativos (plugins, permisos, Java) siempre requieren APK nuevo.</p>' +
        '<p><b>Servicios y piezas involucradas:</b></p>' +
        '<ul class="ota-cambios">' +
        '<li><b>Capacitor + @capgo/capacitor-updater:</b> plugin instalado dentro del APK. Descarga el paquete web nuevo, lo guarda en el almacenamiento interno y cambia la carpeta que sirve el WebView. Incluye protección anti-rollback (<code>notifyAppReady</code>).</li>' +
        '<li><b>PythonAnywhere (Flask + API oficial):</b> aloja el backend. <code>actualizacion_routes.py</code> sirve <code>/api/version</code> (manifiesto) y <code>/descargas/</code> (paquetes). La API de archivos recibe las subidas y el endpoint de recarga reinicia la web sin tocar la consola.</li>' +
        '<li><b>herramientas/publicar.py</b> (en tu PC): sube los .py del backend, empaqueta www/ en un ZIP con su SHA-256 y publica el manifiesto. Se autentica con el API token guardado en <code>.env</code> (gitignored). <code>cambiar-token.bat</code> lo rota sin recompilar.</li>' +
        '<li><b>GitHub Actions</b> (opcional): el workflow <code>deploy.yml</code> ejecuta el mismo publicador en cada push usando el secret <code>PA_API_TOKEN</code>.</li>' +
        '<li><b>www/js/46-actualizador.js:</b> revisa el manifiesto al abrir, cada 5 minutos y al volver a primer plano. Si hay versión nueva muestra el modal con versión y lista de cambios; descarga verificando el hash y aplica. Lleva el registro local de actualizaciones.</li></ul>' +
        '<p><b>Flujo de una actualización:</b></p>' +
        '<ul class="ota-cambios">' +
        '<li>1. Se edita el código y se sube el número en <code>www/version.json</code>.</li>' +
        '<li>2. Se escriben las novedades en <code>notas-version.txt</code> (una línea por cambio).</li>' +
        '<li>3. <code>python herramientas/publicar.py</code>: sube backend + <code>descargas/www-vN.zip</code> + <code>descargas/beta.json</code> y recarga la web.</li>' +
        '<li>4. El superusuario recibe la actualización primero (canal de prueba beta), la instala y verifica.</li>' +
        '<li>5. Si todo funciona, en Ajustes → «Publicar al mundo» copia el manifiesto beta al público (<code>version.json</code>) y TODOS los celulares la reciben.</li></ul>' +
        '<p><b>Sincronización de datos:</b> «Sincronizar ahora» sube el documento completo (negocios, contactos, categorías, likes, reportes, notificaciones, ajustes, estadísticas), baja la versión del servidor, sube fotos de perfil pendientes a /uploads y refresca los eventos.</p>' +
        '<p><b>Para replicar en otra app:</b> instalá el plugin, copiá <code>46-actualizador.js</code>, <code>actualizacion_routes.py</code> y <code>publicar.py</code>, ajustá dominio/usuario, generá el API token en la cuenta destino y publicá una primera APK con el plugin incluido.</p>' +
        '<p><b>Seguridad:</b> el token nunca sale de tu PC (no va dentro de la app ni del repo). Solo el superusuario ve las versiones de prueba y puede publicarlas; el servidor lo verifica con la sesión Bearer.</p>' +
        '<button class="perfil-btn-ajustes" id="guia-txt"><i class="fas fa-file-arrow-down"></i> Exportar guía (.txt)</button></div>';
    destino.appendChild(box);
    box.querySelector('#guia-fila').onclick = function () {
        var p = box.querySelector('#guia-panel'), f = box.querySelector('#guia-flecha');
        p.hidden = !p.hidden;
        f.className = 'fas ajuste-flecha ' + (p.hidden ? 'fa-chevron-right' : 'fa-chevron-down');
    };
    box.querySelector('#guia-txt').onclick = function () {
        var texto = box.querySelector('#guia-panel').innerText.replace(/\n{3,}/g, '\n\n').trim();
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
        a.download = 'guia-actualizador-ota.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    };
    return true;
}
