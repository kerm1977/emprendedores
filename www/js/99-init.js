/* BLINDADO (orden del usuario): prohibido modificar/eliminar
   sin orden explicita. Pedir permiso antes de tocar. */
/* 99-init.js - Arranque de la app */

document.addEventListener('DOMContentLoaded', async function () {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(function () {});
    }
    initNav();
    initTema();

    /* Saludo y fecha del hero */
    var hora = new Date().getHours();
    var saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
    document.getElementById('hero-saludo').textContent = saludo;
    document.getElementById('hero-fecha').textContent =
        new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' });

    /* Datos offline-first */
    await loadData();
    renderTodo();
    renderCategorias();

    /* Buscadores: global (bajo el logo) y del directorio */
    initBuscador();
    document.getElementById('buscar-contacto').addEventListener('input', function (e) {
        renderDirectorio(e.target.value);
    });

    /* Chip para limpiar el filtro de categoría en Negocios */
    document.getElementById('filtro-activo').addEventListener('click', function () {
        App.paginaEmp = 0;
        App.filtroCategoria = '';
        App.paginaEmp = 0;
        renderEmprendimientos();
    });

    /* Clics en tarjetas de emprendimiento = "consultas" para Destacados */
    ['lista-emprendimientos', 'home-destacados'].forEach(function (id) {
        document.getElementById(id).addEventListener('click', function (e) {
            var card = e.target.closest('.emprend-card');
            if (card) {
                if (e.target.closest('.emp-like, .rep-btn')) return;
                if (e.target.closest('.emp-fav')) {
                    if (typeof toggleDestacado === 'function') {
                        toggleDestacado(card.dataset.id);
                    }
                } else if (e.target.closest('.emp-dl')) {
                    if (typeof descargarTarjeta === 'function') {
                        descargarTarjeta(card.dataset.id);
                    }
                } else {
                    registrarClic(card.dataset.id);
                    if (typeof verEmprendimiento === 'function') {
                        verEmprendimiento(card.dataset.id);
                    }
                }
            }
        });
    });

    /* Enlaces externos (Maps, Waze, redes): se abren fuera,
       sin que la app abandone la vista */
    document.addEventListener('click', function (e) {
        var a = e.target.closest('a[href^="http"]');
        if (!a) return;
        e.preventDefault();
        try {
            window.open(a.href, '_system');
        } catch (err) {
            window.open(a.href, '_blank');
        }
    });

    /* Tocar un contacto abre su detalle (llamar / WhatsApp) */
    document.getElementById('lista-directorio').addEventListener('click', function (e) {
        var item = e.target.closest('.contacto-item');
        if (item && typeof verContacto === 'function') verContacto(item.dataset.id);
    });

    /* Ajustes carga async (parcial): delegar en document */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('#btn-sync-ahora, #btn-usuarios, #btn-logout');
        if (!btn) return;
        if (btn.id === 'btn-sync-ahora' && typeof syncAhora === 'function') {
            syncAhora();
        } else if (btn.id === 'btn-usuarios') {
            renderVistaUsuarios();
            irAVista('view-usuarios', 'Usuarios');
            cargarUsuarios();
        } else if (btn.id === 'btn-logout') {
            if (sesion) cerrarSesion();
            else mostrarLogin();
        }
    });

    /* FAB: registrar emprendimiento requiere cuenta */
    /* Anúnciate es público: cualquiera registra sin login */
    var btnAnuncio = document.getElementById('btn-anunciate');
    if (btnAnuncio) {
        btnAnuncio.addEventListener('click', function () {
            irAVista('view-registro-emp', 'Registrar');
        });
    }
    /* El FAB: en Ferias agrega feria, en Perfil registra emprendimiento */
    document.getElementById('main-fab').addEventListener('click', function () {
        if (App.vistaActual === 'view-notas') {
            prepararNuevoEvento().catch(function (error) { showToast(error.message); });
        } else if (requiereLogin()) {
            if (App.vistaActual === 'view-inicio' && App.subcatActiva) {
                App._regCategoria = App.subcatActiva;
                setTimeout(function () {
                    var cat = document.querySelector('[data-cat="' + App._regCategoria + '"], [data-categoria="' + App._regCategoria + '"]');
                    if (cat) cat.click();
                }, 400);
            }
            irAVista('view-registro-emp', 'Registrar');
        }
    });

    /* Estado de conexión */
    window.addEventListener('online', syncDesdeServidor);
    window.addEventListener('offline', function () {
        marcarSync('off');
        showToast('Modo offline');
    });

    /* Sesión opcional: la app es pública, solo restaura la sesión */
    /* Inits en paralelo: cada parcial carga al mismo tiempo,
       y si uno falla los demas siguen vivos */
    var parciales = [
        typeof initPerfil === 'function' ? initPerfil : null,
        typeof initEmprendimientos === 'function' ? initEmprendimientos : null,
        typeof initFerias === 'function' ? initFerias : null,
        typeof initEditar === 'function' ? initEditar : null
    ].filter(Boolean).map(function (f) {
        return f().catch(function () { /* init aislado */ });
    });
    await Promise.all(parciales);
    try { await initAuth(); } catch (e) { /* auth aislado */ }
    /* Socket.io desactivado hasta que el servidor lo soporte */
    /* if (typeof initSocket === 'function') initSocket(); */

    /* Service worker para offline-first */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(function () {});
    }
});
