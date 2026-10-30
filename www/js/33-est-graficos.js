/* BLINDADO: graficos de estadisticas, no tocar sin orden */
/* 33-est-graficos.js - Graficos de pastel (canvas, sin librerias) */

/* Graficos tipo pastel dibujados a mano en canvas (sin librerias) */
function pastel(id, datos) {
    var cv = document.getElementById(id);
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W = cv.width = 300, H = cv.height = 250;
    ctx.clearRect(0, 0, W, H);
    var total = datos.reduce(function (t, x) { return t + x[1]; }, 0) || 1;
    var cols = ['#f97316', '#2563eb', '#16a34a', '#dc2626', '#7c3aed',
                '#0891b2', '#ca8a04', '#e11d48'];
    var ang = -Math.PI / 2, cx = 85, cy = 125, r = 80;
    datos.forEach(function (d, i) {
        var fin = ang + (d[1] / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, ang, fin);
        ctx.fillStyle = cols[i % cols.length];
        ctx.fill();
        ang = fin;
    });
    /* hueco de dona */
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(cv)
        .getPropertyValue('--surface') || '#fff';
    ctx.fill();
    ctx.fillStyle = getComputedStyle(cv)
        .getPropertyValue('--text-dark') || '#111';
    ctx.font = '700 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy + 5);
    /* leyenda con % */
    datos.forEach(function (d, i) {
        var pct = Math.round(d[1] / total * 100);
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(185, 60 + i * 20, 10, 10);
        ctx.fillStyle = '#888';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(d[0] + ' · ' + pct + '%', 200, 68 + i * 20);
    });
}

function pintarGraficos(d, emps, dias, horas, meses, unicos) {
    var porCat = {};
    emps.forEach(function (e) {
        (e.visitas || []).forEach(function () {
            porCat[e.categoria || 'Otros'] = (porCat[e.categoria || 'Otros'] || 0) + 1;
        });
    });
    var catArr = Object.keys(porCat).map(function (k) {
        return [k.slice(0, 12), porCat[k]]; }).slice(0, 8);
    var repMot = {};
    (d.reportes || []).forEach(function (r) {
        repMot[r.motivo || 'Otro'] = (repMot[r.motivo || 'Otro'] || 0) + 1;
    });
    var diasN = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    pastel('pie-cat', catArr.length ? catArr : [['Sin datos', 1]]);
    pastel('pie-dias', Object.keys(dias).map(function (k) {
        return [diasN[k], dias[k]]; }));
    pastel('pie-rep', Object.keys(repMot).map(function (k) {
        return [k.slice(0, 14), repMot[k]]; }));
}


/* Analytics profesional: KPIs + barras de 14 dias + semanas fuertes */
function anaStats(vs) {
    var ahora = Date.now(), dia = 86400000;
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    var r = { total: vs.length, hoyC: 0, sem: 0, horas: {},
              dias: {}, meses: {}, porDia: [], semanas: {} };
    for (var i = 13; i >= 0; i--) {
        var dd = new Date(hoy.getTime() - i * dia);
        r.porDia.push({ d: dd.getDate() + '/' + (dd.getMonth() + 1),
                        n: 0 });
    }
    vs.forEach(function (v) {
        var t = typeof v === 'object' ? v.ts : v;
        var dd = new Date(t);
        r.horas[dd.getHours()] = (r.horas[dd.getHours()] || 0) + 1;
        r.dias[dd.getDay()] = (r.dias[dd.getDay()] || 0) + 1;
        var m = dd.getMonth() + 1;
        r.meses[m] = (r.meses[m] || 0) + 1;
        if (t >= hoy.getTime()) r.hoyC++;
        if (t >= ahora - 7 * dia) r.sem++;
        var dSem = Math.floor((hoy.getTime() - t) / (7 * dia));
        if (dSem >= 0 && dSem < 4) {
            var k = 'S' + (dSem + 1);
            r.semanas[k] = r.semanas[k] || { total: 0, dias: {} };
            r.semanas[k].total++;
            r.semanas[k].dias[dd.getDay()] =
                (r.semanas[k].dias[dd.getDay()] || 0) + 1;
        }
        var diff = Math.floor((hoy.getTime() - t) / dia);
        if (diff >= 0 && diff < 14) r.porDia[13 - diff].n++;
    });
    return r;
}

function anaBarras(id, datos) {
    var cv = document.getElementById(id);
    if (!cv) return;
    var ctx = cv.getContext('2d');
    cv.width = 300; cv.height = 110;
    ctx.clearRect(0, 0, 300, 110);
    var max = Math.max.apply(null, datos.map(function (d) {
        return d.n; }).concat([1]));
    var bw = 300 / datos.length;
    datos.forEach(function (d, i) {
        var h = (d.n / max) * 80;
        ctx.fillStyle = d.n === max && max > 0 ? '#f97316' : '#fdba74';
        ctx.beginPath();
        ctx.roundRect(i * bw + 2, 90 - h, bw - 4, h, 3);
        ctx.fill();
        if (i % 3 === 0) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '8px sans-serif';
            ctx.fillText(d.d, i * bw + 2, 104);
        }
        if (d.n > 0) {
            ctx.fillStyle = '#ea580c';
            ctx.font = '700 8px sans-serif';
            ctx.fillText(d.n, i * bw + 3, 88 - h);
        }
    });
}

/* Alertas: empresas con <10 visitas este mes (previa a tareas) */
function renderAlertas(emps) {
var boxAl = document.getElementById('est-alertas');
if (!boxAl) return;
{
    var inicioMes = new Date();
    inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
    var bajas = emps.map(function (e) {
        var n = (e.visitas || []).filter(function (v) {
            var t = typeof v === 'object' ? v.ts : v;
            return t >= inicioMes.getTime();
        }).length;
        return { e: e, n: n };
    }).filter(function (x) { return x.n < 10; })
      .sort(function (a, b) { return a.n - b.n; });
    boxAl.innerHTML = bajas.length
        ? '<p class="rep-sub"><i class="fas fa-triangle-' +
          'exclamation"></i> ' + bajas.length +
          ' empresa(s) con menos de 10 visitas este mes — ' +
          'pendientes de asignar tarea:</p>' +
          bajas.map(function (x) {
              return '<div class="dic-item">' +
                  '<i class="fas fa-store"></i> <b>' +
                  escapeHtml(x.e.nombre || '') + '</b><br><small>' +
                  'Solo <b>' + x.n + '</b> visita' +
                  (x.n === 1 ? '' : 's') + ' este mes · ' +
                  escapeHtml(x.e.categoria || '') + ' · ' +
                  (x.e.owner || x.e.email || 'sin dueño') +
                  '</small></div>';
          }).join('')
        : '<p class="rep-sub"><i class="fas fa-check-circle"></i> ' +
          'Todas las empresas tienen tráfico saludable (10+ ' +
          'visitas este mes)</p>';
}

}

/* Descargar estadisticas en .txt separado por mes y ano */
function descargarEstadisticas() {
    var d = App.data;
    var txt = 'EMPRENDEDORES - ESTADISTICAS\n' +
        'Generado: ' + new Date().toLocaleString('es-CR') + '\n\n';
    var porMes = {};
    (d.actividad || []).forEach(function (a) {
        var dd = new Date(a.ts);
        var k = dd.getFullYear() + '-' +
            String(dd.getMonth() + 1).padStart(2, '0');
        (porMes[k] = porMes[k] || []).push(
            dd.toLocaleDateString('es-CR') + ' ' +
            dd.toLocaleTimeString('es-CR') + '  [' + a.tipo + '] ' +
            a.texto);
    });
    Object.keys(porMes).sort().forEach(function (k) {
        txt += '=== ' + k + ' ===\n' + porMes[k].join('\n') + '\n\n';
    });
    var blob = new Blob([txt], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'estadisticas-emprendedores.txt';
    a.click();
}

/* Reportes: pendiente -> resuelto -> desaparece al mes */
function limpiarReportesViejos() {
    var mes = 30 * 86400000, ahora = Date.now(), borre = false;
    App.data.reportes = (App.data.reportes || []).filter(function (r) {
        var base = r.estado === 'resuelto'
            ? (r.resueltoEn || r.ts) : r.ts;
        var vivo = ahora - base < mes;
        if (!vivo) borre = true;
        return vivo;
    });
    if (borre) saveData();
}

function resolverReporte(idx) {
    var r = (App.data.reportes || [])[idx];
    if (!r) return;
    if (r.estado !== 'resuelto') {
        /* Doble confirmacion: archivar el caso */
        if (!confirm('Al marcar como resuelto, el caso se archivará. ' +
                     '¿Continuar?')) return;
        if (!confirm('¿Estás seguro en proceder? Al archivarse se ' +
                     'eliminará el reporte pendiente y no le aparecerá ' +
                     'más a la persona reportada.')) return;
    }
    r.estado = r.estado === 'resuelto' ? 'pendiente' : 'resuelto';
    r.resueltoEn = r.estado === 'resuelto' ? Date.now() : undefined;
    saveData();
    if (typeof renderEstadisticas === 'function') renderEstadisticas();
}

/* Meses de reportes: toggle independiente (no cierra el padre) */
document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-mes]');
    if (!btn) return;
    var cont = document.getElementById(btn.dataset.mes);
    if (!cont) return;
    btn.parentNode.querySelectorAll('.est-acc-cont')
       .forEach(function (c) { if (c !== cont) c.hidden = true; });
    btn.parentNode.querySelectorAll('[data-mes]').forEach(function (b) {
        if (b !== btn) b.classList.remove('abierto');
    });
    cont.hidden = !cont.hidden;
    btn.classList.toggle('abierto', !cont.hidden);
});

/* Enlace a empresa reportada: abre su perfil completo */
document.addEventListener('click', function (ev) {
    var link = ev.target.closest('.est-emp-link');
    if (!link) return;
    ev.preventDefault();
    if (typeof verEmprendimiento === 'function') {
        verEmprendimiento(link.dataset.emp);
    }
});
