/* 17-registro-wizard.js - Wizard por pasos del registro de emprendimiento
   y selector de ubicacion con mapa (Leaflet + OpenStreetMap). */

var _mapa = null;
var _marcador = null;

function _iconoEmp() {
    /* Logo del emprendimiento como gotita del mapa */
    if (App._empLogoTmp) {
        return L.divIcon({
            className: '',
            html: '<img class="marcador-logo" src="' +
                  App._empLogoTmp + '">',
            iconSize: [46, 46], iconAnchor: [23, 46]
        });
    }
    return undefined; /* gotita Leaflet por defecto */
}

function _moverMarcador(ll) {
    if (_marcador) { _marcador.setLatLng(ll); _marcador.setIcon(_iconoEmp() || _marcador.options.icon); }
    else _marcador = L.marker(ll, { icon: _iconoEmp() }).addTo(_mapa);
    if (App._empLogoTmp && _marcador.setIcon) _marcador.setIcon(_iconoEmp());
}
var PASO_TOTAL = 8;
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
    /* Ojos de contrasena del paso 8 */
    var form = document.getElementById('form-emprendimiento');
    if (form) form.addEventListener('click', function (e) {
        var ojo = e.target.closest('.pass-ojo');
        if (!ojo) return;
        var inp = document.getElementById(ojo.dataset.ojo);
        if (!inp) return;
        inp.type = inp.type === 'password' ? 'text' : 'password';
        ojo.classList.toggle('activo');
        ojo.querySelector('i').className =
            inp.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
    var logoIn = document.getElementById('emp-logo');
    if (logoIn) logoIn.addEventListener('change', function () {
        var f = logoIn.files && logoIn.files[0];
        if (!f) return;
        var rd = new FileReader();
        rd.onload = function () {
            /* Comprimir a 256px JPEG para no saturar el blob */
            var img = new Image();
            img.onload = function () {
                var cv = document.createElement('canvas');
                var k = Math.min(1, 256 / Math.max(img.width, img.height));
                cv.width = img.width * k;
                cv.height = img.height * k;
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                App._empLogoTmp = cv.toDataURL('image/jpeg', 0.8);
                var prev = document.getElementById('emp-logo-prev');
                if (prev) { prev.src = App._empLogoTmp; prev.hidden = false; }
                if (_marcador) _marcador.setIcon(_iconoEmp());
            };
            img.src = rd.result;
        };
        rd.readAsDataURL(f);
    });
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
    var pm = document.getElementById('prev-mapas');
    var pa = document.getElementById('prev-maps-a');
    var pb = document.getElementById('prev-waze-a');
    if (pa) pa.href = urlDireccion(maps, 'maps');
    if (pb) pb.href = urlDireccion(waze, 'waze');
    if (pm) pm.hidden = false;
    /* Anti-mezcla: el punto nuevo manda. Se limpia todo antes de
       geocodificar para que nunca queden datos de otra ubicacion */
    ['emp-provincia', 'emp-canton', 'emp-distrito', 'emp-lugar']
        .forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
    resolverUbicacion(Number(lat), Number(lng));
}

/* Al marcar el mapa: provincia, canton y distrito se llenan solos
   (Nominatim/OpenStreetMap; si no hay internet, queda manual) */
/* OBLIGADO: al marcar el mapa o usar GPS, provincia, canton,
   distrito y direccion se llenan SI O SI. Primero Nominatim;
   si falla, BigDataCloud (ambos gratis, sin key). Si ninguno
   responde, se avisa para llenar a mano. */
function _normProv(txt) {
    return (txt || '').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function _selProvincia(prov, state) {
    if (!prov || !state) return;
    var nState = _normProv(state);
    var ok = false;
    prov.querySelectorAll('option').forEach(function (o) {
        var nOp = _normProv(o.textContent.trim());
        if (nOp.length > 2 && nState.indexOf(nOp) !== -1) {
            prov.value = o.textContent.trim();
            ok = true;
        }
    });
    if (!ok) prov.value = state;
}

function _llenarUbi(a, display) {
    _selProvincia(document.getElementById('emp-provincia'),
                  a.state || a.provincia);
    var cant = document.getElementById('emp-canton');
    var dist = document.getElementById('emp-distrito');
    var lug = document.getElementById('emp-lugar');
    if (cant) cant.value = a.county || a.city || a.canton || '';
    if (dist) dist.value = a.town || a.suburb || a.village ||
                           a.city_district || a.distrito || '';
    if (lug) lug.value = a.road || a.neighbourhood || a.hamlet ||
                         a.village || a.suburb ||
                         (display || '').split(',')[0] || '';
    return true;
}

var _ubiSeq = 0;

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
        _moverMarcador(e.latlng);
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
        if (!_mapa && typeof L !== 'undefined') initMapaPick();
        var ll = [pos.coords.latitude, pos.coords.longitude];
        if (_mapa) {
            _moverMarcador(ll);
            _mapa.flyTo(ll, 16); /* siempre vuelve al GPS real */
        }
        ponerMarcador(lat, lng);
        showToast('Ubicación marcada');
    }, function (err) {
        /* Sin ubicacion/GPS apagado: abrir ajustes de ubicacion */
        showToast('Activá la ubicación del celular');
        try {
            window.location.href =
                'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end';
        } catch (e2) { /* en navegador solo queda el aviso */ }
    }, { enableHighAccuracy: true, timeout: 10000 });
}
