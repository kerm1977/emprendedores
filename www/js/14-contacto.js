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
    if (e.maps && !e.sinUbicacion) {
        mh += '<a class="mapa-btn" target="_blank" rel="noopener" href="' +
            escapeHtml(typeof urlDireccion === 'function'
                ? urlDireccion(e.maps, 'maps') : e.maps) +
            '"><i class="fas fa-location-dot"></i> Google Maps</a>';
    }
    if (e.waze && !e.sinUbicacion) {
        mh += '<a class="mapa-btn waze" target="_blank" rel="noopener" href="' +
            escapeHtml(typeof urlDireccion === 'function'
                ? urlDireccion(e.waze, 'waze') : e.waze) +
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
    var bq = document.getElementById('det-qr');
    if (bq) bq.onclick = function () { mostrarQR(e.id); };
    var bt = document.getElementById('det-tarjeta');
    if (bt) bt.onclick = function () { descargarTarjeta(e.id); };
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
        be.hidden = !(typeof usuarioActual === 'function' && usuarioActual());
        be.onclick = function () {
            if (typeof abrirEdicion === 'function') abrirEdicion(e); };
    }
    irAVista('view-emprendimiento', e.nombre);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    requestAnimationFrame(function () {
        if (App.vistaActual === 'view-emprendimiento') window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
}

