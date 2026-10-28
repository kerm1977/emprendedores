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

/* Intenta subir la copia local al API de Flask */
async function syncHaciaServidor() {
    try {
        var res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(App.data)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
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
    marcarSync('spin');
    try {
        var res = await fetch(API_URL);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var remoto = await res.json();
        var remotoVacio = !remoto || Object.keys(remoto).length === 0;
        var localVacio = !App.data || (App.data.emprendimientos || []).length === 0;
        if (!remotoVacio && localVacio) {
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
