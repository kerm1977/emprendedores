/* BLINDADO: sistema de estadisticas del super, no tocar sin orden */
/* 32-estadisticas.js - Estadisticas globales del sitio (superusuario).
   Actividad, transito, reportes, likes, paginacion x20, txt por
   mes/ano y graficos de pastel sin librerias externas. */

var EST_PAG = 20;

function logActividad(tipo, texto) {
    App.data.actividad = App.data.actividad || [];
    App.data.actividad.push({ tipo: tipo, texto: texto,
                              ts: Date.now() });
}

/* Paginacion reutilizable: dibuja una lista de 20 con botones */
function estPaginar(boxId, items, htmlItem, estado) {
    var box = document.getElementById(boxId);
    if (!box) return;
    estado[boxId] = estado[boxId] || 0;
    var ini = estado[boxId] * EST_PAG;
    var pag = items.slice(ini, ini + EST_PAG);
    var totalP = Math.max(1, Math.ceil(items.length / EST_PAG));
    box.innerHTML = pag.length
        ? pag.map(htmlItem).join('')
        : '<p class="rep-sub">Sin datos todavía</p>';
    if (totalP > 1) {
        box.innerHTML += '<div class="est-pag">' +
            '<button data-pg="-1"' + (estado[boxId] === 0 ? ' disabled' : '') + '>‹</button>' +
            '<span>' + (estado[boxId] + 1) + '/' + totalP + '</span>' +
            '<button data-pg="1"' + (estado[boxId] >= totalP - 1 ? ' disabled' : '') + '>›</button></div>';
        box.querySelectorAll('.est-pag button').forEach(function (b) {
            b.onclick = function () {
                estado[boxId] += +b.dataset.pg;
                renderEstadisticas();
            };
        });
    }
}

var _estPaginas = {};

function renderEstadisticas() {
    var d = App.data;
    var emps = d.emprendimientos || [];
    var ahora = Date.now(), dia = 86400000;

    /* === Transito global (visitas de todos los emprendimientos) === */
    var horas = {}, dias = {}, meses = {}, unicos = {};
    var totalV = 0, hoyC = 0, semana = 0;
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    emps.forEach(function (e) {
        (e.visitas || []).forEach(function (v) {
            var t = typeof v === 'object' ? v.ts : v;
            var by = typeof v === 'object' ? v.by : '';
            var dd = new Date(t);
            horas[dd.getHours()] = (horas[dd.getHours()] || 0) + 1;
            dias[dd.getDay()] = (dias[dd.getDay()] || 0) + 1;
            var m = dd.getMonth() + 1;
            meses[m] = (meses[m] || 0) + 1;
            if (by) unicos[by] = 1;
            totalV++;
            if (t >= hoy.getTime()) hoyC++;
            if (t >= ahora - 7 * dia) semana++;
        });
    });
    var top = function (o) {
        return Object.keys(o).sort(function (a, b) {
            return o[b] - o[a]; })[0];
    };
    var diasN = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var mesesN = ['','Ene','Feb','Mar','Abr','May','Jun','Jul',
                  'Ago','Sep','Oct','Nov','Dic'];

    /* === Resumen === */
    var res = document.getElementById('est-resumen');
    if (res) {
        var likes = 0;
        emps.forEach(function (e) { likes += totalLikes(e); });
        var f = function (ic, val, t) {
            return '<div class="stat-tile"><i class="fas ' + ic + '"></i>' +
                '<b>' + val + '</b><span class="stat-t">' + t +
                '</span></div>';
        };
        res.innerHTML = '<div class="stat-grid">' +
            f('fa-eye', totalV, 'Visitas totales') +
            f('fa-calendar-day', hoyC, 'Hoy') +
            f('fa-calendar-week', semana, 'Últimos 7 días') +
            f('fa-user-check', Object.keys(unicos).length, 'Únicos') +
            f('fa-heart', likes, 'Likes') +
            f('fa-flag', (d.reportes || []).length, 'Reportes') +
            f('fa-clock', (top(horas) || '—') + 'h', 'Hora pico') +
            f('fa-calendar-week', top(dias) ? diasN[top(dias)] : '—', 'Día pico') +
            f('fa-calendar', top(meses) ? mesesN[top(meses)] : '—', 'Mes pico') +
            '</div>';
    }

    if (typeof renderAlertas === 'function') renderAlertas(emps);

    /* === Reportes agrupados por mes/ano, acordeon por mes === */
    var mesesN2 = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre',
                   'Diciembre'];
    var repPorMes = {};
    (d.reportes || []).forEach(function (r) {
        var dd = new Date(r.ts);
        var k = dd.getFullYear() + '-' +
            String(dd.getMonth() + 1).padStart(2, '0');
        (repPorMes[k] = repPorMes[k] || { mes: dd.getMonth(),
                                         ano: dd.getFullYear(),
                                         items: [] }).items.push(r);
    });
    limpiarReportesViejos();
    var boxRep = document.getElementById('est-reportes');
    if (boxRep) {
        var claves = Object.keys(repPorMes).sort().reverse();
        boxRep.innerHTML = claves.length ? claves.map(function (k) {
            var g = repPorMes[k];
            var idC = 'est-rep-' + k;
            return '<button class="est-acc-btn est-mes" type="button" ' +
                'data-mes="' + idC + '">' +
                '<i class="fas fa-calendar"></i> ' +
                mesesN2[g.mes] + ' ' + g.ano +
                ' <span class="est-mes-n">(' + g.items.length +
                ' reporte' + (g.items.length === 1 ? '' : 's') +
                ')</span>' +
                '<i class="fas fa-chevron-down acc-flecha"></i>' +
                '</button>' +
                '<div class="est-acc-cont" id="' + idC + '" hidden>' +
                g.items.slice().reverse().map(function (r) {
                    var dd = new Date(r.ts);
                    var idx = (d.reportes || []).indexOf(r);
                    var u2 = typeof usuarioActual === 'function'
                             ? usuarioActual() : null;
                    return '<div class="dic-item">' +
                        '<a href="#" class="est-emp-link" ' +
                        'data-emp="' + r.empId + '">' +
                        '<b>' + escapeHtml(r.emprendimiento || '') +
                        '</b></a>' +
                        ' <span class="est-estado ' +
                        (r.estado === 'resuelto' ? 'res' : 'pend') +
                        '">' + (r.estado === 'resuelto'
                                ? 'Resuelto' : 'Pendiente') + '</span>' +
                        '<br><small>' +
                        'Motivo: <b>' + escapeHtml(r.motivo || '') +
                        '</b> · Reportó: ' + escapeHtml(r.usuario || '') +
                        '<br>' + dd.toLocaleDateString('es-CR') +
                        ' ' + dd.toLocaleTimeString('es-CR') +
                        (r.texto ? '<br>Causa: ' +
                         escapeHtml(r.texto) : '') +
                        (r.estado === 'resuelto' && r.resueltoEn
                         ? '<br><b>Resuelto:</b> ' +
                           new Date(r.resueltoEn)
                               .toLocaleString('es-CR')
                         : '') +
                        '</small>' +
                        (u2 && u2.rol === 'super'
                         ? '<br><button class="rep-motivo" ' +
                           'onclick="resolverReporte(' + idx + ')">' +
                           (r.estado === 'resuelto'
                            ? 'Reabrir' : 'Marcar resuelto') +
                           '</button>' : '') +
                        '</div>';
                }).join('') + '</div>';
        }).join('') : '<p class="rep-sub">Sin reportes todavía</p>';
    }

    /* === Likes (paginado): quien dio like y a qué negocio === */
    var likesArr = [];
    emps.forEach(function (e) {
        likesContables(e).forEach(function (v) {
            var em = typeof v === 'object' ? v.email || v.by : v;
            likesArr.push({ usuario: em, negocio: e.nombre });
        });
    });
    estPaginar('est-likes', likesArr.slice().reverse(), function (l) {
        return '<div class="dic-item"><i class="fas fa-heart"></i> ' +
            '<b>' + escapeHtml(l.usuario || 'Anónimo') + '</b>' +
            ' → ' + escapeHtml(l.negocio || '') + '</div>';
    }, _estPaginas);

    /* === Actividad global (paginado) === */
    estPaginar('est-actividad', (d.actividad || []).slice().reverse(),
        function (a) {
            var dd = new Date(a.ts);
            var ic = { reporte: 'fa-flag', prohibida: 'fa-ban',
                eliminar: 'fa-trash', like: 'fa-heart',
                usuario: 'fa-user-plus', emp: 'fa-store',
                foto: 'fa-image' }[a.tipo] || 'fa-bolt';
            return '<div class="dic-item"><i class="fas ' + ic + '"></i> ' +
                escapeHtml(a.texto || '') + '<br><small>' +
                dd.toLocaleString('es-CR') + '</small></div>';
        }, _estPaginas);

    /* === Graficos de pastel (acordeon) === */
    if (document.getElementById('est-graf-cont') &&
        !document.getElementById('est-graf-cont').hidden) {
        pintarGraficos(d, emps, dias, horas, meses, unicos);
    }
}

/* Acordeon: tocar uno abre y cierra el que estaba abierto */
document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.est-acc-btn');
    if (!btn) return;
    var cont = document.getElementById(btn.dataset.acc);
    if (!cont) return;
    var abriendo = cont.hidden;
    /* cerrar todos */
    document.querySelectorAll('.est-acc-cont').forEach(function (c) {
        c.hidden = true;
    });
    document.querySelectorAll('.est-acc-btn').forEach(function (b) {
        b.classList.remove('abierto');
    });
    if (abriendo) {
        cont.hidden = false;
        btn.classList.add('abierto');
        if (btn.dataset.acc === 'est-graf-cont') renderEstadisticas();
    }
});

function toggleGraficos() {
    var c = document.getElementById('est-graf-cont');
    if (!c) return;
    c.hidden = !c.hidden;
    if (!c.hidden) renderEstadisticas();
}
