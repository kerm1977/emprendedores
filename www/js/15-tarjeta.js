/* 15-tarjeta.js - Tarjeta digital descargable: genera una mini pagina
   HTML independiente (estilos embebidos, sin CDNs) con la info del
   emprendimiento; todos los enlaces son tocables. */

function soloDigitos(t) {
    return String(t || '').replace(/\D/g, '');
}

function textoTarjeta(valor) {
    return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function urlTarjeta(valor) {
    try {
        var url = new URL(String(valor || '').trim());
        return /^(https?:|tel:|mailto:)$/.test(url.protocol) ? url.href : '';
    } catch (error) { return ''; }
}

function enlaceTarjeta(href, clase, texto) {
    var url = urlTarjeta(href);
    var icono = clase === 'boton google-maps' ?
        '<svg class="icono-maps" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
        '<path fill="#4285f4" d="M43.6 20.5H24v8h11.3C33.7 33 29.6 36 24 36a12 12 0 1 1 0-24c3 0 5.7 1.1 7.8 3l6-6A20.5 20.5 0 1 0 24 44.5c12 0 20-8.4 20-20.3 0-1.3-.1-2.5-.4-3.7"/>' +
        '<path fill="#34a853" d="M24 44.5c5.5 0 10.1-1.8 13.5-5l-6.6-5.1A12 12 0 0 1 13 28l-6.9 5.3A20.5 20.5 0 0 0 24 44.5"/>' +
        '<path fill="#fbbc05" d="M13 28a12 12 0 0 1 0-8l-6.9-5.3a20.5 20.5 0 0 0 0 18.6z"/>' +
        '<path fill="#ea4335" d="M24 12c3 0 5.7 1.1 7.8 3l6-6A20.5 20.5 0 0 0 6.1 14.7L13 20A12 12 0 0 1 24 12"/></svg>' : '';
    return url ? '<a class="' + textoTarjeta(clase) + '" href="' + textoTarjeta(url) +
        '" target="_blank" rel="noopener noreferrer">' + icono + textoTarjeta(texto) + '</a>' : '';
}

function marcaTarjeta() {
    var src = typeof API_BASE !== 'undefined' ? API_BASE + '/app/img/logo-emprendedores.png' : '';
    try {
        var img = document.querySelector('.topbar-logo');
        if (img && img.complete && img.naturalWidth) {
            var canvas = document.createElement('canvas');
            canvas.width = 480;
            canvas.height = Math.round(img.naturalHeight * canvas.width / img.naturalWidth);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            src = canvas.toDataURL('image/png');
        }
    } catch (error) {}
    return src ? '<img class="marca-logo" src="' + textoTarjeta(src) + '" alt="Emprendedores">' : '';
}

function telefonoTarjeta(valor) {
    var numero = soloDigitos(valor);
    return numero.length === 8 ? '506' + numero : numero;
}

function filaTarjeta(titulo, valor) {
    return valor ? '<div class="fila"><dt>' + textoTarjeta(titulo) + '</dt><dd>' +
        textoTarjeta(valor) + '</dd></div>' : '';
}

function logoTarjeta(valor) {
    if (/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(valor || '')) return valor;
    if (/^\/uploads\//.test(valor || '') && typeof API_BASE !== 'undefined') {
        return urlTarjeta(API_BASE + valor);
    }
    var url = urlTarjeta(valor);
    return /^https?:/.test(url) ? url : '';
}

function htmlTarjeta(e, contacto) {
    var tel = telefonoTarjeta(e.telefono);
    var tel2 = telefonoTarjeta(e.telefono2);
    var wa = telefonoTarjeta(e.whatsapp || (contacto && contacto.whatsapp && contacto.telefono));
    if (!wa && /^[678]/.test(soloDigitos(e.telefono).slice(-8))) wa = tel;
    var nombre = textoTarjeta(e.nombre || 'Emprendimiento');
    var direccion = e.sinUbicacion ? 'Servicio a domicilio · Sin dirección física' :
        [e.provincia, e.canton, e.distrito, e.lugar].filter(Boolean).join(' · ');
    var lat = Number(e.lat), lng = Number(e.lng);
    var ubicacion = !e.sinUbicacion && String(e.lat == null ? '' : e.lat).trim() !== '' &&
        String(e.lng == null ? '' : e.lng).trim() !== '' &&
        Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    var punto = ubicacion ? lat + ',' + lng : '';
    var maps = ubicacion ? 'https://www.google.com/maps/dir/?api=1&destination=' + punto : e.maps;
    var waze = ubicacion ? 'https://www.waze.com/ul?ll=' + punto + '&navigate=yes' : e.waze;
    var mapa = '';
    if (ubicacion) {
        var bbox = [Math.max(-180, lng - .01), Math.max(-90, lat - .01),
            Math.min(180, lng + .01), Math.min(90, lat + .01)].join(',');
        var origenMapa = 'https://www.openstreetmap.org/export/embed.html?bbox=' + encodeURIComponent(bbox) +
            '&layer=mapnik&marker=' + encodeURIComponent(punto);
        mapa = mapaTarjetaHtml(nombre, origenMapa);
    }
    var logo = logoTarjeta(e.logo);
    var redes = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'],
        ['telegram', 'Telegram'], ['web', 'Sitio web']].map(function (red) {
        var valor = String(e[red[0]] || '').trim();
        if (valor && !/^[a-z][a-z0-9+.-]*:/i.test(valor)) valor = 'https://' + valor;
        return enlaceTarjeta(valor, 'red', red[1]);
    }).join('');
    var pluses = (e.pluses || []).map(function (p) {
        var def = (typeof PLUSES !== 'undefined' ? PLUSES : []).find(function (x) { return x[0] === p; });
        return '<li>' + textoTarjeta(def ? def[1] : p) + '</li>';
    }).join('');
    var dias = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado', D: 'Domingo' };
    var agenda = (e.agenda || []).map(function (a) {
        return filaTarjeta(dias[a.dia] || a.dia, a.abre + ' – ' + a.cierra);
    }).join('');
    var acciones = enlaceTarjeta(tel ? 'tel:+' + tel : '', 'boton', 'Llamar') +
        enlaceTarjeta(wa ? 'https://wa.me/' + wa : '', 'boton wa', 'WhatsApp') +
        enlaceTarjeta(e.email ? 'mailto:' + e.email : '', 'boton', 'Enviar correo');
    var navegacion = e.sinUbicacion ? '' : enlaceTarjeta(maps, 'boton google-maps', 'Google Maps') +
        enlaceTarjeta(waze, 'boton waze', 'Waze');
    var fechaDescarga = new Date().toLocaleString('es-CR', {
        dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Costa_Rica'
    });
    return plantillaTarjeta({ e, contacto, tel2, wa, nombre, direccion, mapa, logo, redes,
        pluses, agenda, acciones, navegacion, fechaDescarga });
}
