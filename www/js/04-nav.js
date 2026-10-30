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

    if (viewId === 'view-emprendimientos' && App.vistaActual !== viewId) {
        mezclarOrdenNegocios();
        App.paginaEmp = 0;
        renderEmprendimientos();
    }
    App.vistaActual = viewId;
    /* En el registro de emprendimiento el buscador no se muestra */
    var tb = document.querySelector('.topbar-buscar');
    if (tb) tb.hidden = (viewId === 'view-registro-emp' || viewId === 'view-emprendimiento' || viewId === 'view-contacto');
    var res = document.getElementById('resultados-global');
    if (res && (viewId === 'view-registro-emp' || viewId === 'view-emprendimiento' || viewId === 'view-contacto')) res.hidden = true;
    /* El placeholder del buscador refleja el motor de cada vista */
    var busc = document.getElementById('buscar-global');
    if (busc) {
        var ph = 'Busca negocio, categoría, contacto, teléfono o evento...';
        if (viewId === 'view-emprendimientos') ph = 'Busca emprendimiento...';
        if (viewId === 'view-directorio') ph = 'Busca contacto, negocio, teléfono o provincia...';
        if (viewId === 'view-notas') ph = 'Busca evento, etiqueta, lugar o contacto...';
        busc.placeholder = ph;
    }
    document.title = 'Emprende · ' + (titulo || '');
    if (typeof actualizarFab === 'function') actualizarFab(viewId);
    if (viewId === 'view-registro-emp' && typeof prepararFormEmp === 'function') {
        prepararFormEmp();
    }
}

/* FAB "+": solo en Ferias (nuevo evento) o dentro de una
   subcategoria de Inicio (registrar emprendimiento con esa categoria) */
function actualizarFab(viewId) {
    var fab = document.getElementById('main-fab');
    if (!fab) return;
    /* Al salir de Inicio la subcategoria ya no aplica: se limpia el flag */
    if (viewId !== 'view-inicio') App.subcatActiva = null;
    fab.hidden = !(viewId === 'view-notas' ||
        (viewId === 'view-inicio' && !!App.subcatActiva));
}

document.addEventListener('click', function (e) {
    var chip = e.target.closest('#view-inicio [data-cat], #view-inicio .cat-chip');
    if (chip) {
        App.subcatActiva = chip.dataset.cat || chip.textContent.trim();
        actualizarFab(App.vistaActual);
        return;
    }
    /* Tocar un grupo/titulo del acordeon vuelve a la raiz: se oculta el + */
    if (e.target.closest('#view-inicio .cat-titulo, #view-inicio .cat-grupo, #view-inicio [data-grupo]')) {
        App.subcatActiva = null;
        actualizarFab(App.vistaActual);
    }
});
