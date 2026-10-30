/* 25-editar.js - Pagina de edicion del emprendimiento (completa) */
var _edEmp = null, _edMapa = null, _edMarcador = null, _edLogoTmp = '';
var _prepararAccionesEdicion = null, _edMapaActivo = false;

async function initEditar() {
    var res = await fetch('parciales/editar.html');
    if (!res.ok) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = await res.text();
    var vista = tmp.querySelector('#view-editar-emp');
    var main = document.querySelector('.app-main');
    if (vista && main) main.appendChild(vista);
    _prepararAccionesEdicion = function (e) {
    /* Pausar/reactivar: el negocio desaparece del buscador y listas */
    var btnPausa = document.getElementById('ed-pausar');
    if (btnPausa) {
        btnPausa.innerHTML = e.pausa
            ? '<i class="fas fa-play"></i> Reactivar emprendimiento'
            : '<i class="fas fa-pause"></i> Pausar emprendimiento';
        btnPausa.onclick = async function () {
            if (!e.pausa && !confirm(
                '¿Pausar "' + e.nombre + '"?\n\n' +
                'Al pausarlo, la gente dejará de encontrarlo en el buscador. Podés reactivarlo cuando quieras.')) {
                return;
            }
            e.pausa = !e.pausa;
            await saveData();
            showToast(e.pausa
                ? 'Emprendimiento pausado'
                : 'Emprendimiento reactivado');
            btnPausa.innerHTML = e.pausa
                ? '<i class="fas fa-play"></i> Reactivar emprendimiento'
                : '<i class="fas fa-pause"></i> Pausar emprendimiento';
            renderTodo();
        };
    }
    /* Eliminar: confirmacion en 4 pasos */
    var btnElim = document.getElementById('ed-eliminar');
    if (btnElim) btnElim.onclick = function () {
        var pasos = [
            'Paso 1 de 4: vas a eliminar "' + e.nombre + '". ¿Seguir?',
            'Paso 2 de 4: se borra toda la info: datos, logo, mapa, ' +
                'pluses y horario. ¿Seguir?',
            'Paso 3 de 4: también se quitan las visitas y likes ' +
                'guardados. ¿Seguir?',
            'Paso 4 de 4: definitivo, sin recuperación. ' +
                '¿Eliminar permanentemente?'
        ];
        var i = 0;
        (function siguiente() {
            if (i >= pasos.length) {
                (async function () {
                    var arr = App.data.emprendimientos || [];
                    App.data.emprendimientos = arr.filter(function (x) {
                        return String(x.id) !== String(e.id);
                    });
                    var u = usuarioActual();
                    if (typeof pushNotificacion === 'function') {
                        if (typeof logActividad === 'function') {
                        logActividad('eliminar',
                            (u ? u.email : 'Usuario') +
                            ' eliminó "' + e.nombre + '"');
                    }
                    pushNotificacion('eliminar',
                            (u ? u.email : 'Un usuario') +
                            ' eliminó su negocio "' + e.nombre + '"');
                    }
                    await saveData();
                    showToast('Emprendimiento eliminado');
                    irAVista('view-perfil', 'Perfil');
                })();
                return;
            }
            if (confirm(pasos[i++])) siguiente();
        })();
    };
    };
    var form = document.getElementById('form-editar');
    if (form) form.addEventListener('submit', guardarEdicion);
    var lg = document.getElementById('ed-logo');
    if (lg) lg.onclick = function () {
        document.getElementById('ed-logo-in').click(); };
    var lin = document.getElementById('ed-logo-in');
    if (lin) lin.onchange = function () {
        var f = lin.files[0]; if (!f) return;
        var rd = new FileReader();
        rd.onload = function () {
            var img = new Image();
            img.onload = function () {
                var cv = document.createElement('canvas');
                var k = Math.min(1, 256 / Math.max(img.width, img.height));
                cv.width = img.width * k; cv.height = img.height * k;
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                _edLogoTmp = cv.toDataURL('image/jpeg', 0.8);
                lg.src = _edLogoTmp;
                _edMarcar();
            };
            img.src = rd.result;
        };
        rd.readAsDataURL(f);
    };
    var geo = document.getElementById('ed-geo');
    if (geo) geo.onclick = function () {
        navigator.geolocation.getCurrentPosition(function (p) {
            document.getElementById('ed-lat').value = p.coords.latitude;
            document.getElementById('ed-lng').value = p.coords.longitude;
            _edMarcar();
            _edMapa.flyTo([p.coords.latitude, p.coords.longitude], 16);
            _edGeocod(p.coords.latitude, p.coords.longitude);
        });
    };
}

function abrirEdicion(e) {
    _edEmp = e;
    if (_prepararAccionesEdicion) _prepararAccionesEdicion(e);
    _edLogoTmp = e.logo || '';
    var set = function (id, v) {
        var el = document.getElementById(id);
        if (el) el.value = v || ''; };
    set('ed-nombre', e.nombre); set('ed-categoria', e.categoria);
    set('ed-contacto', e.contacto); set('ed-whatsapp', e.whatsapp);
    set('ed-telefono', e.telefono); set('ed-telefono2', e.telefono2);
    set('ed-email', e.email); set('ed-provincia', e.provincia);
    set('ed-canton', e.canton); set('ed-distrito', e.distrito);
    set('ed-lugar', e.lugar); set('ed-lat', e.lat); set('ed-lng', e.lng);
    set('ed-facebook', e.facebook); set('ed-tiktok', e.tiktok);
    set('ed-instagram', e.instagram); set('ed-telegram', e.telegram);
    set('ed-horario', e.horario); set('ed-desc', e.desc);
    var lg = document.getElementById('ed-logo');
    if (lg && _edLogoTmp) lg.src = urlLogoNegocio(_edLogoTmp);
    var pl = document.getElementById('ed-pluses');
    if (pl) pl.innerHTML = (typeof PLUSES !== 'undefined' ? PLUSES : [])
        .map(function (t) {
            var on = (e.pluses || []).indexOf(t[0]) !== -1;
            return '<span class="emp-flag ed-plus' + (on ? ' on' : '') +
                '" data-plus="' + t[0] + '"><i class="fas ' + t[2] +
                '"></i> ' + t[1] + '</span>';
        }).join('');
    if (pl) pl.querySelectorAll('.ed-plus').forEach(function (c) {
        c.onclick = function () { c.classList.toggle('on'); }; });
    irAVista('view-editar-emp', 'Editar');
    setTimeout(_edInitMapa, 200);
}

function _edInitMapa() {
    if (typeof L === 'undefined') return;
    var lat = Number(document.getElementById('ed-lat').value) || 9.93;
    var lng = Number(document.getElementById('ed-lng').value) || -84.08;
    if (_edMapa) { _edMapa.remove(); _edMapa = null; }
    _edMarcador = null;
    _edMapa = L.map('ed-mapa', { dragging: false, scrollWheelZoom: false,
        touchZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, tapHold: false }).setView([lat, lng], 14);
    _edActivarMapa(false);
    document.getElementById('ed-mapa-activar').onclick = function () { _edActivarMapa(true); };
    document.getElementById('ed-mapa-bloquear').onclick = function () { _edActivarMapa(false); };
    document.getElementById('ed-mapa-centrar').onclick = function () {
        var la = document.getElementById('ed-lat').value;
        var ln = document.getElementById('ed-lng').value;
        if (la !== '' && ln !== '') _edMapa.setView([Number(la), Number(ln)], 14);
        _edActivarMapa(false);
    };
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(_edMapa);
    _edMarcar();
    _edMapa.on('click', function (ev) {
        if (!_edMapaActivo) return;
        document.getElementById('ed-lat').value = ev.latlng.lat.toFixed(6);
        document.getElementById('ed-lng').value = ev.latlng.lng.toFixed(6);
        _edMarcar();
        _edGeocod(ev.latlng.lat, ev.latlng.lng);
    });
    setTimeout(function () { _edMapa.invalidateSize(); }, 200);
}

function _edActivarMapa(activo) {
    _edMapaActivo = activo;
    document.getElementById('ed-mapa-marco').classList.toggle('mapa-activo', activo);
    document.getElementById('ed-mapa-activar').hidden = activo;
    document.getElementById('ed-mapa-bloquear').hidden = !activo;
    if (!_edMapa) return;
    ['dragging', 'scrollWheelZoom', 'touchZoom', 'doubleClickZoom', 'boxZoom', 'keyboard', 'tapHold'].forEach(function (n) {
        if (_edMapa[n]) _edMapa[n][activo ? 'enable' : 'disable']();
    });
    _edMapa.getContainer().tabIndex = activo ? 0 : -1;
}

function _edMarcar() {
    var lat = Number(document.getElementById('ed-lat').value);
    var lng = Number(document.getElementById('ed-lng').value);
    if (!_edMapa || !lat) return;
    var ic = _edLogoTmp ? L.divIcon({ className: '',
        iconSize: [46, 46], iconAnchor: [23, 46],
        html: '<img class="marcador-logo" src="' + escapeHtml(urlLogoNegocio(_edLogoTmp)) + '">'
    }) : undefined;
    var ll = [lat, lng];
    if (_edMarcador) { _edMarcador.setLatLng(ll);
        if (ic) _edMarcador.setIcon(ic); }
    else _edMarcador = L.marker(ll, ic ? { icon: ic } : {}).addTo(_edMapa);
}

async function _edGeocod(lat, lng) {
    try {
        var r = await fetch('https://nominatim.openstreetmap.org/reverse' +
            '?format=json&lat=' + lat + '&lon=' + lng +
            '&zoom=14&accept-language=es');
        var d = await r.json();
        var a = (d && d.address) || {};
        if (typeof _selProvincia === 'function') {
            _selProvincia(document.getElementById('ed-provincia'),
                a.state || a.province || a.region || ''); }
        var c = document.getElementById('ed-canton');
        var ds = document.getElementById('ed-distrito');
        var lg = document.getElementById('ed-lugar');
        if (c) c.value = a.county || a.city || '';
        if (ds) ds.value = a.town || a.suburb || a.village || '';
        if (lg) lg.value = a.road || a.neighbourhood || a.hamlet || '';
    } catch (e) {}
}

function guardarEdicion(ev) {
    ev.preventDefault();
    var e = _edEmp;
    if (!e) return;
    var gv = function (id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : ''; };
    e.nombre = gv('ed-nombre') || e.nombre;
    e.categoria = gv('ed-categoria'); e.contacto = gv('ed-contacto');
    e.whatsapp = gv('ed-whatsapp'); e.telefono = gv('ed-telefono');
    e.telefono2 = gv('ed-telefono2'); e.email = gv('ed-email');
    e.provincia = gv('ed-provincia'); e.canton = gv('ed-canton');
    e.distrito = gv('ed-distrito'); e.lugar = gv('ed-lugar');
    e.lat = gv('ed-lat'); e.lng = gv('ed-lng');
    e.facebook = gv('ed-facebook'); e.tiktok = gv('ed-tiktok');
    e.instagram = gv('ed-instagram'); e.telegram = gv('ed-telegram');
    e.horario = gv('ed-horario'); e.desc = gv('ed-desc');
    e.logo = _edLogoTmp;
    e.pluses = [];
    document.querySelectorAll('#ed-pluses .ed-plus.on')
        .forEach(function (c) { e.pluses.push(c.dataset.plus); });
    var arr = App.data.emprendimientos || [];
    var i = arr.findIndex(function (x) {
        return String(x.id) === String(e.id); });
    if (i !== -1) arr[i] = e;
    saveData();
    showToast('Cambios guardados');
    verEmprendimiento(e.id);
}
