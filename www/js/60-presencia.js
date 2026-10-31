/* 60-presencia.js - Latido de sesion: cada ~30s avisa al servidor
   quien esta conectado. Solo con usuario logueado y conexion. */

var _presenciaTimer = null;

function pingPresencia() {
    var u = typeof usuarioActual === 'function' ? usuarioActual() : null;
    if (!u || !navigator.onLine) return;
    fetch(apiUrl('/api/presencia'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email })
    }).catch(function () {});
}

function iniciarPresencia() {
    if (_presenciaTimer) return;
    pingPresencia();
    _presenciaTimer = setInterval(pingPresencia, 30000);
}

/* El super lee cuantos hay conectados ahora mismo */
function conectadosAhora() {
    return fetch(apiUrl('/api/presencia'))
        .then(function (r) { return r.json(); })
        .then(function (j) { return j.conectados || 0; })
        .catch(function () { return null; });
}

document.addEventListener('DOMContentLoaded', iniciarPresencia);
