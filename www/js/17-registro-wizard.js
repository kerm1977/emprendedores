/* 17-registro-wizard.js - Wizard por pasos del registro de emprendimiento
   y selector de ubicacion con mapa (Leaflet + OpenStreetMap). */

var _mapa = null;
var _marcador = null;
var PASO_TOTAL = 6;
var pasoActual = 1;

function mostrarPaso(n) {
    pasoActual = n;
    document.querySelectorAll('#form-emprendimiento .paso').forEach(function (p) {
        p.hidden = Number(p.dataset.paso) !== n;
    });
    var ind = document.getElementById('wizard-pasos');
    if (ind) ind.textContent = 'Paso ' + n + ' de ' + PASO_TOTAL;
    var atras = document.getElementById('w-atras');
    var sig = document.getElementById('w-sig');
    var guardar = document.getElementById('w-guardar');
    if (atras) atras.hidden = n === 1;
    if (sig) sig.hidden = n === PASO_TOTAL;
    if (guardar) guardar.hidden = n !== PASO_TOTAL;
    if (n === 4) initMapaPick();
}

function validarPaso(n) {
    if (n === 1 && !document.getElementById('emp-categoria').value) {
        showToast('Elegí una categoría');
        return false;
    }
    if (n === 2 && !document.getElementById('emp-nombre').value.trim()) {
        showToast('Escribí el nombre del emprendimiento');
        return false;
    }
    return true;
}

function initWizard() {
    var sig = document.getElementById('w-sig');
    var atras = document.getElementById('w-atras');
    if (sig) {
        sig.addEventListener('click', function () {
            if (validarPaso(pasoActual)) mostrarPaso(pasoActual + 1);
        });
    }
    if (atras) {
        atras.addEventListener('click', function () {
            mostrarPaso(pasoActual - 1);
        });
    }
    var geo = document.getElementById('emp-geo');
    if (geo) geo.addEventListener('click', usarGeolocalizacion);
    mostrarPaso(1);
}

/* ============ Mapa para marcar ubicacion ============ */

function ponerMarcador(lat, lng) {
    document.getElementById('emp-lat').value = lat;
    document.getElementById('emp-lng').value = lng;
    /* Los links de "como llegar" se generan desde la ubicacion */
    var maps = 'https://www.google.com/maps?q=' + lat + ',' + lng;
    var waze = 'https://waze.com/ul?ll=' + lat + ',' + lng;
    document.getElementById('emp-maps').value = maps;
    document.getElementById('emp-waze').value = waze;
    var pm = document.getElementById('prev-maps');
    var pa = document.getElementById('prev-maps-a');
    var pw = document.getElementById('prev-waze');
    var pb = document.getElementById('prev-waze-a');
    if (pm && pa) { pa.href = urlDireccion(maps, 'maps'); pm.hidden = false; }
    if (pw && pb) { pb.href = urlDireccion(waze, 'waze'); pw.hidden = false; }
}

function initMapaPick() {
    if (_mapa || typeof L === 'undefined') {
        if (typeof L === 'undefined') showToast('Mapa no disponible offline');
        return;
    }
    _mapa = L.map('emp-mapa').setView([9.9363, -84.088], 8); /* CR centro */
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(_mapa);
    _mapa.on('click', function (e) {
        if (_marcador) _marcador.setLatLng(e.latlng);
        else _marcador = L.marker(e.latlng).addTo(_mapa);
        ponerMarcador(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    });
    setTimeout(function () { _mapa.invalidateSize(); }, 250);
}

function usarGeolocalizacion() {
    if (!navigator.geolocation) {
        showToast('Geolocalización no disponible');
        return;
    }
    navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = pos.coords.latitude.toFixed(6);
        var lng = pos.coords.longitude.toFixed(6);
        if (_mapa) {
            var ll = [pos.coords.latitude, pos.coords.longitude];
            if (_marcador) _marcador.setLatLng(ll);
            else _marcador = L.marker(ll).addTo(_mapa);
            _mapa.setView(ll, 16);
        }
        ponerMarcador(lat, lng);
        showToast('Ubicación marcada');
    }, function () {
        showToast('No se pudo obtener la ubicación');
    });
}
