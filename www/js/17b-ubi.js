/* 17b-ubi.js - Motor de ubicacion del wizard (BLINDADO TOTAL).
   Extraido de 17-registro-wizard.js por la regla de 250 lineas.

/* BLINDADO TOTAL (orden del usuario): PROHIBIDO tocar este motor
   GPS/mapa/geocode salvo orden explicita. API=verdad, 1 sola
   escritura, anti-carrera _ubiSeq, GPS siempre vuelve (flyTo),
   poligonos locales solo sin red, Maps/Waze se guardan con el emp. */
/* MOTOR NUEVO: la API es la verdad -> la provincia se escribe UNA
   vez, correcta, sin parpadeo. Poligonos locales solo cuando NO
   hay red (mejor una estimacion que nada). */
async function resolverUbicacion(lat, lng) {
    var seq = ++_ubiSeq;
    var prov = document.getElementById('emp-provincia');
    var cant = document.getElementById('emp-canton');
    var dist = document.getElementById('emp-distrito');
    var lug = document.getElementById('emp-lugar');
    if (lug) lug.placeholder = 'Buscando dirección...';
    /* Proveedor 1: Nominatim */
    try {
        var r = await fetch('https://nominatim.openstreetmap.org/reverse' +
            '?format=json&lat=' + lat + '&lon=' + lng +
            '&zoom=18&accept-language=es');
        var d = await r.json();
        if (seq !== _ubiSeq) return;
        if (d && d.address) {
            _selProvincia(prov, d.address.state || d.address.province ||
                                d.address.region || '');
            if (cant) cant.value = d.address.county || d.address.city || '';
            if (dist) dist.value = d.address.town || d.address.suburb ||
                                   d.address.village || d.address.city_district || '';
            if (lug) lug.value = d.address.road || d.address.neighbourhood ||
                                 d.address.hamlet || '';
            if (lug) lug.placeholder = 'Ej: 200m norte de la escuela...';
            return;
        }
    } catch (e) {}
    /* Proveedor 2: BigDataCloud */
    try {
        var r2 = await fetch(
            'https://api.bigdatacloud.net/data/reverse-geocode-client' +
            '?latitude=' + lat + '&longitude=' + lng + '&localityLanguage=es');
        var d2 = await r2.json();
        if (seq !== _ubiSeq) return;
        if (d2 && d2.principalSubdivision) {
            _selProvincia(prov, d2.principalSubdivision);
            if (cant) cant.value = d2.locality || '';
            if (dist) dist.value = d2.city || '';
            if (lug) lug.value = d2.street || '';
            if (lug) lug.placeholder = 'Ej: 200m norte de la escuela...';
            return;
        }
    } catch (e2) {}
    if (seq !== _ubiSeq) return;
    /* Proveedor 3 (ultimo recurso, sin red): poligono local */
    if (typeof provinciaDeCoord === 'function') {
        _selProvincia(prov, provinciaDeCoord(lat, lng));
        showToast('Sin internet: provincia estimada por coordenadas');
    } else {
        showToast('Escribí la provincia a mano');
    }
    if (lug) lug.placeholder = 'Ej: 200m norte de la escuela...';
}

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

