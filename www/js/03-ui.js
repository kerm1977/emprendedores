/* 03-ui.js - Utilidades de interfaz */

function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

var _toastTimer = null;
function showToast(msg) {
    var t = document.getElementById('toast-mini');
    t.textContent = msg;
    t.classList.add('visible');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () {
        t.classList.remove('visible');
    }, 2200);
}

function estadoTexto(estado) {
    var mapa = {
        activo: 'Activo',
        nuevo: 'Nuevo',
        destacado: 'Destacado'
    };
    return mapa[estado] || estado;
}

function inicial(nombre) {
    return String(nombre || '?').trim().charAt(0).toUpperCase();
}
