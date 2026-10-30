/* 46-actualizador.js - OTA (MOTOR BLINDADO): revisa /api/version, avisa con
   modal a todos los dispositivos y aplica el bundle web nuevo via
   @capgo/capacitor-updater. PROHIBIDO tocar la descarga, la activacion,
   notifyAppReady ni la conexion con PythonAnywhere sin orden explicita.
   Solo el mensaje/estilo del modal y el registro pueden personalizarse. */

var Actualizador = { version: '', intentando: false };

function updaterDisponible() {
    return !!(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.CapacitorUpdater);
}

async function versionLocal() {
    if (Actualizador.version) return Actualizador.version;
    try {
        var r = await fetch('version.json', { cache: 'no-store' });
        var json = await r.json();
        Actualizador.version = String(json.version || '0');
        Actualizador.nombre = String(json.nombre || Actualizador.version);
    } catch (e) { Actualizador.version = '0'; }
    if (Actualizador.version !== '0' && !otaHistorial().length) {
        otaRegistrar({ version: Actualizador.version, cambios: ['Versión instalada en el dispositivo'] });
    }
    return Actualizador.version;
}

/* Compara versiones por segmentos (enteros o 1.0.0); la seq interna
   manda, el nombre publico es solo presentacion. */
function versionMayor(remota, local) {
    var pa = String(remota).split('.').map(Number), pb = String(local).split('.').map(Number);
    for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
        var da = isNaN(pa[i]) ? 0 : pa[i], db = isNaN(pb[i]) ? 0 : pb[i];
        if (da !== db) return da > db;
    }
    return false;
}

function otaVisto() { try { return localStorage.getItem('ota-visto') || ''; } catch (e) { return ''; } }
function otaMarcar(v) { try { localStorage.setItem('ota-visto', v); } catch (e) {} }

function otaHistorial() {
    try { return JSON.parse(localStorage.getItem('ota-historial') || '[]'); }
    catch (e) { return []; }
}

function otaRegistrar(man) {
    var h = otaHistorial();
    if (h.some(function (r) { return String(r.version) === String(man.version); })) return;
    h.push({ version: String(man.version), ts: Date.now(), beta: !!man.beta, cambios: Array.isArray(man.cambios) ? man.cambios : [] });
    try { localStorage.setItem('ota-historial', JSON.stringify(h.slice(-100))); } catch (e) {}
}

async function revisarActualizacion(manual) {
    if (Actualizador.intentando || !navigator.onLine) {
        if (manual) showToast('Sin conexión: no se pudo consultar el servidor de actualizaciones');
        return;
    }
    Actualizador.intentando = true;
    try {
        var local = await versionLocal();
        var res = await fetch(apiUrl('/api/version'), { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var man = await res.json();
        /* Canal beta: el servidor solo incluye "beta" al superusuario.
           Si hay beta mas nueva que la publica, el super la recibe primero. */
        var candidato = man;
        if (man.beta && versionMayor(man.beta.version, man.version)) {
            candidato = Object.assign({ beta: true }, man.beta);
        }
        man = candidato;
        if (!man.version || !versionMayor(man.version, local)) {
            if (manual) showToast('El sistema está actualizado (v' + local + ')');
            return;
        }
        var sello = String(man.version) + (man.beta ? '-beta' : '');
        if (!manual && otaVisto() === sello) return;
        otaMarcar(sello);
        if (updaterDisponible() && man.url) mostrarModalActualizacion(man);
        else if (man.apk) mostrarModalApk(man);
        else if (manual) showToast('Hay una versión nueva (v' + man.version + '); actualizá la aplicación.');
    } catch (e) {
        if (manual) showToast('No se pudo consultar el servidor de actualizaciones');
    } finally { Actualizador.intentando = false; }
}

function otaModal(id, html) {
    if (document.getElementById(id)) return document.getElementById(id);
    var ov = document.createElement('div');
    ov.className = 'modal-cat'; ov.id = id;
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja ota-hoja">' + html + '</div>';
    document.body.appendChild(ov);
    return ov;
}

function listaCambiosOta(man) {
    var cambios = Array.isArray(man.cambios) ? man.cambios : [];
    if (!cambios.length) return '<p class="rep-sub">Mejoras generales de rendimiento y estabilidad.</p>';
    return '<ul class="ota-cambios">' + cambios.map(function (c) { return '<li>' + escapeHtml(String(c)) + '</li>'; }).join('') + '</ul>';
}

function mostrarModalActualizacion(man) {
    var ov = otaModal('ota-modal',
        '<div class="ota-head"><i class="fas fa-arrow-up"></i><div><h3>' + (man.beta ? 'Actualización de prueba' : 'Nueva actualización disponible') + '</h3>' +
        '<span class="ota-version">Versión ' + escapeHtml(String(man.nombre || man.version)) + (man.bytes ? ' · ' + otaBytes(man.bytes) : '') + '</span></div></div>' +
        (man.beta ? '<p class="evt-nota">Esta versión es una <b>prueba solo para superusuarios</b>. Instalala, verificá que todo funcione y publicala al mundo desde Ajustes → «Publicar al mundo».</p>' : '<p>Se encontraron mejoras nuevas para tu aplicación:</p>') +
        listaCambiosOta(man) +
        '<p id="ota-estado" class="rep-sub">Tocá «Actualizar ahora». Se aplica en segundos y no se borran tus datos ni tu sesión.</p>' +
        '<button class="emp-btn-guardar" id="ota-actualizar"><i class="fas fa-cloud-arrow-down"></i> Actualizar ahora</button>' +
        '<button class="rep-cancelar" id="ota-luego">Más tarde</button>');
    ov.querySelector('#ota-luego').onclick = function () { ov.remove(); };
    ov.querySelector('#ota-actualizar').onclick = function () { descargarYActualizar(man, ov); };
}

async function descargarYActualizar(man, ov) {
    var estado = ov.querySelector('#ota-estado');
    var btn = ov.querySelector('#ota-actualizar');
    btn.disabled = true;
    estado.textContent = 'Descargando actualización…';
    try {
        var Updater = Capacitor.Plugins.CapacitorUpdater;
        var bundle = await Updater.download({ url: man.url, version: String(man.version), checksum: man.checksum || undefined });
        otaRegistrar(man);
        renderRegistroActualizaciones();
        estado.textContent = 'Descargada. Aplicando…';
        try { await Updater.set({ id: bundle.id }); return; }
        catch (e2) { await Updater.next({ id: bundle.id }); }
        estado.textContent = 'Lista. Se aplicará al cerrar y abrir la aplicación.';
        btn.textContent = 'Entendido'; btn.disabled = false;
        btn.onclick = function () { ov.remove(); };
    } catch (e) {
        estado.textContent = 'No se pudo descargar. Reintentaremos automáticamente más tarde.';
        btn.disabled = false;
    }
}

function mostrarModalApk(man) {
    var ov = otaModal('ota-modal-apk',
        '<div class="ota-head"><i class="fas fa-arrow-up"></i><div><h3>Nueva versión disponible</h3>' +
        '<span class="ota-version">Versión ' + escapeHtml(String(man.nombre || man.version)) + (man.bytes ? ' · ' + otaBytes(man.bytes) : '') + '</span></div></div>' +
        listaCambiosOta(man) +
        '<p>Esta actualización requiere instalar el archivo nuevo.</p>' +
        '<a class="emp-btn-guardar" href="' + escapeHtml(man.apk) + '">Descargar nueva versión</a>' +
        '<button class="rep-cancelar" id="ota-apk-luego">Más tarde</button>');
    ov.querySelector('#ota-apk-luego').onclick = function () { ov.remove(); };
}

async function publicarAlMundo(btn, version) {
    btn.disabled = true;
    try {
        var res = await fetch(apiUrl('/api/version/publicar'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        var json = await res.json().catch(function () { return {}; });
        if (!res.ok) throw new Error(json.error || 'El servidor no autorizó la publicación');
        var h = otaHistorial(), r = h.filter(function (e) { return String(e.version) === version; })[0];
        if (r) { r.publicada = true; try { localStorage.setItem('ota-historial', JSON.stringify(h)); } catch (e2) {} }
        showToast('Versión ' + (json.version || version) + ' publicada: todos los celulares la recibirán');
        renderRegistroActualizaciones();
    } catch (e) {
        showToast(e.message || 'No se pudo publicar');
        btn.disabled = false;
    }
}

var otaPagina = 0;

function abrirDetalleActualizacion(r) {
    var ov = otaModal('ota-detalle',
        '<div class="ota-head"><i class="fas fa-scroll"></i><div><h3>Registro de la versión ' + escapeHtml(r.version) + '</h3>' +
        '<span class="ota-version">' + new Date(r.ts).toLocaleString('es-CR') + (r.beta ? ' · prueba' : '') + (r.publicada ? ' · publicada' : '') + '</span></div></div>' +
        '<h4>Mejoras de esta actualización</h4>' +
        ((r.cambios && r.cambios.length) ? '<ul class="ota-cambios">' + r.cambios.map(function (c) { return '<li>' + escapeHtml(String(c)) + '</li>'; }).join('') + '</ul>' : '<p class="rep-sub">Sin detalle registrado.</p>') +
        '<button class="rep-cancelar" id="ota-det-cerrar">Cerrar</button>');
    ov.querySelector('#ota-det-cerrar').onclick = function () { ov.remove(); };
}

function otaBytes(n) {
    return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
}

function renderRegistroActualizaciones() {
    var box = document.getElementById('ota-registro');
    if (!box) return;
    var h = otaHistorial().slice().reverse();
    var u = typeof usuarioActual === 'function' ? usuarioActual() : null;
    var pendiente = (u && u.rol === 'super') ? h.filter(function (r) { return r.beta && !r.publicada; })[0] : null;
    var porPagina = 20, paginas = Math.max(1, Math.ceil(h.length / porPagina));
    if (otaPagina >= paginas) otaPagina = paginas - 1;
    var pagina = h.slice(otaPagina * porPagina, otaPagina * porPagina + porPagina);
    box.innerHTML = (pendiente ? '<details class="evt-acordeon" open><summary><i class="fas fa-flask"></i> Publicación al público</summary><p>La versión ' + escapeHtml(pendiente.version) + ' está instalada en modo prueba. Probala; si todo funciona, liberála:</p><button class="emp-btn-guardar" id="ota-publicar"><i class="fas fa-globe"></i> Publicar v' + escapeHtml(pendiente.version) + ' al mundo</button></details>' : '') +
        '<details class="evt-acordeon"><summary>Registro de actualizaciones (' + h.length + ')</summary>' +
        (pagina.length ? pagina.map(function (r, i) {
            var fecha = new Date(r.ts).toLocaleString('es-CR');
            return '<details class="evt-acordeon ota-item"><summary>Versión ' + escapeHtml(r.version) + ' · ' + fecha + (r.beta ? ' · prueba' : '') + '</summary>' +
                '<button class="rep-cancelar" data-ver-ota="' + (otaPagina * porPagina + i) + '" style="margin:6px 0"><i class="fas fa-scroll"></i> Ver registro completo</button></details>';
        }).join('') : '<p class="rep-sub">Todavía no hay actualizaciones aplicadas.</p>') +
        (paginas > 1 ? '<div class="evt-acciones" style="justify-content:center;margin:8px 0"><button class="rep-cancelar" id="ota-prev"' + (otaPagina ? '' : ' disabled') + '>«</button><span style="align-self:center">Página ' + (otaPagina + 1) + ' de ' + paginas + '</span><button class="rep-cancelar" id="ota-next"' + (otaPagina + 1 < paginas ? '' : ' disabled') + '>»</button></div>' : '') + '</details>';
    var pub = box.querySelector('#ota-publicar');
    if (pub && pendiente) pub.onclick = function () { publicarAlMundo(pub, pendiente.version); };
    box.querySelectorAll('[data-ver-ota]').forEach(function (b) {
        b.onclick = function () { abrirDetalleActualizacion(h[Number(b.dataset.verOta)]); };
    });
    var prev = box.querySelector('#ota-prev'), next = box.querySelector('#ota-next');
    if (prev) prev.onclick = function () { otaPagina--; renderRegistroActualizaciones(); };
    if (next) next.onclick = function () { otaPagina++; renderRegistroActualizaciones(); };
}

function prepararBotonActualizacion() {
    if (!document.getElementById('btn-buscar-actualizacion')) {
        var vista = document.getElementById('view-ajustes');
        if (!vista) return false;
        var hr = document.createElement('hr');
        hr.style.cssText = 'border:none;border-top:1px solid var(--border-soft);margin:0 0 10px';
        var wrap = document.createElement('div');
        wrap.style.cssText = 'text-align:center;margin:10px 0 0';
        var btn = document.createElement('button');
        btn.type = 'button'; btn.id = 'btn-buscar-actualizacion';
        btn.className = 'emp-btn-guardar'; btn.style.margin = '0 auto';
        btn.innerHTML = '<i class="fas fa-cloud-arrow-down"></i> Buscar actualizaciones';
        btn.onclick = function () { revisarActualizacion(true); };
        wrap.appendChild(btn);
        var reg = document.createElement('div');
        reg.id = 'ota-registro';
        var conexion = vista.querySelector('button[onclick="probarConexion()"]');
        var ancla = conexion || vista.querySelector('.perfil-card') || vista;
        ancla.insertAdjacentElement('afterend', hr);
        hr.insertAdjacentElement('afterend', wrap);
        wrap.insertAdjacentElement('afterend', reg);
    }
    renderRegistroActualizaciones();
    if (typeof prepararGuiaOta === 'function') prepararGuiaOta();
    if (typeof prepararFicticios === 'function') prepararFicticios();
    return true;
}

document.addEventListener('DOMContentLoaded', function () {
    if (updaterDisponible()) {
        Capacitor.Plugins.CapacitorUpdater.notifyAppReady().catch(function () {});
    }
    var intentos = 0, timer = setInterval(function () {
        if (prepararBotonActualizacion() || ++intentos > 20) clearInterval(timer);
    }, 1000);
    setTimeout(revisarActualizacion, 5000);
    setInterval(revisarActualizacion, 300000);
});
document.addEventListener('visibilitychange', function () { if (!document.hidden) revisarActualizacion(); });
