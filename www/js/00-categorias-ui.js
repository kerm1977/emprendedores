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
            return;
        }
        var chip = e.target.closest('.cat-chip');
        if (!chip) return;
        App.filtroCategoria = chip.dataset.cat;
        renderEmprendimientos();
        irAVista('view-emprendimientos', 'Negocios');
    });
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
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (nombreChip) {
        var chip = chips.querySelector('[data-cat="' + nombreChip + '"]');
        if (chip) {
            chip.classList.add('resaltado');
            setTimeout(function () { chip.classList.remove('resaltado'); }, 1600);
        }
    }
}
