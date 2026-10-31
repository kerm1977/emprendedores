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
    if (tb) tb.hidden = (viewId === 'view-registro-emp' || viewId === 'view-emprendimiento' || viewId === 'view-contacto' || viewId === 'view-reporte-sitio' || viewId === 'view-nube');
    var res = document.getElementById('resultados-global');
    if (res && (viewId === 'view-registro-emp' || viewId === 'view-emprendimiento' || viewId === 'view-contacto' || viewId === 'view-reporte-sitio' || viewId === 'view-nube')) res.hidden = true;
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
    /* Al salir de Inicio se limpia la subcategoria y se cierra el
       acordeon: al volver todas las categorias se ven normales,
       sin enfoque gris ni grupo abierto. */
    if (viewId !== 'view-inicio') {
        App.subcatActiva = null;
        var cats = document.getElementById('home-categorias');
        if (cats) {
            cats.classList.remove('cats-enfoque');
            cats.querySelectorAll('.cat-chips').forEach(function (c) { c.hidden = true; });
            cats.querySelectorAll('.cat-grupo-titulo').forEach(function (t) { t.classList.remove('abierto'); });
        }
    }
    fab.hidden = !(viewId === 'view-notas' ||
        (viewId === 'view-inicio' && !!App.subcatActiva));
    /* Boton flotante de volver (izquierda, sobre la barra): en los
       formularios sin retorno directo vuelve al Perfil del usuario */
    var volver = document.getElementById('fab-volver');
    if (!volver) {
        volver = document.createElement('button');
        volver.type = 'button';
        volver.id = 'fab-volver';
        volver.innerHTML = '<i class="fas fa-arrow-left"></i>';
        volver.title = 'Volver a mi perfil';
        volver.setAttribute('style', 'position:fixed;left:16px;bottom:121px;z-index:99999;width:52px;height:52px;border-radius:50%;border:none;background:var(--primary-color);color:#fff;font-size:1.1rem;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer');
        volver.onclick = function () { irAVista('view-perfil', 'Perfil'); };
        document.body.appendChild(volver);
    }
    volver.hidden = viewId !== 'view-registro-emp';
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

/* Swipe entre pestañas principales (orden del usuario): arrastrar de
   derecha a izquierda avanza Inicio->Negocios->Directorio...; el
   sentido contrario retrocede. No dispara sobre carruseles. */
(function () {
    var x0 = 0, y0 = 0, t0 = 0;
    var enZonaScroll = function (el) {
        return !!(el && el.closest('.promo-carrusel, [style*="overflow-x"], .det-acciones-pie'));
    };
    document.addEventListener('touchstart', function (ev) {
        if (ev.touches.length !== 1 || enZonaScroll(ev.target)) { x0 = 0; return; }
        x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; t0 = Date.now();
    }, { passive: true });
    document.addEventListener('touchend', function (ev) {
        if (!x0 || Date.now() - t0 > 600) { x0 = 0; return; }
        var dx = ev.changedTouches[0].clientX - x0;
        var dy = ev.changedTouches[0].clientY - y0;
        x0 = 0;
        if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
        var vistas = ['view-inicio', 'view-emprendimientos',
            'view-directorio', 'view-eventos'];
        var items = Array.prototype.slice.call(
            document.querySelectorAll('.magic-item[data-view]'))
            .filter(function (li) {
                return vistas.indexOf(li.dataset.view) !== -1; });
        var idx = items.findIndex(function (li) {
            return li.dataset.view === App.vistaActual; });
        if (idx === -1) return;
        var siguiente = idx + (dx < 0 ? 1 : -1);
        if (siguiente < 0 || siguiente >= items.length) return;
        var li = items[siguiente];
        irAVista(li.dataset.view, li.dataset.title);
    }, { passive: true });
})();
