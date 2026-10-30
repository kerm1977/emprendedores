/* BLINDADO: acciones de reportes, no tocar sin orden */
/* 34-est-acciones.js - Ciclo de vida de reportes + enlaces */

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
    if (borre) saveDataAhora();
}

/* Resolver con doble confirmacion: el caso se archiva */
function resolverReporte(idx) {
    var r = (App.data.reportes || [])[idx];
    if (!r) return;
    if (r.estado !== 'resuelto') {
        if (!confirm('Al marcar como resuelto, el caso se archivará. ' +
                     '¿Continuar?')) return;
        if (!confirm('¿Estás seguro en proceder? Al archivarse se ' +
                     'eliminará el reporte pendiente y no le aparecerá ' +
                     'más a la persona reportada.')) return;
    }
    r.estado = r.estado === 'resuelto' ? 'pendiente' : 'resuelto';
    r.resueltoEn = r.estado === 'resuelto' ? Date.now() : undefined;
    saveDataAhora();
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
