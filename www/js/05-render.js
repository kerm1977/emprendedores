/* 05-render.js - Renderizado de las vistas con los datos de App.data */

function tarjetaEmprendimiento(e) {
    return '' +
        '<div class="emprend-card" data-id="' + e.id + '">' +
            '<div class="emprend-logo">' +
                '<i class="fas ' + iconoDeCategoria(e.categoria) + '"></i>' +
            '</div>' +
            '<div class="emprend-info">' +
                '<div class="emprend-nombre">' + escapeHtml(e.nombre) + '</div>' +
                '<div class="emprend-detalle">' +
                    escapeHtml(e.categoria) +
                '</div>' +
            '</div>' +
            '<div class="emp-acc">' +
                '<button class="emp-fav' + esDestacado(e.id) +
                    '" title="Destacar">' +
                    '<i class="fas fa-heart"></i>' +
                '</button>' +
                '<button class="emp-dl" title="Descargar tarjeta digital">' +
                    '<i class="fas fa-address-card"></i>' +
                '</button>' +
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

    /* Destacados = solo los que el usuario marco con corazon */
    var favs = favsDeUsuario();
    var muestra = lista.filter(function (e) {
        return favs.indexOf(String(e.id)) !== -1;
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

function renderEmprendimientos() {
    var lista = App.data.emprendimientos || [];
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
    var filtrados = lista.filter(function (p) {
        return p.nombre.toLowerCase().indexOf(q) !== -1 ||
               (p.emprendimiento || '').toLowerCase().indexOf(q) !== -1;
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
    var ferias = App.data.ferias || App.data.notas || [];
    document.getElementById('lista-notas').innerHTML = ferias.length
        ? ferias.map(function (n) {
            var fecha = n.fecha
                ? new Date(n.fecha + 'T00:00').toLocaleDateString('es-CR',
                    { day: 'numeric', month: 'short', year: 'numeric' })
                : '';
            return '' +
                '<div class="nota-card" data-id="' + n.id + '">' +
                    '<div class="nota-titulo">' +
                        '<i class="fas fa-tents"></i> ' + escapeHtml(n.titulo) +
                    '</div>' +
                    '<div class="nota-feria">' +
                        (fecha ? '<span><i class="fas fa-calendar"></i> ' + fecha + '</span>' : '') +
                        (n.lugar ? '<span><i class="fas fa-location-dot"></i> ' +
                            escapeHtml(n.lugar) + '</span>' : '') +
                        (n.contacto ? '<span><i class="fas fa-user"></i> ' +
                            escapeHtml(n.contacto) + '</span>' : '') +
                        (n.telefono ? '<span><i class="fas fa-phone"></i> ' +
                            escapeHtml(n.telefono) + '</span>' : '') +
                    '</div>' +
                    (n.texto ? '<p class="nota-texto">' + escapeHtml(n.texto) + '</p>' : '') +
                '</div>';
        }).join('')
        : '<div class="vacio"><i class="fas fa-tents"></i>No hay ferias registradas</div>';
}

function renderTodo() {
    renderHome();
    renderEmprendimientos();
    renderDirectorio(document.getElementById('buscar-contacto').value);
    renderNotas();
}
