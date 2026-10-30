/* BLINDADO (orden del usuario): prohibido modificar/eliminar
   sin orden explicita. Pedir permiso antes de tocar. */
/* 29-prohibidas.js - Palabras restringidas del buscador.
   El superusuario administra la lista en Ajustes; se guarda
   en App.data.palabrasProhibidas y sincroniza a todos. Una
   query prohibida devuelve "no encontrado" (lista vacia). */

var PROHIBIDAS_BASE = ['pornografia', 'porno', 'sexo infantil',
    'granada', 'sicariato', 'balas', 'arma de fuego', 'drogas'];

function listaProhibidas() {
    return App.data.palabrasProhibidas || PROHIBIDAS_BASE;
}

function esProhibida(q) {
    var n = norm(q);
    if (!n || n.length < 3) return false;
    return listaProhibidas().some(function (p) {
        var pn = norm(p);
        return n.indexOf(pn) !== -1 || pn.indexOf(n) !== -1;
    });
}

/* Envolver los 4 buscadores: palabra prohibida -> cero resultados */
['buscarCategorias', 'buscarEmprendimientos', 'buscarContactos',
 'buscarNotas'].forEach(function (f) {
    var orig = window[f];
    if (typeof orig === 'function') {
        window[f] = function () {
            if (esProhibida(arguments[0])) return [];
            return orig.apply(this, arguments);
        };
    }
});

/* Panel del superusuario: agregar/quitar palabras restringidas */
function gestionarProhibidas() {
    var u = usuarioActual();
    if (!u || u.rol !== 'super') {
        showToast('Solo el superusuario');
        return;
    }
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja">' +
        '<h3><i class="fas fa-ban"></i> Palabras restringidas</h3>' +
        '<p class="rep-sub">Estas palabras jamás aparecen en el ' +
        'buscador: si se escriben, el resultado es "no encontrado".</p>' +
        '<div id="prob-lista"></div>' +
        '<div style="display:flex;gap:6px">' +
        '<input type="text" id="prob-nueva" class="login-input" ' +
            'placeholder="Palabra a restringir" ' +
            'style="flex:1;margin:0">' +
        '<button class="emp-btn-guardar" id="prob-add" ' +
            'style="width:auto;padding:10px 14px">+</button></div>' +
        '<button class="rep-cancelar" id="prob-cerrar">Cerrar</button>' +
        '</div>';
    function pintar() {
        var l = document.getElementById('prob-lista');
        l.innerHTML = listaProhibidas().map(function (p, i) {
            return '<div class="dic-item">' + escapeHtml(p) +
                ' <button class="rep-motivo" data-i="' + i +
                '">quitar</button></div>';
        }).join('');
        l.querySelectorAll('.rep-motivo').forEach(function (b) {
            b.onclick = async function () {
                var arr = listaProhibidas().slice();
                arr.splice(+b.dataset.i, 1);
                App.data.palabrasProhibidas = arr;
                await saveData(); pintar();
            };
        });
    }
    ov.querySelector('#prob-add').onclick = async function () {
        var v = ov.querySelector('#prob-nueva').value.trim();
        if (!v) return;
        var arr = listaProhibidas().slice();
        if (arr.indexOf(v) === -1) arr.push(v);
        App.data.palabrasProhibidas = arr;
        ov.querySelector('#prob-nueva').value = '';
        if (typeof pushNotificacion === 'function') {
            if (typeof logActividad === 'function') {
                logActividad('prohibida',
                    u.email + ' restringió "' + v + '"');
            }
            pushNotificacion('prohibida',
                u.email + ' restringió la palabra "' + v + '"');
        }
        await saveData(); pintar();
        showToast('Palabra restringida');
    };
    ov.querySelector('#prob-cerrar').onclick = function () { ov.remove(); };
    ov.onclick = function (ev) { if (ev.target === ov) ov.remove(); };
    document.body.appendChild(ov);
    pintar();
}
