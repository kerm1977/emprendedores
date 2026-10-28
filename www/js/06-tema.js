/* 06-tema.js - Modo claro/oscuro: long-press sobre el indicador del navbar */

var TEMA_KEY = 'emprende-tema';
var LONGPRESS_MS = 550;

function esOscuro() {
    return document.documentElement.classList.contains('tema-oscuro');
}

function aplicarTema(oscuro) {
    document.documentElement.classList.toggle('tema-oscuro', oscuro);
    try {
        localStorage.setItem(TEMA_KEY, oscuro ? 'oscuro' : 'claro');
    } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', oscuro ? '#0f172a' : '#ffffff');
}

function alternarTema() {
    aplicarTema(!esOscuro());
    showToast(esOscuro() ? 'Modo oscuro' : 'Modo claro');
}

/* Long-press sobre el círculo deslizante alterna el tema.
   El círculo sobresale del borde superior de la barra, así que se
   detecta cualquier presión por encima de ese borde (el ícono activo
   queda encima del círculo y también cuenta). */
function initTema() {
    var list = document.querySelector('.magic-nav-list');
    if (!list) return;

    var timer = null;

    list.addEventListener('pointerdown', function (e) {
        var top = list.getBoundingClientRect().top;
        if (e.clientY > top + 6) return;
        timer = setTimeout(alternarTema, LONGPRESS_MS);
    });

    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
        list.addEventListener(ev, function () {
            clearTimeout(timer);
        });
    });

    list.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });
}
