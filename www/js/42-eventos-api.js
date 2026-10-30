var Eventos = { items: [], desfase: 0, editando: null, solicitud: null, cargando: false, vencimiento: null, sesionEmail: null };

async function eventoApi(ruta, datos, metodo) {
    var u = usuarioActual(), identidad = u && u.promo_token;
    var control = new AbortController(), timer = setTimeout(function () { control.abort(); }, 20000);
    try {
        var opciones = { method: metodo || (datos ? 'POST' : 'GET'), cache: 'no-store', signal: control.signal };
        if (datos) { opciones.headers = { 'Content-Type': 'application/json' }; opciones.body = JSON.stringify(datos); }
        var res = await fetch(apiUrl('/api/eventos' + ruta), opciones);
        var json = await res.json().catch(function () { return {}; });
        if (ruta && identidad !== (usuarioActual() && usuarioActual().promo_token)) throw new Error('La sesión cambió; abrí el evento nuevamente');
        if (!res.ok) {
            var error = new Error(json.error || (res.status === 401 ? 'Volvé a iniciar sesión con conexión para administrar eventos' : 'No se pudo conectar con el servidor de eventos'));
            error.status = res.status; throw error;
        }
        return json;
    } catch (error) {
        if (error.name === 'AbortError') throw new Error('La conexión tardó demasiado. El formulario conserva la información para reintentar.');
        throw error;
    } finally { clearTimeout(timer); }
}

function eventoModal(titulo, html) {
    var ov = document.createElement('div'); ov.className = 'evt-overlay';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', titulo);
    ov.innerHTML = '<div class="evt-hoja"><button type="button" class="evt-cerrar" aria-label="Cerrar">×</button><h3>' + escapeHtml(titulo) + '</h3>' + html + '<p class="evt-error" role="alert"></p></div>';
    var previo = document.activeElement;
    ov.cerrar = function () { ov.remove(); if (previo && previo.isConnected) previo.focus({ preventScroll: true }); };
    ov.querySelector('.evt-cerrar').onclick = ov.cerrar;
    ov.onclick = function (ev) { if (ev.target === ov) ov.cerrar(); };
    ov.onkeydown = function (ev) {
        if (ev.key === 'Escape') ov.cerrar();
        if (ev.key === 'Tab') {
            var controles = Array.from(ov.querySelectorAll('button:not([disabled]), input:not([disabled]), select, textarea, a[href]')).filter(function (n) { return n.getClientRects().length; });
            var primero = controles[0], ultimo = controles[controles.length - 1];
            if (ev.shiftKey && document.activeElement === primero) { ev.preventDefault(); ultimo.focus(); }
            if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primero.focus(); }
        }
    };
    document.body.appendChild(ov); ov.querySelector('.evt-cerrar').focus({ preventScroll: true });
    return ov;
}

function eventoAccion(ov, selector, accion) {
    ov.querySelector(selector).onclick = async function () {
        this.disabled = true;
        try { await accion(); }
        catch (error) { ov.querySelector('.evt-error').textContent = error.message; }
        finally { this.disabled = false; }
    };
}

function eventoMoneda(n) { return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n); }
function eventoFecha(n) { return n ? new Date(n * 1000).toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }) : 'Fecha por completar'; }
function eventoAhora() { return Date.now() / 1000 + Eventos.desfase; }
function eventosPublicos() { return Eventos.items.filter(function (e) { return e.expires > eventoAhora(); }); }

async function sincronizarEventos() {
    if (Eventos.cargando) return;
    Eventos.cargando = true;
    try {
        var datos = await eventoApi('');
        if (!Array.isArray(datos.eventos) || !Number.isFinite(datos.server_now)) throw new Error('El servidor devolvió una respuesta de eventos inválida');
        Eventos.errorServidor = null;
        Eventos.items = datos.eventos; Eventos.desfase = datos.server_now - Date.now() / 1000;
        await localforage.setItem('eventos-publicos-v1', datos.eventos);
    } catch (error) { Eventos.errorServidor = error.message; }
    finally { Eventos.cargando = false; renderEventos(); }
}

function prepararAccesoEventos() {
    var u = usuarioActual(), email = u ? u.email : null;
    if (Eventos.sesionEmail !== email) {
        Eventos.sesionEmail = email; Eventos.editando = null; Eventos.solicitud = null;
        var form = document.getElementById('form-feria'); if (form) form.reset();
        document.querySelectorAll('.evt-overlay').forEach(function (n) { n.remove(); });
    }
    var cont = typeof contenedorNegociosEventos === 'function' ? contenedorNegociosEventos() : document.querySelector('#view-perfil .perfil-card');
    if (!cont) return;
    var btn = document.getElementById('evt-perfil');
    if (!btn) { btn = document.createElement('button'); btn.type = 'button'; btn.id = 'evt-perfil'; btn.className = 'evt-boton'; btn.textContent = 'Administrar y promocionar eventos'; cont.appendChild(btn); }
    btn.hidden = !u; btn.onclick = async function () {
        btn.disabled = true;
        try { await abrirAdministracionEventos(); }
        catch (e) { showToast(e.message); }
        finally { btn.disabled = false; }
    };
}

document.addEventListener('DOMContentLoaded', async function () {
    var cache = await localforage.getItem('eventos-publicos-v1');
    if (Array.isArray(cache)) Eventos.items = cache;
    renderEventos(); await sincronizarEventos(); prepararAccesoEventos();
    setInterval(sincronizarEventos, 30000);
});
document.addEventListener('visibilitychange', function () { if (!document.hidden) sincronizarEventos(); });
