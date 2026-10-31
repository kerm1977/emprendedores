/* 00-categorias-ui.js - Render acordeon, filtro por chip y
   apertura de grupos desde el buscador global. */

function totalCategorias() {
    return CATEGORIAS.reduce(function (s, g) { return s + g.items.length; }, 0);
}

function iconoDeCategoria(nombre) {
    for (var g = 0; g < CATEGORIAS.length; g++) {
        var items = CATEGORIAS[g].items;
        for (var i = 0; i < items.length; i++) {
            if (items[i][0] === nombre) return items[i][1];
        }
    }
    return 'fa-store';
}

function renderCategorias() {
    var box = document.getElementById('home-categorias');
    if (!box) return;
    box.innerHTML = CATEGORIAS.map(function (g) {
        var chips = g.items.map(function (it) {
            return '<button type="button" class="cat-chip" data-cat="' + it[0] + '">' +
                '<i class="fas ' + it[1] + '"></i>' + it[0] + '</button>';
        }).join('');
        return '<div class="cat-grupo">' +
            '<button type="button" class="cat-grupo-titulo">' +
                '<span><i class="fas ' + g.icono + '"></i>' + g.grupo + '</span>' +
                '<i class="fas fa-chevron-down cat-flecha"></i>' +
            '</button>' +
            '<div class="cat-chips" hidden>' + chips + '</div>' +
        '</div>';
    }).join('');

    box.addEventListener('click', function (e) {
        /* Acordeón: el título abre su grupo y cierra los demás */
        var titulo = e.target.closest('.cat-grupo-titulo');
        if (titulo) {
            var chips = titulo.parentElement.querySelector('.cat-chips');
            var abrir = chips.hidden;
            box.querySelectorAll('.cat-chips').forEach(function (c) { c.hidden = true; });
            box.querySelectorAll('.cat-grupo-titulo').forEach(function (t) {
                t.classList.remove('abierto');
            });
            if (abrir) {
                chips.hidden = false;
                titulo.classList.add('abierto');
            }
            box.classList.toggle('cats-enfoque', abrir);
            return;
        }
        var chip = e.target.closest('.cat-chip');
        if (!chip) return;
        abrirPaginaCategoria(chip.dataset.cat);
    });
}

/* Página exclusiva por subcategoría (NO es Negocios): lista TODOS los
   emprendimientos de esa categoría con su nota explicativa si existe. */
function abrirPaginaCategoria(cat) {
    var vista = document.getElementById('view-categoria');
    if (!vista) return;
    var lista = (App.data.emprendimientos || []).filter(function (e) {
        return !e.pausa && e.categoria === cat;
    });
    if (typeof dedupeNegocios === 'function') lista = dedupeNegocios(lista);
    var nota = (typeof NOTAS_CATEGORIA !== 'undefined' && NOTAS_CATEGORIA[cat]) || '';
    vista.innerHTML = '<div style="text-align:left;margin-top:30px">' +
        '<h3><i class="fas ' + iconoDeCategoria(cat) + '"></i> ' + escapeHtml(cat) + '</h3>' +
        '<p class="rep-sub">' + lista.length + ' emprendimiento' + (lista.length === 1 ? '' : 's') + ' en esta categoría</p>' +
        (nota ? '<p class="rep-sub"><i class="fas fa-circle-info"></i> ' + escapeHtml(nota) + '</p>' : '') +
        '<div>' + (lista.map(tarjetaEmprendimiento).join('') || '<div class="vacio"><i class="fas fa-store"></i>Todavía no hay emprendimientos en esta categoría.</div>') + '</div>' +
        '<button class="perfil-btn-ajustes" id="cat-volver" style="margin-top:14px"><i class="fas fa-arrow-left"></i> Volver</button></div>';
    vista.querySelector('#cat-volver').onclick = function () { irAVista('view-inicio', 'Inicio'); };
    vista.addEventListener('click', function (ev) {
        var t = ev.target.closest('[data-id]');
        if (t) verEmprendimiento(t.dataset.id);
    });
    irAVista('view-categoria', cat);
}

/* Abre un grupo del acordeón por nombre; opcional resalta una categoría */
function abrirGrupo(nombreGrupo, nombreChip) {
    var target = null;
    document.querySelectorAll('.cat-grupo-titulo').forEach(function (t) {
        if (t.textContent.toLowerCase().indexOf(nombreGrupo.toLowerCase()) !== -1) {
            target = t;
        }
    });
    if (!target) return;

    document.querySelectorAll('.cat-chips').forEach(function (c) { c.hidden = true; });
    document.querySelectorAll('.cat-grupo-titulo').forEach(function (t) {
        t.classList.remove('abierto');
    });

    var chips = target.parentElement.querySelector('.cat-chips');
    chips.hidden = false;
    target.classList.add('abierto');
    var box2 = document.getElementById('home-categorias');
    if (box2) box2.classList.add('cats-enfoque');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (nombreChip) {
        var chip = chips.querySelector('[data-cat="' + nombreChip + '"]');
        if (chip) {
            chip.classList.add('resaltado');
            setTimeout(function () { chip.classList.remove('resaltado'); }, 1600);
        }
    }
}
