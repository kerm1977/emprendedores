/* 21-socket.js - Socket.io vendored: canal en vivo con el servidor.
   Solo conecta cuando el API Flask esta disponible (apiDisponible),
   en estaticos/preview ni se intenta -> sin errores rojos. */

var _socket = null;

function initSocket() {
    if (typeof io === 'undefined') return;
    if (typeof apiDisponible === 'function' && !apiDisponible()) return;
    try {
        _socket = io('/', { transports: ['websocket', 'polling'],
                            reconnectionAttempts: 3, timeout: 4000 });
        _socket.on('connect', function () {
            marcarSync('ok');
        });
        _socket.on('datos', function (remoto) {
            /* El servidor empuja datos en vivo */
            if (remoto && App.data !== remoto) {
                App.data = remoto;
                localforage.setItem(STORAGE_KEY, remoto);
                renderTodo();
                showToast('Datos actualizados en vivo');
            }
        });
        _socket.on('connect_error', function () {
            _socket.close();
            _socket = null;
        });
    } catch (e) {
        _socket = null;
    }
}

/* Emite un evento al servidor cuando hay conexion */
function socketEmitir(evento, datos) {
    if (_socket && _socket.connected) {
        _socket.emit(evento, datos);
        return true;
    }
    return false;
}
