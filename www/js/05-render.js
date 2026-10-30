/* 05-render.js - Renderizado de las vistas con los datos de App.data */

function esCreadorNegocio(e, u) {
    var correo = String(u && u.email || '').trim().toLowerCase();
    return !!(correo && e && String(e.owner || '').trim().toLowerCase() === correo);
}

function puedeVerEstadisticasNegocio(e, u) {
    return !!(u && (u.rol === 'super' || esCreadorNegocio(e, u)));
}

function urlLogoNegocio(valor) {
    var src = String(valor || '').trim();
    if (/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(src)) return src;
    if (/^\/?uploads\/[a-z0-9_.-]+$/i.test(src)) return apiUrl('/' + src.replace(/^\//, ''));
    try {
        var url = new URL(src);
        return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch (error) { return ''; }
}

document.addEventListener('error', function (ev) {
    var img = ev.target;
    if (!img.matches || !img.matches('img[data-logo-negocio]')) return;
    img.hidden = true;
    var icono = img.parentElement.querySelector('i');
    if (icono) icono.hidden = false;
}, true);

function tarjetaEmprendimiento(e) {
    var logo = urlLogoNegocio(e.logo);
    return '' +
        '<div class="emprend-card" data-id="' + escapeHtml(String(e.id)) + '">' +
            '<div class="emprend-logo">' +
                (logo ? '<img data-logo-negocio src="' + escapeHtml(logo) + '" alt="Logo de ' + escapeHtml(e.nombre) + '">' : '') +
                '<i' + (logo ? ' hidden' : '') + ' class="fas ' + iconoDeCategoria(e.categoria) + '"></i>' +
            '</div>' +
            '<div class="emprend-info">' +
                '<div class="emprend-nombre">' + escapeHtml(e.nombre) + '</div>' +
                '<div class="emprend-detalle">' +
                    escapeHtml(e.categoria) +
                '</div>' +
                '<div class="emprend-ubicacion">' +
                    '<span>Provincia: ' + escapeHtml(e.provincia || 'No indicada') + '</span>' +
                    '<span>Distrito: ' + escapeHtml(e.distrito || 'No indicado') + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
}

/* Fila de extras de la tarjeta: llegada (Maps/Waze) y entregas/domicilio */

function favsDeUsuario() {
    var u = typeof usuarioActual === 'function' ? usuarioActual() : null;
    if (!u) return [];
    return ((App.data.destacados || {})[u.email] || []).map(String);
}

function esDestacado(id) {
    return favsDeUsuario().indexOf(String(id)) !== -1 ? ' activo' : '';
}

async function toggleDestacado(id) {
    var u = typeof usuarioActual === 'function' ? usuarioActual() : null;
    if (!u) {
        if (typeof mostrarLogin === 'function') mostrarLogin();
        return;
    }
    App.data.destacados = App.data.destacados || {};
    var favs = App.data.destacados[u.email] =
        App.data.destacados[u.email] || [];
    var i = favs.indexOf(String(id));
    if (i < 0) {
        favs.push(String(id));
        showToast('Destacado en tu inicio');
    } else {
        favs.splice(i, 1);
        showToast('Quitado de destacados');
    }
    await saveData();
    renderTodo();
}

function renderHome() {
    var lista = App.data.emprendimientos || [];

    document.getElementById('stats-row').innerHTML =
        '<div class="stat-card"><div class="stat-numero">' + lista.length + '</div>' +
            '<div class="stat-label">Emprendim.</div></div>' +
        '<div class="stat-card"><div class="stat-numero">' + totalCategorias() + '</div>' +
            '<div class="stat-label">Categorías</div></div>' +
        '<div class="stat-card"><div class="stat-numero">' + (App.data.emprendedores || []).length + '</div>' +
            '<div class="stat-label">Contactos</div></div>';

    /* Destacados de Inicio = solo emprendimientos del espacio pagado
       con promocion vigente (orden del usuario) */
    var ahora = typeof promoAhora === 'function' ? promoAhora() : 0;
    var ids = new Set((typeof Promociones !== 'undefined' && Promociones.publico ? Promociones.publico.activos : [])
        .filter(function (a) { return a.starts <= ahora && a.ends > ahora; })
        .map(function (a) { return String(a.emp); }));
    var muestra = lista.filter(function (e) {
        return !e.pausa;
    }).filter(function (e) {
        return ids.has(String(e.id));
    });
    var titulo = document.getElementById('titulo-destacados');
    var grid = document.getElementById('home-destacados');
    if (titulo) titulo.hidden = !muestra.length;
    grid.hidden = !muestra.length;
    grid.innerHTML = muestra.length
        ? muestra.map(tarjetaEmprendimiento).join('')
        : '';
}

/* Cada toque en una tarjeta cuenta como "consulta" (offline-first) */
function registrarClic(id) {
    var e = (App.data.emprendimientos || []).find(function (x) {
        return String(x.id) === String(id);
    });
    if (!e) return;
    e.clics = (e.clics || 0) + 1;
    saveData().then(renderHome);
}

var EMP_POR_PAGINA = 10;

function mezclarOrdenNegocios() {
    App.ordenNegocios = (App.data.emprendimientos || []).map(function (e) { return String(e.id); });
    for (var i = App.ordenNegocios.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var valor = App.ordenNegocios[i];
        App.ordenNegocios[i] = App.ordenNegocios[j];
        App.ordenNegocios[j] = valor;
    }
}

function renderEmprendimientos() {
    if (!App.ordenNegocios) mezclarOrdenNegocios();
    if (typeof renderEspaciosPromocionados === 'function') return renderEspaciosPromocionados();
    var orden = new Map(App.ordenNegocios.map(function (id, i) { return [id, i]; }));
    var lista = (App.data.emprendimientos || []).slice().sort(function (a, b) {
        var ia = orden.has(String(a.id)) ? orden.get(String(a.id)) : orden.size;
        var ib = orden.has(String(b.id)) ? orden.get(String(b.id)) : orden.size;
        return ia - ib;
    });
    var f = App.filtroCategoria || '';
    var filtrados = f
        ? lista.filter(function (e) { return e.categoria === f; })
        : lista;

    var chip = document.getElementById('filtro-activo');
    chip.hidden = !f;
    document.getElementById('filtro-nombre').textContent = f;
    document.getElementById('emprendimientos-count').textContent =
        filtrados.length + (f ? ' en ' + f : ' registrados');

    /* Paginacion: 10 emprendimientos por pagina */
    App.paginaEmp = App.paginaEmp || 0;
    var pags = Math.max(1, Math.ceil(filtrados.length / EMP_POR_PAGINA));
    if (App.paginaEmp >= pags) App.paginaEmp = 0;
    var ini = App.paginaEmp * EMP_POR_PAGINA;
    var pagina = filtrados.slice(ini, ini + EMP_POR_PAGINA);

    document.getElementById('lista-emprendimientos').innerHTML = pagina.length
        ? pagina.map(tarjetaEmprendimiento).join('')
        : '<div class="vacio"><i class="fas fa-store"></i>' +
          (f ? 'Nada en ' + escapeHtml(f) : 'No hay emprendimientos') + '</div>';

    var pag = document.getElementById('emp-pag');
    if (pag) {
        pag.innerHTML = pags > 1
            ? '<button class="emp-pag-btn" data-dir="-1"' +
                  (App.paginaEmp === 0 ? ' disabled' : '') + '>' +
                  '<i class="fas fa-chevron-left"></i></button>' +
              '<span class="emp-pag-info">' + (App.paginaEmp + 1) +
                  ' / ' + pags + '</span>' +
              '<button class="emp-pag-btn" data-dir="1"' +
                  (App.paginaEmp >= pags - 1 ? ' disabled' : '') + '>' +
                  '<i class="fas fa-chevron-right"></i></button>'
            : '';
    }
}

function renderDirectorio(filtro) {
    var lista = App.data.emprendedores || [];
    var q = (filtro || '').toLowerCase();
    var qd = (filtro || '').replace(/\D/g, '');
    var filtrados = lista.filter(function (p) {
        return ['nombre', 'emprendimiento', 'provincia', 'canton', 'distrito'].some(function (k) {
            return String(p[k] || '').toLowerCase().indexOf(q) !== -1;
        }) || (qd && String(p.telefono || '').replace(/\D/g, '').indexOf(qd) !== -1);
    });
    filtrados.sort(function (a, b) {
        return (a.emprendimiento || a.nombre || '').localeCompare(b.emprendimiento || b.nombre || '', 'es');
    });

    document.getElementById('lista-directorio').innerHTML = filtrados.length
        ? filtrados.map(function (p) {
            return '' +
                '<div class="contacto-item" data-id="' + p.id + '">' +
                    '<div class="contacto-avatar">' +
                        inicial(p.emprendimiento || p.nombre) +
                    '</div>' +
                    '<div class="contacto-info">' +
                        '<div class="contacto-nombre">' +
                            escapeHtml(p.emprendimiento || p.nombre) +
                        '</div>' +
                        '<div class="contacto-tel">' +
                            escapeHtml(p.nombre) +
                            ' · ' + escapeHtml(p.telefono) +
                        '</div>' +
                    '</div>' +
                    '<i class="fas fa-chevron-right contacto-flecha"></i>' +
                '</div>';
        }).join('')
        : '<div class="vacio"><i class="fas fa-users"></i>Sin contactos</div>';
}

function renderNotas() {
    if (typeof renderEventos === 'function') return renderEventos();
    document.getElementById('lista-notas').textContent = 'Actualizá la aplicación para consultar eventos.';
}

function renderTodo() {
    renderHome();
    renderEmprendimientos();
    renderDirectorio(document.getElementById('buscar-contacto').value);
    renderNotas();
}
