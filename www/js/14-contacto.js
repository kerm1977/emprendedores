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
    var logoImg = document.getElementById('det-logo');
    if (e.logo && logoImg) {
        logoImg.src = e.logo;
        logoImg.hidden = false;
        if (icono) icono.style.display = 'none';
    } else {
        if (logoImg) logoImg.hidden = true;
        if (icono) {
            icono.style.display = '';
            icono.className = 'fas ' + iconoDeCategoria(e.categoria);
        }
    }

    var filas = [];
    if (e.contacto) filas.push(['fas fa-user', 'Contacto', e.contacto, 'contacto']);
    if (e.telefono) filas.push(['fas fa-phone', 'Teléfono', e.telefono, 'telefono']);
    if (e.telefono2) filas.push(['fas fa-phone', 'Otro teléfono', e.telefono2, 'telefono2']);
    if (e.email) filas.push(['fas fa-envelope', 'Correo', e.email, 'email']);
    if (e.horario) filas.push(['fas fa-clock', 'Horario', e.horario, 'horario']);
    if (e.desc) filas.push(['fas fa-circle-info', 'Ofrece', e.desc, 'desc']);
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

    /* Ver mapa colapsado: expande el mapa embebido + botones */
    var vm = document.getElementById('det-vermapa');
    var mc = document.getElementById('det-mapa-cont');
    var mapas = document.getElementById('det-mapas');
    var mh = '';
    if (e.maps) {
        mh += '<a class="mapa-btn" target="_blank" rel="noopener" href="' +
            escapeHtml(typeof urlDireccion === 'function'
                ? urlDireccion(e.maps, 'maps') : e.maps) +
            '"><i class="fas fa-location-dot"></i> Google Maps</a>';
    }
    if (e.waze) {
        mh += '<a class="mapa-btn waze" target="_blank" rel="noopener" href="' +
            escapeHtml(typeof urlDireccion === 'function'
                ? urlDireccion(e.waze, 'waze') : e.waze) +
            '"><i class="fas fa-location-dot"></i> Waze</a>';
    }
    if (mapas) {
        mapas.innerHTML = mh;
        mapas.hidden = !mh;
    }
    if (vm && mc) {
        var conUbi = e.lat && e.lng;
        vm.hidden = !conUbi;
        mc.hidden = true;
        vm.onclick = function () {
            mc.hidden = !mc.hidden;
            vm.innerHTML = mc.hidden
                ? '<i class="fas fa-map"></i> Ver mapa'
                : '<i class="fas fa-map"></i> Ocultar mapa';
            if (!mc.hidden) _mapaDetalle(e);
        };
    }
    var bq = document.getElementById('det-qr');
    if (bq) bq.onclick = function () { mostrarQR(e.id); };
    var bt = document.getElementById('det-tarjeta');
    if (bt) bt.onclick = function () { descargarTarjeta(e.id); };
    var be = document.getElementById('det-editar');
    if (be) {
        /* Editar solo si hay usuario registrado */
        be.hidden = !(typeof usuarioActual === 'function' && usuarioActual());
        be.onclick = function () {
            if (typeof abrirEdicion === 'function') abrirEdicion(e); };
    }
    irAVista('view-emprendimiento', e.nombre);
}

/* Mapa embebido del detalle (con logo como marcador) */
var _detMapa = null;
function _mapaDetalle(e) {
    if (typeof L === 'undefined' || !e.lat || !e.lng) return;
    var box = document.getElementById('det-mapa');
    if (!box) return;
    var ll = [Number(e.lat), Number(e.lng)];
    var ic = e.logo ? L.divIcon({
        className: '', iconSize: [46, 46], iconAnchor: [23, 46],
        html: '<img class="marcador-logo" src="' + e.logo + '">'
    }) : undefined;
    if (_detMapa) { _detMapa.remove(); _detMapa = null; }
    _detMapa = L.map('det-mapa', { zoomControl: false }).setView(ll, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(_detMapa);
    L.marker(ll, ic ? { icon: ic } : {}).addTo(_detMapa);
    setTimeout(function () { _detMapa.invalidateSize(); }, 250);
}
