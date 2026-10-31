var Promociones = { publico: { activos: [], capacidad: 10 }, panel: null, desfase: 0, cargando: false };

async function promoApi(ruta, datos, metodo) {
    var opciones = { method: metodo || (datos ? 'POST' : 'GET'), cache: 'no-store' };
    if (datos) { opciones.headers = { 'Content-Type': 'application/json' }; opciones.body = JSON.stringify(datos); }
    var respuesta = await fetch(apiUrl('/api/promociones' + ruta), opciones);
    var json = await respuesta.json().catch(function () { return {}; });
    if (!respuesta.ok) throw new Error(json.error || (respuesta.status === 401 ? 'Ingresá nuevamente con conexión para obtener una sesión segura' : 'El servidor de promociones no está disponible o no autorizó la operación'));
    return json;
}

function promoModal(titulo, html) {
    var ov = document.createElement('div'); ov.className = 'modal-cat';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', titulo);
    ov.innerHTML = '<div class="modal-cat-hoja promo-hoja"><h3>' + escapeHtml(titulo) + '</h3>' + html + '<p class="promo-error" role="alert"></p><button type="button" class="promo-boton" data-promo-cerrar>Cerrar</button></div>';
    var previo = document.activeElement;
    function cerrar() { ov.remove(); if (previo && previo.isConnected) previo.focus({ preventScroll: true }); }
    ov.querySelector('[data-promo-cerrar]').onclick = cerrar;
    ov.onclick = function (ev) { if (ev.target === ov) cerrar(); };
    ov.onkeydown = function (ev) {
        if (ev.key === 'Escape') cerrar();
        if (ev.key === 'Tab') {
            var controles = Array.from(ov.querySelectorAll('button:not([disabled]), input, select, textarea'));
            var primero = controles[0], ultimo = controles[controles.length - 1];
            if (ev.shiftKey && document.activeElement === primero) { ev.preventDefault(); ultimo.focus(); }
            else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primero.focus(); }
        }
    };
    document.body.appendChild(ov); ov.querySelector('[data-promo-cerrar]').focus({ preventScroll: true });
    return ov;
}

function promoAccion(ov, selector, accion) {
    var btn = ov.querySelector(selector);
    btn.onclick = async function () {
        btn.disabled = true;
        try { await accion(); }
        catch (error) { ov.querySelector('.promo-error').textContent = error.message; }
        finally { btn.disabled = false; }
    };
}

function promoMoneda(n) { return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n); }
function promoFecha(n) { return new Date(n * 1000).toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }); }
function promoAhora() { return Date.now() / 1000 + Promociones.desfase; }

async function sincronizarPromociones() {
    if (Promociones.cargando) return;
    Promociones.cargando = true;
    try {
        var pub = await promoApi('');
        Promociones.publico = pub; Promociones.desfase = pub.server_now - Date.now() / 1000;
        await localforage.setItem('promo-publico-v1', pub);
        if (typeof renderEspaciosPromocionados === 'function') renderEspaciosPromocionados();
        var u = usuarioActual();
        if (u && u.promo_token && !sesion.offline) {
            var panel = await promoApi('/panel');
            if (usuarioActual() && usuarioActual().id === u.id) Promociones.panel = panel;
        } else Promociones.panel = null;
        if (typeof actualizarAvisosPromocion === 'function') await actualizarAvisosPromocion();
        prepararPerfilPromociones();
    } catch (error) { Promociones.ultimoError = error.message; }
    finally { Promociones.cargando = false; }
}

function refrescarSesionPromociones() {
    Promociones.panel = null;
    prepararPerfilPromociones();
    if (typeof actualizarAvisosPromocion === 'function') actualizarAvisosPromocion();
    sincronizarPromociones();
}

function contenedorNegociosEventos() {
    var box = document.getElementById('negocios-eventos-items');
    if (box) return box;
    var perfil = document.querySelector('#view-perfil .perfil-card'), salir = document.getElementById('btn-info-dev') || document.getElementById('btn-salir-perfil');
    if (!perfil || !salir) return null;
    var sec = document.createElement('details');
    sec.className = 'evt-acordeon';
    sec.id = 'negocios-eventos';
    sec.innerHTML = '<summary><i class="fas fa-store"></i> Negocios y Eventos</summary><div id="negocios-eventos-items"></div>';
    perfil.insertBefore(sec, salir);
    return sec.querySelector('#negocios-eventos-items');
}

function prepararPerfilPromociones() {
    if (typeof prepararAccesoEventos === 'function') prepararAccesoEventos();
    if (typeof prepararReporteSitio === 'function') prepararReporteSitio();
    if (typeof prepararFotoEditor === 'function') prepararFotoEditor();
    if (typeof prepararSuperTarjeta === 'function') prepararSuperTarjeta();
    if (typeof prepararBloqueo === 'function') prepararBloqueo();
    if (typeof prepararMisEmpresas === 'function') prepararMisEmpresas();
    if (typeof prepararBloqueosAdmin === 'function') prepararBloqueosAdmin();
    if (typeof prepararNube === 'function') prepararNube();
    if (typeof prepararReportesPerfil === 'function') prepararReportesPerfil();
    var u = usuarioActual(), cont = contenedorNegociosEventos();
    if (!cont) return;
    var btn = document.getElementById('promo-perfil');
    if (!btn) { btn = document.createElement('button'); btn.id = 'promo-perfil'; btn.type = 'button'; btn.className = 'perfil-btn-ajustes'; cont.appendChild(btn); }
    btn.hidden = !u;
    var panel = Promociones.panel;
    var pendientes = panel ? panel.solicitudes.filter(function (s) { return s.estado === 'pendiente'; }).length : 0;
    btn.textContent = 'Promociones y avisos' + (pendientes ? ' (' + pendientes + ')' : '');
    btn.onclick = abrirPanelPromociones;
}

document.addEventListener('DOMContentLoaded', async function () {
    var cache = await localforage.getItem('promo-publico-v1');
    if (cache) Promociones.publico = cache;
    await sincronizarPromociones();
    setInterval(sincronizarPromociones, 60000);
});
document.addEventListener('visibilitychange', function () { if (!document.hidden) sincronizarPromociones(); });
