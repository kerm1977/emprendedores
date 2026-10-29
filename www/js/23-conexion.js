/* 23-conexion.js - Probador de comunicacion app <-> PythonAnywhere.
   Solo para superusuario: mide latencia y estado del API Flask. */

async function probarConexion() {
    var out = document.getElementById('con-test');
    if (!out) return;
    var destino = apiUrl('/api/data');
    out.className = 'con-test';
    out.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Probando ' +
                    destino + '...';
    var t0 = performance.now();
    try {
        var res = await fetch(destino, { cache: 'no-store' });
        var ms = Math.round(performance.now() - t0);
        if (res.ok) {
            var d = await res.json();
            var emps = (d.emprendimientos || []).length;
            out.classList.add('ok');
            out.innerHTML = '<i class="fas fa-circle-check"></i> ' +
                '<b>Conectado</b> · ' + ms + ' ms · ' +
                emps + ' emprendimientos en el servidor';
        } else {
            out.classList.add('mal');
            out.innerHTML = '<i class="fas fa-circle-xmark"></i> ' +
                'HTTP ' + res.status + ' · el servidor no responde bien';
        }
    } catch (e) {
        out.classList.add('mal');
        out.innerHTML = '<i class="fas fa-plug-circle-xmark"></i> ' +
            'Sin conexión: ' + (e.message || 'offline') +
            '<br><small>Destino: ' + destino + '</small>';
    }
}
