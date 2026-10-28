/* 13-emprendimientos.js - Registro de emprendimiento en pagina completa,
   FAB visible solo dentro de Perfil con sesion, y QR por emprendimiento
   (el codigo no se muestra en la tarjeta, solo el icono). */

var PLUSES = [
    ['entregas', 'Hace entregas', 'fa-box'],
    ['domicilio', 'A domicilio', 'fa-motorcycle'],
    ['tarjeta', 'Acepta tarjeta', 'fa-credit-card'],
    ['sinpe', 'Acepta SINPE Móvil', 'fa-mobile-screen'],
    ['bilingue', 'Bilingüe', 'fa-language'],
    ['encargo', 'Por encargo', 'fa-clipboard-list'],
    ['parqueo', 'Parqueo', 'fa-square-parking'],
    ['whatsapp', 'Responde WhatsApp', 'fa-whatsapp'],
    ['garantia', 'Garantía', 'fa-shield-halved'],
    ['express', 'Entrega express', 'fa-bolt']
];

/* Botones-toggle: cada toque activa/desactiva un plus */
function llenarPluses() {
    var cont = document.getElementById('emp-pluses');
    if (!cont) return;
    cont.innerHTML = PLUSES.map(function (p) {
        return '<button type="button" class="emp-plus" data-plus="' + p[0] + '">' +
            '<i class="fas ' + p[2] + '"></i> ' + p[1] + '</button>';
    }).join('');
    cont.addEventListener('click', function (e) {
        var btn = e.target.closest('.emp-plus');
        if (btn) btn.classList.toggle('activo');
    });
}

function plusesSeleccionados() {
    var cont = document.getElementById('emp-pluses');
    if (!cont) return [];
    return Array.prototype.map.call(cont.querySelectorAll('.emp-plus.activo'),
        function (b) { return b.dataset.plus; });
}

var DIAS = [
    ['L', 'Lunes'], ['M', 'Martes'], ['X', 'Miércoles'], ['J', 'Jueves'],
    ['V', 'Viernes'], ['S', 'Sábado'], ['D', 'Domingo']
];

/* Cascada: dia a la izquierda, sus horarios a la derecha.
   Solo se marcan los dias que se trabaja (habilita sus horas). */
function llenarDias() {
    var cont = document.getElementById('emp-agenda');
    if (!cont) return;
    cont.innerHTML = DIAS.map(function (d) {
        return '<div class="emp-fila-dia" data-dia="' + d[0] + '">' +
            '<button type="button" class="emp-dia-toggle">' + d[1] + '</button>' +
            '<div class="emp-dia-horas">' +
                '<input type="time" class="h-abre" value="08:00" disabled>' +
                '<span>-</span>' +
                '<input type="time" class="h-cierra" value="17:00" disabled>' +
            '</div>' +
        '</div>';
    }).join('');
    cont.addEventListener('click', function (e) {
        var btn = e.target.closest('.emp-dia-toggle');
        if (!btn) return;
        var fila = btn.closest('.emp-fila-dia');
        var activo = fila.classList.toggle('activo');
        fila.querySelectorAll('input').forEach(function (i) {
            i.disabled = !activo;
        });
    });
}

function agendaSeleccionada() {
    return Array.prototype.map.call(
        document.querySelectorAll('#emp-agenda .emp-fila-dia.activo'),
        function (f) {
            return {
                dia: f.dataset.dia,
                abre: f.querySelector('.h-abre').value,
                cierra: f.querySelector('.h-cierra').value
            };
        });
}

/* Agrupa los dias con el mismo horario: "L-V 08:00-17:00 · S 09:00-13:00" */
function horarioTexto() {
    var ag = agendaSeleccionada();
    if (!ag.length) return '';
    var grupos = {};
    ag.forEach(function (a) {
        var k = a.abre + '-' + a.cierra;
        (grupos[k] = grupos[k] || []).push(a.dia);
    });
    var combos = { 'LMXJV': 'L-V', 'LMXJVS': 'L-S', 'LMXJVSD': 'L-D' };
    return Object.keys(grupos).map(function (k) {
        var d = grupos[k].join('');
        return (combos[d] || grupos[k].join(',')) + ' ' + k;
    }).join(' · ');
}

async function initEmprendimientos() {
    var vista, modal;
    try {
        var res = await fetch('parciales/emprendimiento.html');
        var tmp = document.createElement('div');
        tmp.innerHTML = await res.text();
        vista = tmp.querySelector('#view-registro-emp');
        modal = tmp.querySelector('#modal-qr');
    } catch (e) {
        return;
    }
    var main = document.querySelector('.app-main');
    if (vista && main) main.appendChild(vista);
    var vistaCon = tmp.querySelector('#view-contacto');
    if (vistaCon && main) main.appendChild(vistaCon);
    var vistaDet = tmp.querySelector('#view-emprendimiento');
    if (vistaDet && main) main.appendChild(vistaDet);
    if (modal) document.body.appendChild(modal);
    var modalCat = tmp.querySelector('#modal-cat');
    if (modalCat) document.body.appendChild(modalCat);

    llenarCategorias();
    llenarPluses();
    llenarDias();
    if (typeof initWizard === 'function') initWizard();
    var form = document.getElementById('form-emprendimiento');
    if (form) form.addEventListener('submit', guardarEmprendimiento);
    var btnCerrar = document.getElementById('btn-cerrar-qr');
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarQR);
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) cerrarQR();
        });
    }
}

/* Bottom-sheet de categorias: abre con blur, cierra al elegir */
function llenarCategorias() {
    var lista = document.getElementById('modal-cat-lista');
    var modal = document.getElementById('modal-cat');
    var btn = document.getElementById('emp-cat-btn');
    if (!lista || !modal || !btn || typeof CATEGORIAS === 'undefined') return;
    lista.innerHTML = CATEGORIAS.map(function (g) {
        return '<div class="mcat-grupo">' +
            '<i class="fas ' + g.icono + '"></i> ' + g.grupo + '</div>' +
            g.items.map(function (it) {
                return '<button type="button" class="cat-item" data-cat="' +
                    it[0] + '"><i class="fas ' + it[1] + '"></i> ' + it[0] + '</button>';
            }).join('');
    }).join('');
    btn.addEventListener('click', function () { modal.hidden = false; });
    var x = document.getElementById('modal-cat-x');
    if (x) x.addEventListener('click', function () { modal.hidden = true; });
    modal.addEventListener('click', function (e) {
        if (e.target === modal) { modal.hidden = true; return; }
        var item = e.target.closest('.cat-item');
        if (item) {
            document.getElementById('emp-categoria').value = item.dataset.cat;
            document.getElementById('emp-cat-texto').textContent = item.dataset.cat;
            btn.classList.add('elegida');
            modal.hidden = true;
        }
    });
}

/* Prellena el contacto con el nombre del usuario logueado */
function prepararFormEmp() {
    var campo = document.getElementById('emp-contacto');
    var u = typeof usuarioActual === 'function' ? usuarioActual() : null;
    if (campo && u && !campo.value) {
        campo.value = ((u.nombre || '') + ' ' + (u.apellido || '')).trim();
    }
}
