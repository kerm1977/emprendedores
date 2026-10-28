/* 14-contacto.js - Vista de detalle del contacto del directorio.
   Muestra emprendimiento, contacto, horario y acciones (llamar/WhatsApp). */

/* Vista de contacto: datos + botones de llamada y WhatsApp */
function verContacto(id) {
    var p = (App.data.emprendedores || []).find(function (x) {
        return String(x.id) === String(id);
    });
    if (!p) return;
    var emp = (App.data.emprendimientos || []).find(function (x) {
        return String(x.id) === String(p.empId);
    }) || {};
    setTexto('con-emp', p.emprendimiento || p.nombre);
    setTexto('con-nombre', p.nombre);
    setTexto('con-telefono', p.telefono || 'Sin teléfono');
    setTexto('con-horario', emp.horario || 'Horario no indicado');
    setTexto('con-lugar', emp.lugar || 'Sin ubicación');
    var digitos = (p.telefono || '').replace(/\D/g, '');
    /* Se ignora el codigo de pais (+506): el numero local son 8 digitos */
    var local = digitos.length > 8 ? digitos.slice(-8) : digitos;
    var btnLlamar = document.getElementById('btn-llamar');
    var btnWa = document.getElementById('btn-whatsapp');
    if (btnLlamar) {
        btnLlamar.href = 'tel:+506' + local;
        btnLlamar.hidden = !local;
    }
    if (btnWa) {
        /* WhatsApp solo para celulares CR: el numero local empieza con 6, 7 u 8 */
        var esMovil = /^[678]/.test(local);
        if (esMovil) {
            btnWa.href = 'https://wa.me/506' + local;
            btnWa.classList.remove('desactivado');
        } else {
            btnWa.removeAttribute('href');
            btnWa.classList.add('desactivado');
        }
    }
    irAVista('view-contacto', 'Contacto');
}

/* Detalle completo del emprendimiento al tocar su tarjeta */
function verEmprendimiento(id) {
    var e = (App.data.emprendimientos || []).find(function (x) {
        return String(x.id) === String(id);
    });
    if (!e) return;
    setTexto('det-nombre', e.nombre);
    setTexto('det-categoria', e.categoria + (e.lugar ? ' · ' + e.lugar : ''));
    var icono = document.getElementById('det-icono');
    if (icono) icono.className = 'fas ' + iconoDeCategoria(e.categoria);

    var filas = [];
    if (e.contacto) filas.push(['fas fa-user', 'Contacto', e.contacto]);
    if (e.telefono) filas.push(['fas fa-phone', 'Teléfono', e.telefono]);
    if (e.whatsapp) filas.push(['fab fa-whatsapp', 'WhatsApp', e.whatsapp]);
    if (e.telefono2) filas.push(['fas fa-phone', 'Otro teléfono', e.telefono2]);
    if (e.email) filas.push(['fas fa-envelope', 'Correo', e.email]);
    if (e.horario) filas.push(['fas fa-clock', 'Horario', e.horario]);
    if (e.desc) filas.push(['fas fa-circle-info', 'Ofrece', e.desc]);
    document.getElementById('det-datos').innerHTML = filas.map(function (f) {
        return '<div class="perfil-dato"><i class="' + f[0] + '"></i>' +
            '<span><b>' + f[1] + ':</b> ' + escapeHtml(f[2]) + '</span></div>';
    }).join('');

    var pluses = document.getElementById('det-pluses');
    pluses.innerHTML = (e.pluses || []).map(function (p) {
        var def = (typeof PLUSES !== 'undefined' ? PLUSES : []).find(
            function (x) { return x[0] === p; });
        return def ? '<span class="emp-flag"><i class="fas ' + def[2] +
            '"></i> ' + def[1] + '</span>' : '';
    }).join('');

    var mapas = document.getElementById('det-mapas');
    var mh = '';
    if (e.maps) {
        mh += '<a class="mapa-mini emp-mini" target="_blank" rel="noopener" href="' +
            escapeHtml(typeof urlDireccion === 'function'
                ? urlDireccion(e.maps, 'maps') : e.maps) +
            '"><i class="fas fa-location-dot"></i><span>Google Maps</span></a>';
    }
    if (e.waze) {
        mh += '<a class="mapa-mini emp-mini waze" target="_blank" rel="noopener" href="' +
            escapeHtml(typeof urlDireccion === 'function'
                ? urlDireccion(e.waze, 'waze') : e.waze) +
            '"><i class="fas fa-location-dot"></i><span>Waze</span></a>';
    }
    mapas.innerHTML = mh;

    var redes = document.getElementById('det-redes');
    var rh = '';
    [['facebook', 'fa-facebook-f'], ['tiktok', 'fa-tiktok'],
     ['instagram', 'fa-instagram'], ['telegram', 'fa-telegram']]
        .forEach(function (r) {
            if (e[r[0]]) {
                rh += '<a class="emp-mapa emp-social" href="' + escapeHtml(e[r[0]]) +
                    '" target="_blank" rel="noopener" title="' + r[0] + '">' +
                    '<i class="fab ' + r[1] + '"></i></a>';
            }
        });
    redes.innerHTML = rh;

    var bq = document.getElementById('det-qr');
    if (bq) bq.onclick = function () { mostrarQR(e.id); };
    var bt = document.getElementById('det-tarjeta');
    if (bt) bt.onclick = function () { descargarTarjeta(e.id); };
    irAVista('view-emprendimiento', e.nombre);
}
