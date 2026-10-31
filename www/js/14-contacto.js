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
var _detLikeTimer = null;
function verEmprendimiento(id) {
    var _e = (App.data.emprendimientos || []).find(function (x) {
        return String(x.id) === String(id);
    });
    if (_e) {
        _e.visitas = _e.visitas || [];
        var _vu = usuarioActual();
        _e.visitas.push({ ts: Date.now(),
                          by: _vu ? _vu.email : '' });
        App.data.catsBuscadas = App.data.catsBuscadas || {};
        var c = _e.categoria || '';
        App.data.catsBuscadas[c] = (App.data.catsBuscadas[c] || 0) + 1;
        saveData();
    }
    var e = (App.data.emprendimientos || []).find(function (x) {
        return String(x.id) === String(id);
    });
    if (!e) return;
    setTexto('det-nombre', e.nombre);
    setTexto('det-categoria', e.categoria + (e.lugar ? ' · ' + e.lugar : ''));
    var icono = document.getElementById('det-icono');
    var logoImg = document.getElementById('det-logo');
    var logo = urlLogoNegocio(e.logo);
    if (icono) {
        icono.style.display = '';
        icono.className = 'fas ' + iconoDeCategoria(e.categoria);
        icono.hidden = !!logo;
    }
    if (logoImg) {
        logoImg.hidden = !logo;
        logoImg.setAttribute('data-logo-negocio', '');
        if (logo) logoImg.src = logo;
        else logoImg.removeAttribute('src');
    }

    var filas = [];
    if (e.contacto) filas.push(['fas fa-user', 'Contacto', e.contacto, 'contacto']);
    if (e.telefono) filas.push(['fas fa-phone', 'Teléfono', e.telefono, 'telefono']);
    if (e.telefono2) filas.push(['fas fa-phone', 'Otro teléfono', e.telefono2, 'telefono2']);
    if (e.email) filas.push(['fas fa-envelope', 'Correo', e.email, 'email']);
    if (e.sinUbicacion) filas.push(['fas fa-motorcycle',
        'Servicio', 'A domicilio (sin dirección física)', 'ubicacion']);
    if (e.h24) filas.push(['fas fa-clock', 'Horario',
        'Atención 24 horas', 'horario']);
    else if (e.horario) filas.push(['fas fa-clock', 'Horario',
        e.horario, 'horario']);
    if (e.feriados) filas.push(['fas fa-calendar-star',
        'Feriados', 'Abierto días feriados', 'feriados']);
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
    if (vm) vm.hidden = !!e.sinUbicacion;
    var mc = document.getElementById('det-mapa-cont');
    var mapas = document.getElementById('det-mapas');
    var mh = '';
    /* Maps/Waze: del campo guardado o generados desde lat/lng —
       debajo de Ver mapa siempre que haya ubicacion */
    var latLng = e.lat && e.lng ? String(e.lat) + ',' + String(e.lng) : '';
    if (!e.sinUbicacion && (e.maps || latLng)) {
        var linkMaps = e.maps || 'https://www.google.com/maps?q=' + latLng;
        mh += '<a class="mapa-btn" target="_blank" rel="noopener" href="' +
            escapeHtml(typeof urlDireccion === 'function'
                ? urlDireccion(linkMaps, 'maps') : linkMaps) +
            '"><i class="fas fa-location-dot"></i> Google Maps</a>';
    }
    if (!e.sinUbicacion && (e.waze || latLng)) {
        var linkWaze = e.waze || 'https://waze.com/ul?ll=' + latLng;
        mh += '<a class="mapa-btn waze" target="_blank" rel="noopener" href="' +
            escapeHtml(typeof urlDireccion === 'function'
                ? urlDireccion(linkWaze, 'waze') : linkWaze) +
            '"><i class="fas fa-location-dot"></i> Waze</a>';
    }
    if (e.web) {
        mh += '<a class="mapa-btn" target="_blank" rel="noopener" href="' +
            escapeHtml(e.web) +
            '"><i class="fas fa-globe"></i> Página web</a>';
    }
    if (mapas) {
        mapas.innerHTML = mh;
        mapas.hidden = !mh;
    }
    configurarMapaDetalle(e);
    var separadorMapa = document.getElementById('det-rutas-sep');
    if (separadorMapa) separadorMapa.hidden = !mh;
    /* QR y Tarjeta digital ya no van en la tarjeta: solo en el perfil
       del creador o del superusuario (Mis empresas). */
    var bq = document.getElementById('det-qr');
    if (bq) bq.hidden = true;
    var bt = document.getElementById('det-tarjeta');
    if (bt) bt.hidden = true;
    /* Acciones: reportar (izquierda) y like (derecha) */
    var propio = esCreadorNegocio(e, usuarioActual());
    var br = document.getElementById('det-reportar');
    if (br) {
        br.hidden = propio;
        br.onclick = function () { abrirReporte(e.id); };
    }
    var corazones = ['det-like', 'det-like-arriba'].map(function (id) {
        return document.getElementById(id);
    }).filter(Boolean);
    var pintarLikes = function () {
        e = (App.data.emprendimientos || []).find(function (x) { return String(x.id) === String(e.id); }) || e;
        corazones.forEach(function (bl) {
            bl.hidden = esCreadorNegocio(e, usuarioActual());
            bl.classList.toggle('on', tieneLike(e));
            bl.setAttribute('aria-pressed', String(tieneLike(e)));
            bl.setAttribute('aria-label', tieneLike(e) ? 'Retirar like' : 'Me gusta');
        });
        clearTimeout(_detLikeTimer);
        var actual = usuarioActual();
        if (actual && tieneLike(e)) {
            var restante = finPlazoLike(ultimoLike(e, actual.email)) - Date.now();
            _detLikeTimer = setTimeout(function () {
                if (App.vistaActual === 'view-emprendimiento') pintarLikes();
            }, Math.min(2147483647, Math.max(1, restante + 30)));
        }
    };
    pintarLikes();
    corazones.forEach(function (bl) {
        bl.onclick = function () { toggleLike(e.id); pintarLikes(); };
    });
    var pie = document.getElementById('det-pie-social');
    if (pie) pie.hidden = propio;
    var sepSocial = document.getElementById('det-social-sep');
    if (sepSocial) sepSocial.hidden = propio;
    /* Iconos SVG de marca, 2 por fila: reutilizable en QR y tarjeta */
    window.iconosRedesDe = function (emp) {
        var svg = {
            instagram: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" stroke="none"/></svg>',
            tiktok: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19.6 6.7a5 5 0 0 1-3.4-1.4 5 5 0 0 1-1.5-3.6H11v13.9a3.1 3.1 0 1 1-2.2-3V9a6.9 6.9 0 1 0 5.9 6.6V9.1a8.7 8.7 0 0 0 4.9 1.5z"/></svg>',
            pinterest: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.7 19.3c-.05-.82-.1-2.1.02-3l1.08-4.6s-.28-.55-.28-1.36c0-1.27.74-2.2 1.65-2.2.78 0 1.15.58 1.15 1.28 0 .78-.5 1.95-.75 3.03-.21.9.45 1.63 1.33 1.63 1.6 0 2.83-1.69 2.83-4.13 0-2.16-1.55-3.67-3.77-3.67a3.9 3.9 0 0 0-4.06 3.9c0 .77.3 1.6.67 2.05a.27.27 0 0 1 .06.26l-.25 1.03c-.04.17-.13.2-.3.12-1.11-.52-1.8-2.14-1.8-3.44 0-2.8 2.03-5.37 5.86-5.37 3.08 0 5.47 2.2 5.47 5.13 0 3.06-1.93 5.52-4.6 5.52-.9 0-1.75-.47-2.04-1.02l-.55 2.11c-.2.77-.74 1.73-1.1 2.32A10 10 0 1 0 12 2z"/></svg>',
            ytshorts: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/></svg>',
            facebook: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.6c0-.9.3-1.6 1.6-1.6h1.6V4.2c-.3 0-1.2-.2-2.2-.2-2.2 0-3.8 1.4-3.8 3.9v2.9H8v3.2h2.7v8z"/></svg>',
            telegram: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M21.9 4.6 18.8 19c-.2 1-.8 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.25.26-.46.46-.95.46l.34-4.8 8.8-7.9c.38-.34-.08-.53-.6-.2l-10.9 6.8-4.7-1.5c-1-.3-1-1 .2-1.5L20.6 3c.85-.3 1.6.2 1.3 1.6z"/></svg>',
            web: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 2.6 4.5 5.8 4.5 9.5s-1.5 6.9-4.5 9.5c-3-2.6-4.5-5.8-4.5-9.5S9 5.1 12 2.5z"/></svg>'
        };
        var campos = [['instagram', '#E4405F'], ['tiktok', '#010101'],
            ['pinterest', '#E60023'], ['ytshorts', '#FF0000'],
            ['facebook', '#1877F2'], ['telegram', '#229ED9'], ['web', '#0d6efd']];
        var shorts = (emp.ytshorts || '').match(/(?:shorts\/|youtu\.be\/)([\w-]+)/i);
        var emb = shorts ? '<div style="flex:1 1 100%;display:flex;justify-content:center"><iframe src="https://www.youtube.com/embed/' + shorts[1] + '" style="width:min(100%,210px);aspect-ratio:9/16;border:0;border-radius:14px" loading="lazy" allowfullscreen></iframe></div>' : '';
        var iconos = campos.filter(function (c) {
            return emp[c[0]] && !(c[0] === 'ytshorts' && emb);
        }).map(function (c) {
            return '<a href="' + escapeHtml(emp[c[0]]) + '" target="_blank" rel="noopener" style="flex:0 0 calc(50% - 5px);display:flex;align-items:center;justify-content:center;padding:12px;border-radius:12px;background:' + c[1] + ';color:#fff;text-decoration:none">' + svg[c[0]] + '</a>';
        }).join('');
        return emb + iconos;
    };
    var viejoRedes = document.getElementById('det-redes');
    if (viejoRedes) viejoRedes.remove();
    /* Diseño: SOLO Shorts embebido (9:16 centrado arriba); el resto son
       iconos de marca de 2 por fila. Sin embeds de otras plataformas. */
    var svgRed = {
        instagram: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" stroke="none"/></svg>',
        tiktok: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M19.6 6.7a5 5 0 0 1-3.4-1.4 5 5 0 0 1-1.5-3.6H11v13.9a3.1 3.1 0 1 1-2.2-3V9a6.9 6.9 0 1 0 5.9 6.6V9.1a8.7 8.7 0 0 0 4.9 1.5z"/></svg>',
        pinterest: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.7 19.3c-.05-.82-.1-2.1.02-3l1.08-4.6s-.28-.55-.28-1.36c0-1.27.74-2.2 1.65-2.2.78 0 1.15.58 1.15 1.28 0 .78-.5 1.95-.75 3.03-.21.9.45 1.63 1.33 1.63 1.6 0 2.83-1.69 2.83-4.13 0-2.16-1.55-3.67-3.77-3.67a3.9 3.9 0 0 0-4.06 3.9c0 .77.3 1.6.67 2.05a.27.27 0 0 1 .06.26l-.25 1.03c-.04.17-.13.2-.3.12-1.11-.52-1.8-2.14-1.8-3.44 0-2.8 2.03-5.37 5.86-5.37 3.08 0 5.47 2.2 5.47 5.13 0 3.06-1.93 5.52-4.6 5.52-.9 0-1.75-.47-2.04-1.02l-.55 2.11c-.2.77-.74 1.73-1.1 2.32A10 10 0 1 0 12 2z"/></svg>',
        ytshorts: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/></svg>',
        facebook: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.6c0-.9.3-1.6 1.6-1.6h1.6V4.2c-.3 0-1.2-.2-2.2-.2-2.2 0-3.8 1.4-3.8 3.9v2.9H8v3.2h2.7v8z"/></svg>',
        telegram: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M21.9 4.6 18.8 19c-.2 1-.8 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.25.26-.46.46-.95.46l.34-4.8 8.8-7.9c.38-.34-.08-.53-.6-.2l-10.9 6.8-4.7-1.5c-1-.3-1-1 .2-1.5L20.6 3c.85-.3 1.6.2 1.3 1.6z"/></svg>',
        web: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 2.6 4.5 5.8 4.5 9.5s-1.5 6.9-4.5 9.5c-3-2.6-4.5-5.8-4.5-9.5S9 5.1 12 2.5z"/></svg>'
    };
    var redes = [
        ['Instagram', svgRed.instagram, e.instagram, '#E4405F'],
        ['TikTok', svgRed.tiktok, e.tiktok, '#010101'],
        ['Pinterest', svgRed.pinterest, e.pinterest, '#E60023'],
        ['YouTube Shorts', svgRed.ytshorts, e.ytshorts, '#FF0000'],
        ['Facebook', svgRed.facebook, e.facebook, '#1877F2'],
        ['Telegram', svgRed.telegram, e.telegram, '#229ED9'],
        ['Sitio web', svgRed.web, e.web, '#0d6efd']
    ].filter(function (r) { return r[2]; });
    var shortsEmb = (function () {
        var m = String(e.ytshorts || '').match(/(?:shorts\/|youtu\.be\/)([\w-]+)/i);
        return m ? 'https://www.youtube.com/embed/' + m[1] : '';
    })();
    /* Solo ICONOS de 2 por fila; con video Shorts el ícono no repite */
    if (shortsEmb) redes = redes.filter(function (r) { return r[0] !== 'YouTube Shorts'; });
    if (redes.length || shortsEmb) {
        var boxRedes = document.createElement('div');
        boxRedes.id = 'det-redes';
        boxRedes.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin-top:10px';
        boxRedes.innerHTML =
            (shortsEmb ? '<div style="flex:1 1 100%;display:flex;justify-content:center"><iframe src="' + shortsEmb + '" style="width:min(100%,210px);aspect-ratio:9/16;border:0;border-radius:14px" loading="lazy" allowfullscreen></iframe></div>' : '') +
            redes.map(function (r) {
                return '<a href="' + escapeHtml(r[2]) + '" target="_blank" rel="noopener" title="' + r[0] + '" aria-label="' + r[0] + '" style="flex:0 0 calc(50% - 5px);display:flex;align-items:center;justify-content:center;padding:14px;border-radius:12px;background:' + r[3] + ';color:#fff;text-decoration:none;min-width:0">' + r[1] + '</a>';
            }).join('');
        var ancla = document.getElementById('det-stats-sep') || document.getElementById('det-stats-btn');
        if (ancla) ancla.parentNode.insertBefore(boxRedes, ancla);
    }
    /* Red social principal: botón flotante redondo con su ícono oficial */
    var viejaFab = document.getElementById('det-red-fab');
    if (viejaFab) viejaFab.remove();
    var mapaRed = { facebook: [svgRed.facebook, '#1877F2'], instagram: [svgRed.instagram, '#E4405F'],
        tiktok: [svgRed.tiktok, '#010101'], pinterest: [svgRed.pinterest, '#E60023'],
        ytshorts: [svgRed.ytshorts, '#FF0000'], telegram: [svgRed.telegram, '#229ED9'] };
    /* «Ninguna» o red borrada = sin flotante, jamás */
    if (!e.redPrincipal || !mapaRed[e.redPrincipal] || !e[e.redPrincipal]) {
        e.redPrincipal = '';
    }
    if (e.redPrincipal && e[e.redPrincipal] && mapaRed[e.redPrincipal]) {
        var fab = document.createElement('a');
        fab.id = 'det-red-fab';
        fab.href = e[e.redPrincipal]; fab.target = '_blank'; fab.rel = 'noopener';
        fab.setAttribute('style', 'position:fixed;right:16px;bottom:96px;z-index:99999;width:56px;height:56px;border-radius:50%;background:' + mapaRed[e.redPrincipal][1] + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.5rem;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.3)');
        fab.innerHTML = mapaRed[e.redPrincipal][0];
        document.body.appendChild(fab);
    }
    if (!window._fabVistaWrap && typeof irAVista === 'function') {
        window._fabVistaWrap = 1;
        var _ir0 = window.irAVista;
        window.irAVista = function (id, t) {
            var f = document.getElementById('det-red-fab');
            if (f && id !== 'view-emprendimiento') f.remove();
            return _ir0(id, t);
        };
    }
    /* Estadisticas del negocio: solo dueno o super */
    var uActual = typeof usuarioActual === 'function'
                  ? usuarioActual() : null;
    var bs = document.getElementById('det-stats-btn');
    var ds = document.getElementById('det-stats');
    var esDueno = puedeVerEstadisticasNegocio(e, uActual);
    if (ds) { ds.hidden = true; ds.innerHTML = ''; }
    var sepStats = document.getElementById('det-stats-sep');
    if (sepStats) sepStats.hidden = !esDueno;
    if (bs) {
        bs.hidden = !esDueno;
        bs.onclick = function () {
            if (!ds || !puedeVerEstadisticasNegocio(e, usuarioActual())) return;
            var vs = (e.visitas || []).map(function (v) {
                return typeof v === 'object' ? v : { ts: v, by: '' };
            });
            var ahora = Date.now(), dia = 86400000;
            var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
            var hoyC = 0, sem = 0, horas = {}, dias = {}, meses = {};
            vs.forEach(function (v) {
                var dd = new Date(v.ts);
                horas[dd.getHours()] = (horas[dd.getHours()] || 0) + 1;
                dias[dd.getDay()] = (dias[dd.getDay()] || 0) + 1;
                meses[dd.getMonth() + 1] =
                    (meses[dd.getMonth() + 1] || 0) + 1;
                if (v.ts >= hoy.getTime()) hoyC++;
                if (v.ts >= ahora - 7 * dia) sem++;
            });
            var top = function (o) {
                return Object.keys(o).sort(function (a, b) {
                    return o[b] - o[a]; })[0];
            };
            var dN = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
            var mN = ['','Ene','Feb','Mar','Abr','May','Jun','Jul',
                      'Ago','Sep','Oct','Nov','Dic'];
            var reps = (App.data.reportes || []).filter(function (r) {
                return String(r.empId) === String(e.id);
            });
            var f = function (ic, val, tit, ayu) {
                return '<div class="stat-tile">' +
                    '<i class="fas ' + ic + '"></i><b>' + val + '</b>' +
                    '<span class="stat-t">' + tit + '</span>' +
                    '<small class="stat-a">' + ayu + '</small></div>';
            };
            ds.innerHTML = '<div class="stat-grid">' +
                f('fa-eye', vs.length, 'Visitas',
                  'Veces que vieron tu negocio') +
                f('fa-calendar-day', hoyC, 'Hoy', 'Visitas de hoy') +
                f('fa-calendar-week', sem, '7 días', 'Última semana') +
                f('fa-heart', totalLikes(e), 'Likes',
                  'Personas que lo amaron') +
                f('fa-clock', (top(horas) || '—') + 'h', 'Hora pico',
                  'Cuándo te buscan más') +
                f('fa-calendar-week', top(dias) ? dN[top(dias)] : '—',
                  'Día pico', 'Tu mejor día') +
                f('fa-calendar', top(meses) ? mN[top(meses)] : '—',
                  'Mes pico', 'Tu mejor mes') +
                f('fa-flag', reps.length, 'Reportes',
                  reps.length ? 'Revisá las causas' : 'Todo limpio') +
                '</div>' +
                reps.slice().reverse().map(function (r) {
                    return '<div class="dic-item"><i class="fas fa-flag">' +
                        '</i> <b>' + escapeHtml(r.motivo || '') +
                        '</b> <span class="est-estado ' +
                        (r.estado === 'resuelto' ? 'res' : 'pend') +
                        '">' + (r.estado === 'resuelto'
                                ? 'Resuelto' : 'Pendiente') +
                        '</span><br><small>' +
                        escapeHtml(r.usuario || '') + ' · ' +
                        new Date(r.ts).toLocaleString('es-CR') +
                        (r.texto ? ' · ' + escapeHtml(r.texto) : '') +
                        '</small></div>';
                }).join('');
            ds.hidden = !ds.hidden;
        };
    }
    if (typeof prepararPromocionDetalle === 'function') prepararPromocionDetalle(e);
    var be = document.getElementById('det-editar');
    if (be) {
        /* Editar solo si hay usuario registrado */
        be.hidden = !(typeof puedeVerEstadisticasNegocio === 'function' &&
                      puedeVerEstadisticasNegocio(e, usuarioActual()));
        be.onclick = function () {
            if (!puedeVerEstadisticasNegocio(e, usuarioActual())) return;
            if (typeof abrirEdicion === 'function') abrirEdicion(e); };
    }
    irAVista('view-emprendimiento', e.nombre);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    requestAnimationFrame(function () {
        if (App.vistaActual === 'view-emprendimiento') window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
}

