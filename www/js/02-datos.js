/* BLINDADO (orden del usuario): prohibido modificar/eliminar
   sin orden explicita. Pedir permiso antes de tocar. */
/* 02-datos.js - Persistencia offline-first
   LocalForage (IndexedDB) es la fuente inmediata; Flask (/api/data)
   es solo el canal de conectividad hacia la base de datos. */

localforage.config({
    name: 'agenda-tribu',
    storeName: 'datos'
});

function marcarSync(estado) {
    App.syncEstado = estado;
    var icono = document.getElementById('sync-icon');
    if (icono) {
        icono.className = 'fas fa-cloud-arrow-up ajuste-icono sync-' + estado;
    }
}

/* Carga: primero local, luego intenta traer del servidor en segundo plano */
async function loadData() {
    var local = await localforage.getItem(STORAGE_KEY);
    if (!local || local.version !== DATA_VERSION) {
        local = datosSemilla();
        await localforage.setItem(STORAGE_KEY, local);
    }
    App.data = local;
    syncDesdeServidor();
    return local;
}

/* Guarda con coalescencia: varios cambios seguidos (clics, likes,
   visitas) se agrupan en UNA escritura a IndexedDB + UN POST.
   El orden server-first se mantiene al sincronizar. */
var _saveTimer = null;
function saveData() {
    marcarSync('pend');
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(async function () {
        _saveTimer = null;
        await localforage.setItem(STORAGE_KEY, App.data);
        await syncHaciaServidor();
    }, 600);
    return Promise.resolve();
}
/* Para cambios criticos que no pueden esperar (registro, borrado) */
async function saveDataAhora() {
    if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
    await localforage.setItem(STORAGE_KEY, App.data);
    await syncHaciaServidor();
}

/* Solo llama a /api/data cuando el servidor puede tenerlo:
   Flask local (:5000 o /app/), PythonAnywhere o API ya vista.
   En un estatico (preview/Capacitor) ni se intenta -> sin 404 rojo. */
function apiDisponible() {
    if (App._apiVista === true) return true;
    var h = location.hostname, p = location.port, ruta = location.pathname;
    return p === '5000' || ruta.indexOf('/app') === 0 ||
        h.indexOf('pythonanywhere') !== -1 ||
        (p !== '50335' && !!API_BASE); /* app/Capacitor -> API remoto */
}

/* Intenta subir la copia local al API de Flask */
async function syncHaciaServidor() {
    if (!apiDisponible()) {
        marcarSync('off');
        return false;
    }
    try {
        var res = await fetch(apiUrl(API_URL), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(App.data)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        App._apiVista = true;
        marcarSync('ok');
        actualizarDetalleSync('Sincronizado ' + new Date().toLocaleTimeString('es-CR'));
        return true;
    } catch (e) {
        marcarSync('pend');
        actualizarDetalleSync('Pendiente de sincronizar');
        return false;
    }
}

/* Trae datos del servidor solo si la copia local está vacía */
async function syncDesdeServidor() {
    if (!apiDisponible()) {
        marcarSync(navigator.onLine ? 'pend' : 'off');
        return;
    }
    marcarSync('spin');
    try {
        var res = await fetch(apiUrl(API_URL));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        App._apiVista = true;
        var remoto = await res.json();
        /* PYTHONANYWHERE FIRST: el servidor es la fuente de verdad;
           IndexedDB queda como respaldo/offline */
        var remotoVacio = !remoto || Object.keys(remoto).length === 0;
        if (!remotoVacio) {
            App.data = remoto;
            await localforage.setItem(STORAGE_KEY, remoto);
            renderTodo();
        }
        marcarSync('ok');
        actualizarDetalleSync('Sincronizado ' + new Date().toLocaleTimeString('es-CR'));
    } catch (e) {
        marcarSync(navigator.onLine ? 'pend' : 'off');
        actualizarDetalleSync(navigator.onLine ? 'Pendiente de sincronizar' : 'Sin conexión');
    }
}

/* Fotos de perfil pendientes: si quedo una imagen local (data:) o el
   registro no confirmo la subida, reintenta /api/uploads + PUT usuario.
   El Bearer lo adjunta 07c-sesion-servidor.js automaticamente. */
async function subirFotosPendientes() {
    if (typeof subirFotoPerfil !== 'function') return 0;
    var u = typeof usuarioActual === 'function' ? usuarioActual() : null;
    var data = App._regFoto || '';
    if (!data && u && typeof u.foto === 'string' && u.foto.indexOf('data:image/') === 0) data = u.foto;
    if (!data || !u || !u.id) return 0;
    try {
        var url = await subirFotoPerfil(data, u.id);
        var res = await fetch(apiUrl('/api/usuarios/' + u.id), {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ foto: url })
        });
        var json = await res.json().catch(function () { return {}; });
        if (!res.ok || !json.user || json.user.foto !== url) return 0;
        u.foto = url;
        App._regFoto = '';
        return 1;
    } catch (e) { return 0; }
}

/* Botón "Sincronizar ahora" = SINCRONIZACIÓN TOTAL:
   1) sube fotos de perfil pendientes (imágenes locales -> /uploads)
   2) POST de TODO App.data: negocios, categorías, contactos, alias,
      likes, reportes, notificaciones/alertas, ajustes y estadísticas
   3) GET del servidor (fuente de verdad)
   4) refresca los eventos públicos guardados en el servidor */
async function syncAhora() {
    marcarSync('spin');
    var ok = false;
    try {
        if (apiDisponible()) {
            await subirFotosPendientes();
            ok = await syncHaciaServidor();
            if (ok) {
                await syncDesdeServidor();
                if (typeof sincronizarEventos === 'function') await sincronizarEventos();
            }
        }
    } catch (e) { ok = false; }
    showToast(ok ? 'Sincronización completa con la base de datos' : 'Sin conexión: guardado local');
}

function actualizarDetalleSync(texto) {
    var el = document.getElementById('sync-detalle');
    if (el) el.textContent = texto;
}
