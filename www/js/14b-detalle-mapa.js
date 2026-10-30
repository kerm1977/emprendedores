/* Mapa embebido del detalle (con logo como marcador) */
var _detMapa = null;

function ubicacionDetalleValida(e) {
    return !e.sinUbicacion && String(e.lat == null ? '' : e.lat).trim() !== '' &&
        String(e.lng == null ? '' : e.lng).trim() !== '' &&
        Number.isFinite(Number(e.lat)) && Math.abs(Number(e.lat)) <= 90 &&
        Number.isFinite(Number(e.lng)) && Math.abs(Number(e.lng)) <= 180;
}

function activarMapaDetalle(activo) {
    var cont = document.getElementById('det-mapa-cont');
    if (cont) cont.classList.toggle('mapa-activo', activo);
    var activar = document.getElementById('det-mapa-activar');
    var bloquear = document.getElementById('det-mapa-bloquear');
    if (activar) activar.hidden = activo;
    if (bloquear) bloquear.hidden = !activo;
    if (!_detMapa) return;
    ['dragging', 'scrollWheelZoom', 'touchZoom', 'doubleClickZoom', 'boxZoom', 'keyboard', 'tapHold'].forEach(function (nombre) {
        if (_detMapa[nombre]) _detMapa[nombre][activo ? 'enable' : 'disable']();
    });
    _detMapa.getContainer().tabIndex = activo ? 0 : -1;
}

function configurarMapaDetalle(e) {
    if (_detMapa) { _detMapa.remove(); _detMapa = null; }
    var vm = document.getElementById('det-vermapa');
    var mc = document.getElementById('det-mapa-cont');
    if (!vm || !mc) return;
    vm.hidden = !ubicacionDetalleValida(e);
    mc.hidden = true;
    vm.setAttribute('aria-expanded', 'false');
    vm.innerHTML = '<i class="fas fa-map"></i> Ver mapa';
    activarMapaDetalle(false);
    vm.onclick = function () {
        mc.hidden = !mc.hidden;
        vm.setAttribute('aria-expanded', String(!mc.hidden));
        vm.innerHTML = '<i class="fas fa-map"></i> ' + (mc.hidden ? 'Ver mapa' : 'Ocultar mapa');
        if (!mc.hidden) {
            if (!_detMapa) _mapaDetalle(e);
            if (_detMapa) _detMapa.invalidateSize();
        }
        activarMapaDetalle(false);
    };
    document.getElementById('det-mapa-activar').onclick = function () { activarMapaDetalle(true); };
    document.getElementById('det-mapa-bloquear').onclick = function () { activarMapaDetalle(false); };
    document.getElementById('det-mapa-centrar').onclick = function () {
        if (_detMapa) _detMapa.setView([Number(e.lat), Number(e.lng)], 15);
        activarMapaDetalle(false);
    };
}

function _mapaDetalle(e) {
    if (typeof L === 'undefined' || !ubicacionDetalleValida(e)) return;
    var box = document.getElementById('det-mapa');
    if (!box) return;
    var ll = [Number(e.lat), Number(e.lng)];
    var logo = urlLogoNegocio(e.logo);
    var ic = logo ? L.divIcon({
        className: 'det-marcador', iconSize: [60, 60], iconAnchor: [30, 60],
        html: '<img class="marcador-logo det-marcador-logo" src="' + escapeHtml(logo) + '">'
    }) : undefined;
    if (_detMapa) { _detMapa.remove(); _detMapa = null; }
    _detMapa = L.map('det-mapa', { zoomControl: false, dragging: false,
        scrollWheelZoom: false, touchZoom: false, doubleClickZoom: false,
        boxZoom: false, keyboard: false, tapHold: false }).setView(ll, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(_detMapa);
    L.marker(ll, ic ? { icon: ic, draggable: false } : { draggable: false }).addTo(_detMapa);
    activarMapaDetalle(false);
}
