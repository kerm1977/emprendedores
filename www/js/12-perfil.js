/* BLINDADO (orden del usuario): prohibido modificar/eliminar
   sin orden explicita. Pedir permiso antes de tocar. */
/* 12-perfil.js - Vista Perfil del usuario + modal de cierre de sesion.
   El avatar redondo del topbar abre la vista; el item de la barra
   cambia a "Salir" cuando hay sesion activa. */

function setTexto(id, t) {
    var el = document.getElementById(id);
    if (el) el.textContent = t;
}

function renderPerfil() {
    try {
    var u = typeof usuarioActual === 'function' ? usuarioActual() : null;
    if (!u) return;
    setTexto('perfil-nombre', ((u.nombre || '') + ' ' + (u.apellido || '')).trim() || 'Usuario');
    /* Estadisticas completas de cada emprendimiento del dueno */
    var misEmps = (App.data.emprendimientos || []).filter(function (e) {
        return esCreadorNegocio(e, u);
    });
    var st = document.getElementById('perfil-stats');
    if (st) {
        var ahora = Date.now(), dia = 86400000;
        var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        
        st.innerHTML = misEmps.map(function (e) {
            var vs = (e.visitas || []).map(function (v) {
                return typeof v === 'object' ? v : { ts: v, by: '' };
            });
            var horas = {}, meses = {}, dias = {}, unicos = {};
            var hoyC = 0, semana = 0, mes = 0, semanaAnt = 0;
            vs.forEach(function (v) {
                var d = new Date(v.ts);
                horas[d.getHours()] = (horas[d.getHours()] || 0) + 1;
                var m = d.getMonth() + 1;
                meses[m] = (meses[m] || 0) + 1;
                dias[d.getDay()] = (dias[d.getDay()] || 0) + 1;
                if (v.by) unicos[v.by] = 1;
                if (v.ts >= hoy.getTime()) hoyC++;
                if (v.ts >= ahora - 7 * dia) semana++;
                else if (v.ts >= ahora - 14 * dia) semanaAnt++;
                if (v.ts >= ahora - 30 * dia) mes++;
            });
            var top = function (o) {
                return Object.keys(o).sort(function (a, b) {
                    return o[b] - o[a]; })[0];
            };
            var diasN = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
            var mesesN = ['','Ene','Feb','Mar','Abr','May','Jun','Jul',
                          'Ago','Sep','Oct','Nov','Dic'];
            var tend = semanaAnt > 0
                ? Math.round((semana - semanaAnt) / semanaAnt * 100)
                : (semana > 0 ? 100 : 0);
            var rep = (App.data.reportes || []).filter(function (r) {
                return String(r.empId) === String(e.id);
            }).length;
            var buscadas = (App.data.catsBuscadas || {})[e.categoria] || 0;
            var f = function (ic, val, titulo, ayuda) {
                return '<div class="stat-tile">' +
                    '<i class="fas ' + ic + '"></i>' +
                    '<b>' + val + '</b>' +
                    '<span class="stat-t">' + titulo + '</span>' +
                    '<small class="stat-a">' + ayuda + '</small></div>';
            };
            return '<div class="stat-card">' +
                '<b class="stat-emp">' + escapeHtml(e.nombre) + '</b>' +
                '<div class="stat-grid">' +
                f('fa-eye', vs.length, 'Visitas totales',
                  'Veces que abrieron tu negocio'),
                f('fa-calendar-day', hoyC + ' hoy', 'Hoy / semana',
                  semana + ' en 7 días — tu ritmo actual'),
                f('fa-user-check', Object.keys(unicos).length,
                  'Visitantes únicos',
                  'Personas distintas que te vieron'),
                f('fa-heart', totalLikes(e), 'Likes',
                  'A cuánta gente le gustó tu negocio'),
                f('fa-clock', (top(horas) || '—') + 'h', 'Hora pico',
                  'A qué hora te buscan más'),
                f('fa-calendar-week',
                    top(dias) ? diasN[top(dias)] : '—', 'Día pico',
                  'El día más fuerte de la semana'),
                f('fa-calendar', top(meses) ? mesesN[top(meses)] : '—',
                  'Mes pico', 'Tu mejor mes del año'),
                f('fa-arrow-trend-up',
                    (tend >= 0 ? '+' : '') + tend + '%', 'Tendencia 7d',
                  tend >= 0 ? 'Vas creciendo' : 'Bajó vs la semana pasada'),
                f('fa-magnifying-glass', buscadas,
                  'Buscadas en tu rubro',
                  'Demanda de tu categoría'),
                f('fa-flag', rep, 'Reportes',
                  rep ? 'Revisá tu publicación' : 'Todo limpio') +
                '</div></div>';
        }).join('');
        st.hidden = !misEmps.length;
    }
    var av = document.querySelector('#view-perfil .perfil-avatar');
    if (av) {
        var foto = urlLogoNegocio(u.foto);
        av.innerHTML = foto
            ? '<img data-logo-negocio src="' + escapeHtml(foto) + '" alt="perfil"><i class="fas fa-user" hidden></i>'
            : '<i class="fas fa-user"></i>';
    }
    setTexto('perfil-rol', u.rol === 'super' ? 'Superusuario' : 'Emprendedor');
    setTexto('perfil-email', u.email || '—');
    /* Telefono: el del usuario o el del emprendimiento que registro */
    var emp = (App.data.emprendimientos || []).find(function (e) {
        return e.owner === u.email ||
               (e.email && e.email.toLowerCase() ===
                (u.email || '').toLowerCase());
    });
    setTexto('perfil-telefono',
             u.telefono || (emp && emp.telefono) || 'Sin teléfono');
    setTexto('perfil-cedula', u.cedula || '');
    /* Likes: solo el dueno ve el conteo de sus emprendimientos */
    var misLikes = (App.data.emprendimientos || [])
        .filter(function (e) {
            return esCreadorNegocio(e, u);
        })
        .reduce(function (t, e) {
            return t + (totalLikes(e));
        }, 0);
    setTexto('perfil-rol',
        (u.rol === 'super' ? 'Superusuario' : 'Usuario') +
        (misLikes ? ' · ❤ ' + misLikes + ' likes' : ''));
    if (typeof prepararPerfilPromociones === 'function') prepararPerfilPromociones();
    } catch (err) {
        /* Si algo falla con un usuario de Google/huella, el
           perfil igual pinta nombre y rol */
        var u2 = usuarioActual();
        setTexto('perfil-nombre',
            u2 ? ((u2.nombre || '') + ' ' +
                  (u2.apellido || '')).trim() || 'Usuario' : 'Usuario');
        setTexto('perfil-rol',
            u2 && u2.rol === 'super' ? 'Superusuario' : 'Usuario');
        var st2 = document.getElementById('perfil-stats');
        if (st2) st2.hidden = true;
    }
}

function abrirModalSalir() {
    var m = document.getElementById('modal-salir');
    if (m) m.hidden = false;
}

function cerrarModalSalir() {
    var m = document.getElementById('modal-salir');
    if (m) m.hidden = true;
}

/* Perfil ↔ Salir en la barra segun el estado de sesion */
function actualizarNavSesion() {
    var item = document.querySelector('.magic-item[data-perfil]');
    var avatar = document.getElementById('perfil-top');
    var u = typeof usuarioActual === 'function' ? usuarioActual() : null;
    var logueado = !!u;
    var btnAjustes = document.getElementById('btn-ajustes-perfil');
    if (btnAjustes) btnAjustes.hidden = !(u && u.rol === 'super');
    var btnDash = document.getElementById('btn-dashboard');
    if (btnDash) btnDash.hidden = !(u && u.rol === 'super');
    if (item) {
        var icono = item.querySelector('.magic-icon i');
        var texto = item.querySelector('.magic-text');
        item.classList.toggle('es-salir', logueado);
        if (icono) icono.className = 'fas ' + (logueado ? 'fa-right-from-bracket' : 'fa-user');
        if (texto) texto.textContent = logueado ? 'Salir' : 'Perfil';
    }
    if (avatar) avatar.hidden = !logueado;
    if (logueado) renderPerfil();
}

async function initPerfil() {
    var vista, modal;
    try {
        var res = await fetch('parciales/perfil.html');
        var resA = await fetch('parciales/ajustes.html');
        if (resA.ok) {
            var ta = document.createElement('div');
            ta.innerHTML = await resA.text();
            var va = ta.querySelector('#view-ajustes');
            var ma = document.querySelector('.app-main');
            if (va && ma) ma.appendChild(va);
        }
        var tmp = document.createElement('div');
        tmp.innerHTML = await res.text();
        vista = tmp.querySelector('#view-perfil');
        modal = tmp.querySelector('#modal-salir');
    } catch (e) {
        return;
    }
    var main = document.querySelector('.app-main');
    if (vista && main) main.appendChild(vista);
    if (modal) document.body.appendChild(modal);

    var avatar = document.getElementById('perfil-top');
    if (avatar) {
        avatar.addEventListener('click', function () {
            renderPerfil();
            irAVista('view-perfil', 'Perfil');
        });
    }
    var btnAjustes = document.getElementById('btn-ajustes-perfil');
    if (btnAjustes) {
        btnAjustes.addEventListener('click', function () {
            irAVista('view-ajustes', 'Ajustes');
        });
    }
    var vistaDash = tmp.querySelector('#view-dashboard');
    if (vistaDash && main) main.appendChild(vistaDash);
    var btnDash = document.getElementById('btn-dashboard');
    if (btnDash) {
        btnDash.addEventListener('click', function () {
            renderEstadisticas();
            irAVista('view-dashboard', 'Estadísticas');
        });
    }
    var dashAlias = document.getElementById('dash-alias');
    if (dashAlias) {
        dashAlias.checked = App.data.aliasActivo !== false;
        dashAlias.addEventListener('change', async function () {
            App.data.aliasActivo = dashAlias.checked;
            await saveData();
            showToast(dashAlias.checked
                ? 'Búsqueda inteligente activada'
                : 'Solo búsqueda por nombre de categoría');
        });
    }
    var btnPerfil = document.getElementById('btn-salir-perfil');
    if (btnPerfil) btnPerfil.addEventListener('click', abrirModalSalir);
    var btnCancel = document.getElementById('btn-cancelar-salir');
    if (btnCancel) btnCancel.addEventListener('click', cerrarModalSalir);
    var btnOk = document.getElementById('btn-confirmar-salir');
    if (btnOk) {
        btnOk.addEventListener('click', async function () {
            cerrarModalSalir();
            if (typeof cerrarSesion === 'function') await cerrarSesion();
            irAVista('view-inicio', 'Inicio');
        });
    }
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) cerrarModalSalir();
        });
    }
    if (typeof initDiccionario === 'function') initDiccionario();
    if (typeof aplicarDiccionario === 'function') await aplicarDiccionario();
}
