/* 04-nav.js - Magic navbar: indicador deslizante + cambio de vista */

var _moverIndicador = null;

function initNav() {
    var list = document.querySelector('.magic-nav-list');
    var indicator = document.querySelector('.magic-indicator');
    var items = Array.prototype.slice.call(list.querySelectorAll('.magic-item'));

    function moveIndicator(item) {
        var listRect = list.getBoundingClientRect();
        var rect = item.getBoundingClientRect();
        var x = rect.left - listRect.left + rect.width / 2 - indicator.offsetWidth / 2;
        indicator.style.transform = 'translateX(' + x + 'px)';
    }
    _moverIndicador = moveIndicator;

    function activar(item) {
        items.forEach(function (el) { el.classList.remove('active'); });
        item.classList.add('active');
        moveIndicator(item);
        irAVista(item.getAttribute('data-view'));
    }

    items.forEach(function (item) {
        item.querySelector('.magic-link').addEventListener('click', function (e) {
            e.preventDefault();
            if (item.hasAttribute('data-perfil')) {
                if (item.classList.contains('es-salir')) {
                    if (typeof abrirModalSalir === 'function') abrirModalSalir();
                    return;
                }
                if (typeof requiereLogin === 'function' && !requiereLogin()) return;
            }
            activar(item);
        });
    });

    function refresh() {
        var active = list.querySelector('.magic-item.active') || items[0];
        moveIndicator(active);
    }

    window.addEventListener('resize', refresh);
    refresh();
}

/* Muestra una vista; si tiene item en la barra también mueve el indicador */
function irAVista(viewId, titulo) {
    var item = document.querySelector('.magic-item[data-view="' + viewId + '"]');

    document.querySelectorAll('.app-view').forEach(function (v) {
        v.classList.toggle('active', v.id === viewId);
    });

    var indicator = document.querySelector('.magic-indicator');
    if (item) {
        document.querySelectorAll('.magic-item').forEach(function (el) {
            el.classList.remove('active');
        });
        item.classList.add('active');
        if (_moverIndicador) _moverIndicador(item);
        if (indicator) indicator.style.opacity = '1';
        if (!titulo) titulo = item.getAttribute('data-title');
    } else {
        /* Vista sin item en la barra: nada activo y circulo oculto
           (no queda un circulo varado sobre la barra) */
        document.querySelectorAll('.magic-item').forEach(function (el) {
            el.classList.remove('active');
        });
        if (indicator) indicator.style.opacity = '0';
    }

    App.vistaActual = viewId;
    document.title = 'Emprende · ' + (titulo || '');
    if (typeof actualizarFab === 'function') actualizarFab(viewId);
    if (viewId === 'view-registro-emp' && typeof prepararFormEmp === 'function') {
        prepararFormEmp();
    }
}
