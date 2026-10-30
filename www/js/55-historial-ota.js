/* 55-historial-ota.js - Historial completo de actualizaciones e instrucciones.
   Une el registro local del dispositivo con descargas/historial.json (lo
   mantiene herramientas/publicar.py) y exporta todo a TXT. No toca el
   motor OTA de 46-actualizador.js. */

var HistorialOta = { cargando: false, exportando: false };

function otaHistorialServidor() {
    try {
        var h = JSON.parse(localStorage.getItem('ota-historial-servidor') || '[]');
        return Array.isArray(h) ? h : [];
    } catch (e) { return []; }
}

async function otaSincronizarHistorial() {
    if (HistorialOta.cargando || !navigator.onLine) return;
    HistorialOta.cargando = true;
    try {
        var res = await fetch(apiUrl('/descargas/historial.json'), { cache: 'no-store' });
        if (!res.ok) return;
        var datos = await res.json();
        if (!Array.isArray(datos)) return;
        localStorage.setItem('ota-historial-servidor', JSON.stringify(datos));
        if (typeof renderRegistroActualizaciones === 'function') renderRegistroActualizaciones();
    } catch (e) {
    } finally {
        HistorialOta.cargando = false;
    }
}

/* Mas reciente primero; el registro local aporta estado (prueba/publicada). */
function otaHistorialCompleto() {
    var mapa = {};
    otaHistorialServidor().forEach(function (r) {
        if (r && r.version) mapa[String(r.version)] = Object.assign({}, r, { version: String(r.version) });
    });
    otaHistorial().forEach(function (r) {
        var v = String(r.version), base = mapa[v] || {};
        var cambios = (base.cambios && base.cambios.length) ? base.cambios : (r.cambios || []);
        mapa[v] = Object.assign({}, base, r, { cambios: cambios, ts: base.ts || r.ts });
    });
    return Object.keys(mapa).map(function (k) { return mapa[k]; })
        .sort(function (a, b) { return (Number(b.ts) || 0) - (Number(a.ts) || 0); });
}

function otaTituloRegistro(r) {
    return r.etiqueta ? String(r.etiqueta) : 'Versión ' + (r.nombre && r.nombre !== r.version ? r.nombre + ' (' + r.version + ')' : r.version);
}

function otaTextoHistorial(h) {
    var lineas = [
        'REGISTRO DE ACTUALIZACIONES E INSTRUCCIONES - EMPRENDE',
        'Generado: ' + new Date().toLocaleString('es-CR'),
        'Total de registros: ' + h.length,
        ''
    ];
    h.forEach(function (r, i) {
        var estado = (r.beta ? ' · prueba' : '') + (r.publicada ? ' · publicada' : '');
        lineas.push('==================================================');
        lineas.push('#' + (h.length - i) + ' ' + otaTituloRegistro(r));
        lineas.push('Fecha: ' + (r.ts ? new Date(r.ts).toLocaleString('es-CR') : 'sin fecha') + estado);
        var cambios = Array.isArray(r.cambios) ? r.cambios : [];
        if (!cambios.length) lineas.push('- Sin detalle registrado.');
        cambios.forEach(function (c) { lineas.push('- ' + String(c)); });
        lineas.push('');
    });
    return lineas.join('\r\n');
}

async function exportarHistorialTxt() {
    if (HistorialOta.exportando) return;
    HistorialOta.exportando = true;
    var texto = '\ufeff' + otaTextoHistorial(otaHistorialCompleto());
    var nombre = 'registro-actualizaciones-' + new Date().toISOString().slice(0, 10) + '.txt';
    try {
        if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
            var fs = window.Capacitor.Plugins.Filesystem, share = window.Capacitor.Plugins.Share;
            if (!fs || !share) { showToast('Esta versión requiere actualizar la aplicación para exportar'); return; }
            var archivo = await fs.writeFile({ path: 'registros/' + nombre, data: texto, directory: 'CACHE', encoding: 'utf8', recursive: true });
            await share.share({ title: 'Registro de actualizaciones', files: [archivo.uri], dialogTitle: 'Guardar o compartir el registro' });
            return;
        }
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        showToast('Registro exportado a TXT');
    } catch (e) {
        showToast('No se completó la exportación o se canceló. Podés intentarlo de nuevo');
    } finally {
        HistorialOta.exportando = false;
    }
}

document.addEventListener('DOMContentLoaded', function () { setTimeout(otaSincronizarHistorial, 3000); });
document.addEventListener('visibilitychange', function () { if (!document.hidden) otaSincronizarHistorial(); });
