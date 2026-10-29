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

/* Guarda local al instante y encola el envío al servidor */
async function saveData() {
    await localforage.setItem(STORAGE_KEY, App.data);
    marcarSync('pend');
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

/* Botón "Sincronizar ahora" */
async function syncAhora() {
    marcarSync('spin');
    var ok = await syncHaciaServidor();
    showToast(ok ? 'Datos sincronizados' : 'Sin conexión: guardado local');
}

function actualizarDetalleSync(texto) {
    var el = document.getElementById('sync-detalle');
    if (el) el.textContent = texto;
}
