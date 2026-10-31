/* 59-reportes-perfil.js - "Reportes de mi perfil": métricas que los
   negocios del usuario han recibido (likes, visitas, denuncias) y
   personas que lo bloquearon. Para todos los usuarios con sesion. */

function prepararReportesPerfil() {
    var u = usuarioActual();
    if (!u || document.getElementById('btn-reportes-perfil')) return;
    var salir = document.getElementById('btn-info-dev') ||
                document.getElementById('btn-salir-perfil');
    if (!salir) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btn-reportes-perfil';
    btn.className = 'perfil-btn-ajustes';
    btn.innerHTML = '<i class="fas fa-chart-line"></i> Reportes de mi perfil';
    salir.parentNode.insertBefore(btn, salir);
    btn.onclick = abrirReportesPerfil;
}

function abrirReportesPerfil() {
    var u = usuarioActual();
    if (!u) return;
    var miEmail = (u.email || '').trim().toLowerCase();
    var mias = (App.data.emprendimientos || []).filter(function (e) {
        return (e.owner || '').trim().toLowerCase() === miEmail;
    });
    /* Bloqueos: por correo de usuario — quién me tiene en su lista */
    var bloqueos = 0;
    Object.keys(App.data.bloqueados || {}).forEach(function (k) {
        bloqueos += (App.data.bloqueados[k] || []).filter(function (b) {
            return (b.email || '').trim().toLowerCase() === miEmail;
        }).length;
    });
    var totalLikes = 0, totalVisitas = 0, totalReportes = 0;
    var filas = mias.map(function (e) {
        var likes = (e.likes || []).filter(function (l) { return !l.retiradoEn; }).length;
        var visitas = (e.visitas || []).length;
        var reps = (App.data.reportes || []).filter(function (r) {
            return String(r.empId) === String(e.id);
        }).length;
        totalLikes += likes; totalVisitas += visitas; totalReportes += reps;
        return '<div style="background:var(--surface-2,#f8fafc);border-radius:14px;padding:14px;margin-bottom:10px;text-align:left">' +
            '<b style="font-size:.9rem">' + escapeHtml(e.nombre || 'Negocio') + '</b>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;font-size:.8rem;color:var(--text-soft,#64748b)">' +
            '<span><i class="fas fa-heart" style="color:#dc2626"></i> ' + likes + ' likes</span>' +
            '<span><i class="fas fa-eye" style="color:#1967d2"></i> ' + visitas + ' clics en la tarjeta</span>' +
            '<span><i class="fas fa-flag" style="color:#d97706"></i> ' + reps + ' denuncias</span></div></div>';
    }).join('');
    var viejo = document.getElementById('modal-reportes-perfil');
    if (viejo) viejo.remove();
    var ov = document.createElement('div');
    ov.id = 'modal-reportes-perfil';
    ov.setAttribute('style', 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px');
    ov.innerHTML = '<div style="background:var(--surface,#fff);border-radius:18px;padding:22px;max-width:400px;width:100%;max-height:85vh;overflow-y:auto">' +
        '<h3 style="margin:0 0 14px;text-align:center"><i class="fas fa-chart-line" style="color:var(--primary-color,#eb760b)"></i> Reportes de mi perfil</h3>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">' +
        '<div style="background:var(--surface-2,#f8fafc);border-radius:12px;padding:10px;text-align:center"><b style="font-size:1.1rem">' + totalLikes + '</b><div style="font-size:.7rem;color:var(--text-soft,#64748b)">Likes recibidos</div></div>' +
        '<div style="background:var(--surface-2,#f8fafc);border-radius:12px;padding:10px;text-align:center"><b style="font-size:1.1rem">' + totalVisitas + '</b><div style="font-size:.7rem;color:var(--text-soft,#64748b)">Clics a tu tarjeta</div></div>' +
        '<div style="background:var(--surface-2,#f8fafc);border-radius:12px;padding:10px;text-align:center"><b style="font-size:1.1rem">' + totalReportes + '</b><div style="font-size:.7rem;color:var(--text-soft,#64748b)">Denuncias</div></div>' +
        '<div style="background:var(--surface-2,#f8fafc);border-radius:12px;padding:10px;text-align:center"><b style="font-size:1.1rem">' + bloqueos + '</b><div style="font-size:.7rem;color:var(--text-soft,#64748b)">Te han bloqueado</div></div></div>' +
        (filas || '<p style="text-align:center;color:var(--text-soft,#64748b);font-size:.85rem">Todavía no tenés negocios publicados.</p>') +
        '<button class="perfil-btn-ajustes" style="width:100%;margin-top:10px"><i class="fas fa-xmark"></i> Cerrar</button></div>';
    document.body.appendChild(ov);
    ov.onclick = function (e2) {
        if (e2.target === ov || e2.target.closest('button')) ov.remove();
    };
}
