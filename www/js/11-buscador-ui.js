/* 11-buscador-ui.js - Panel de resultados, navegacion a vistas
   y backdrop difuminado del buscador global. */

function resCategoria(c) {
    return '' +
        '<div class="res-item" data-tipo="categoria" data-grupo="' + escapeHtml(c.grupo) +
            '" data-cat="' + escapeHtml(c.cat) + '">' +
            '<div class="res-icono"><i class="fas ' + c.icono + '"></i></div>' +
            '<div class="res-info">' +
                '<div class="res-nombre">' + escapeHtml(c.cat || c.grupo) + '</div>' +
                '<div class="res-detalle">' + escapeHtml(c.detalle) + '</div>' +
            '</div>' +
        '</div>';
}

function renderResultados(q, box) {
    var ql = norm(q);
    var qd = soloDigitos(q);
    var cats = buscarCategorias(ql);
    var emprends = buscarEmprendimientos(ql, qd);
    var contactos = buscarContactos(ql, qd);
    var notas = buscarNotas(ql, qd);

    var html = '';
    if (cats.length) {
        html += '<div class="res-grupo">Categorías</div>' +
                cats.slice(0, 8).map(resCategoria).join('');
    }
    if (emprends.length) {
        html += '<div class="res-grupo">Emprendimientos</div>' +
                emprends.slice(0, 8).map(resEmprend).join('');
    }
    if (contactos.length) {
        html += '<div class="res-grupo">Contactos</div>' +
                contactos.slice(0, 8).map(resContacto).join('');
    }
    if (notas.length) {
        html += '<div class="res-grupo">Notas</div>' +
                notas.slice(0, 6).map(resNota).join('');
    }
    box.innerHTML = html || '<div class="res-vacio">Sin resultados para "' +
        escapeHtml(q) + '"</div>';
    box.hidden = false;
    sincronizarBackdrop();
}

var _backdrop = null;
function sincronizarBackdrop() {
    var box = document.getElementById('resultados-global');
    if (_backdrop && box) _backdrop.hidden = box.hidden;
}

function irAResultado(item) {
    var box = document.getElementById('resultados-global');
    var input = document.getElementById('buscar-global');
    box.hidden = true;
    input.value = '';
    sincronizarBackdrop();

    if (item.dataset.tipo === 'categoria') {
        var cat = item.dataset.cat || null;
        if (cat) {
            /* Desde el buscador entra directo a la categoria en Negocios */
            App.filtroCategoria = cat;
            App.paginaEmp = 0;
            renderEmprendimientos();
            irAVista('view-emprendimientos', 'Negocios');
        } else {
            irAVista('view-inicio', 'Inicio');
            setTimeout(function () {
                abrirGrupo(item.dataset.grupo, null);
            }, 60);
        }
        return;
    }

    if (item.dataset.tipo === 'nota') {
        irAVista('view-notas', 'Notas');
        var nota = document.querySelector('.nota-card[data-id="' + item.dataset.id + '"]');
        if (nota) {
            nota.scrollIntoView({ behavior: 'smooth', block: 'center' });
            nota.classList.add('resaltado');
            setTimeout(function () { nota.classList.remove('resaltado'); }, 1600);
        }
        return;
    }

    if (item.dataset.tipo === 'emprend') {
        App.filtroCategoria = '';
        renderEmprendimientos();
        irAVista('view-emprendimientos', 'Negocios');
        var card = document.querySelector('.emprend-card[data-id="' + item.dataset.id + '"]');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('resaltado');
            setTimeout(function () { card.classList.remove('resaltado'); }, 1600);
        }
    } else {
        var buscador = document.getElementById('buscar-contacto');
        buscador.value = item.dataset.nombre;
        renderDirectorio(item.dataset.nombre);
        irAVista('view-directorio', 'Directorio');
    }
}

function initBuscador() {
    var input = document.getElementById('buscar-global');
    var box = document.getElementById('resultados-global');
    if (!input || !box) return;
    _backdrop = document.getElementById('buscador-backdrop');

    input.addEventListener('input', function () {
        var q = input.value.trim();
        if (q.length < 2) {
            box.hidden = true;
            box.innerHTML = '';
            sincronizarBackdrop();
            return;
        }
        renderResultados(q, box);
    });

    input.addEventListener('focus', function () {
        if (input.value.trim().length >= 2) box.hidden = false;
        sincronizarBackdrop();
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            box.hidden = true;
            sincronizarBackdrop();
            input.blur();
        }
    });

    box.addEventListener('click', function (e) {
        var item = e.target.closest('.res-item');
        if (item) irAResultado(item);
    });

    function cerrar() {
        box.hidden = true;
        sincronizarBackdrop();
    }

    if (_backdrop) _backdrop.addEventListener('click', cerrar);
    document.addEventListener('pointerdown', function (e) {
        if (!e.target.closest('.app-topbar')) cerrar();
    });
}
