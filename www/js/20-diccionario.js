/* 20-diccionario.js - Diccionario de alias por categoria en el
   Dashboard: ver, editar y eliminar palabras (triple confirmacion). */

function dicPorDefecto() {
    var out = [];
    (typeof ALIAS_TABLA !== 'undefined' ? ALIAS_TABLA : []).forEach(function (t) {
        t[1].forEach(function (c) {
            var f = null;
            out.forEach(function (d) { if (d.cat === c[0]) f = d; });
            if (!f) {
                f = { cat: c[0], grupo: c[1], icono: c[2], words: [] };
                out.push(f);
            }
            t[0].forEach(function (w) {
                if (f.words.indexOf(w) === -1) f.words.push(w);
            });
        });
    });
    return out;
}

/* Diccionario fuera del blob sincronizado: vive en su propia
   clave de localForage para no inflar el guardado/carga */
var _dicc = null;

async function guardarDiccionario() {
    try { await localforage.setItem('diccionario', _dicc); } catch (e) {}
}

/* Reconstruye ALIAS_TABLA desde el diccionario persistido */
async function aplicarDiccionario() {
    var d = null;
    try { d = await localforage.getItem('diccionario'); } catch (e) {}
    /* Migracion: si quedo dentro de App.data, se saca del blob */
    if (!d && App.data.diccionario) {
        d = App.data.diccionario;
        delete App.data.diccionario;
        try { await localforage.setItem('diccionario', d); } catch (e2) {}
        saveData();
    }
    _dicc = d || dicPorDefecto();
    if (typeof ALIAS_TABLA === 'undefined') return;
    ALIAS_TABLA.length = 0;
    _dicc.forEach(function (x) {
        ALIAS_TABLA.push([x.words.slice(), [[x.cat, x.grupo, x.icono]]]);
    });
}

function renderDiccionario() {
    var lista = document.getElementById('dash-dic-lista');
    if (!lista) return;
    aplicarDiccionario();
    lista.innerHTML = (_dicc || []).map(function (d) {
        return '<div class="dic-cat">' +
            '<div class="dic-cat-titulo"><i class="fas ' + d.icono + '"></i> ' +
                escapeHtml(d.cat) +
                ' <small>' + escapeHtml(d.grupo) + ' · ' +
                d.words.length + ' palabras</small></div>' +
            '<div class="dic-chips">' +
                d.words.map(function (w) {
                    return '<button type="button" class="dic-chip" ' +
                        'data-cat="' + escapeHtml(d.cat) + '" ' +
                        'data-pal="' + escapeHtml(w) + '">' +
                        escapeHtml(w) + ' <i class="fas fa-pen"></i></button>';
                }).join('') +
            '</div></div>';
    }).join('') ||
    '<div class="vacio"><i class="fas fa-book"></i>Sin palabras</div>';
}

/* Modal tematico generico reutilizando estilos de modal-salir */
function dicModal(opc) {
    var m = document.getElementById('dic-modal');
    if (!m) return;
    document.getElementById('dic-modal-titulo').innerHTML = opc.titulo;
    document.getElementById('dic-modal-texto').innerHTML = opc.texto;
    var input = document.getElementById('dic-modal-input');
    input.value = opc.valor || '';
    input.hidden = !opc.conInput;
    var bSi = document.getElementById('dic-modal-si');
    var bNo = document.getElementById('dic-modal-no');
    bSi.innerHTML = opc.si || 'Aceptar';
    bSi.className = 'salir-si' + (opc.peligro ? ' peligro' : '');
    m.hidden = false;
    input.focus();
    return new Promise(function (resolve) {
        var fin = function (v) {
            m.hidden = true;
            resolve(v);
        };
        bSi.onclick = function () {
            fin(opc.conInput ? input.value.trim() : true);
        };
        bNo.onclick = function () { fin(null); };
        m.onclick = function (e) { if (e.target === m) fin(null); };
    });
}

async function dicEditarPalabra(cat, palabra) {
    var d = (_dicc || []).find(function (x) {
        return x.cat === cat;
    });
    if (!d) return;
    var nuevo = await dicModal({
        titulo: 'Editar palabra',
        texto: 'Categoría: <b>' + escapeHtml(cat) + '</b><br>Palabra actual:',
        valor: palabra, conInput: true, si: 'Guardar'
    });
    if (!nuevo) return;
    var i = d.words.indexOf(palabra);
    if (i !== -1) d.words[i] = nuevo;
    aplicarDiccionario();
    await guardarDiccionario();
    renderDiccionario();
    showToast('Palabra actualizada');
}

async function dicEliminarPalabra(cat, palabra) {
    var pasos = [
        { t: '¿Eliminar palabra?', x: 'Vas a eliminar <b>' + escapeHtml(palabra) +
            '</b> de <b>' + escapeHtml(cat) + '</b>.', s: 'Sí, eliminar' },
        { t: '¿Seguro?', x: 'Ya no recomendará <b>' + escapeHtml(cat) +
            '</b> al buscar esta palabra.', s: 'Eliminar' },
        { t: 'Última confirmación', x: 'Esta acción <b>no se puede deshacer</b>.', s: 'Eliminar definitivamente' }
    ];
    for (var i = 0; i < 3; i++) {
        var ok = await dicModal({
            titulo: pasos[i].t + ' (' + (i + 1) + '/3)',
            texto: pasos[i].x, si: pasos[i].s, peligro: true
        });
        if (ok !== true) return;
    }
    var d = (_dicc || []).find(function (x) {
        return x.cat === cat;
    });
    if (!d) return;
    d.words = d.words.filter(function (w) { return w !== palabra; });
    aplicarDiccionario();
    await guardarDiccionario();
    renderDiccionario();
    showToast('Palabra eliminada');
}

async function dicAgregarPalabra(cat) {
    var d = (_dicc || []).find(function (x) {
        return x.cat === cat;
    });
    if (!d) return;
    var nueva = await dicModal({
        titulo: 'Nueva palabra',
        texto: 'Categoría: <b>' + escapeHtml(cat) + '</b>',
        conInput: true, si: 'Agregar'
    });
    if (!nueva) return;
    if (d.words.indexOf(nueva) !== -1) {
        showToast('Esa palabra ya existe');
        return;
    }
    d.words.push(nueva);
    aplicarDiccionario();
    await guardarDiccionario();
    renderDiccionario();
    showToast('Palabra agregada');
}

function initDiccionario() {
    var btnVer = document.getElementById('dash-dic-ver');
    var lista = document.getElementById('dash-dic-lista');
    if (btnVer && lista) {
        btnVer.addEventListener('click', function () {
            lista.hidden = !lista.hidden;
            if (!lista.hidden) renderDiccionario();
            btnVer.innerHTML = lista.hidden
                ? '<i class="fas fa-book-open"></i> Ver diccionario de palabras'
                : '<i class="fas fa-book"></i> Ocultar diccionario';
        });
    }
    if (lista) {
        lista.addEventListener('click', function (e) {
            var chip = e.target.closest('.dic-chip');
            if (!chip) {
                var mas = e.target.closest('.dic-add');
                if (mas) dicAgregarPalabra(mas.dataset.cat);
                return;
            }
            dicMenu(chip.dataset.cat, chip.dataset.pal);
        });
    }
}

/* Menu de acciones por palabra: editar o eliminar */
async function dicMenu(cat, palabra) {
    var m = document.getElementById('dic-menu');
    if (!m) return;
    document.getElementById('dic-menu-titulo').textContent = palabra;
    document.getElementById('dic-menu-cat').textContent = cat;
    m.hidden = false;
    await new Promise(function (resolve) {
        document.getElementById('dic-menu-edit').onclick = function () {
            m.hidden = true; resolve(); dicEditarPalabra(cat, palabra);
        };
        document.getElementById('dic-menu-del').onclick = function () {
            m.hidden = true; resolve(); dicEliminarPalabra(cat, palabra);
        };
        document.getElementById('dic-menu-cancel').onclick = function () {
            m.hidden = true; resolve();
        };
        m.onclick = function (e) {
            if (e.target === m) { m.hidden = true; resolve(); }
        };
    });
}
