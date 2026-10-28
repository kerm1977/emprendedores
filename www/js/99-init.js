/* 99-init.js - Arranque de la app */

document.addEventListener('DOMContentLoaded', async function () {
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
        App.filtroCategoria = '';
        renderEmprendimientos();
    });

    /* Clics en tarjetas de emprendimiento = "consultas" para Destacados */
    ['lista-emprendimientos', 'home-destacados'].forEach(function (id) {
        document.getElementById(id).addEventListener('click', function (e) {
            var card = e.target.closest('.emprend-card');
            if (card) {
                if (e.target.closest('.emp-fav')) {
                    if (typeof toggleDestacado === 'function') {
                        toggleDestacado(card.dataset.id);
                    }
                } else if (e.target.closest('.emp-qr')) {
                    if (typeof mostrarQR === 'function') mostrarQR(card.dataset.id);
                } else if (e.target.closest('.emp-dl')) {
                    if (typeof descargarTarjeta === 'function') {
                        descargarTarjeta(card.dataset.id);
                    }
                } else {
                    registrarClic(card.dataset.id);
                }
            }
        });
    });

    /* Tocar un contacto abre su detalle (llamar / WhatsApp) */
    document.getElementById('lista-directorio').addEventListener('click', function (e) {
        var item = e.target.closest('.contacto-item');
        if (item && typeof verContacto === 'function') verContacto(item.dataset.id);
    });

    /* Botones de sincronización */
    document.getElementById('btn-sync-ahora').addEventListener('click', syncAhora);

    /* Ajustes: usuarios y sesión */
    document.getElementById('btn-usuarios').addEventListener('click', function () {
        renderVistaUsuarios();
        irAVista('view-usuarios', 'Usuarios');
        cargarUsuarios();
    });
    document.getElementById('btn-logout').addEventListener('click', function () {
        if (sesion) cerrarSesion();
        else mostrarLogin();
    });

    /* FAB: registrar emprendimiento requiere cuenta */
    var registrarEmp = function () {
        if (requiereLogin()) {
            irAVista('view-registro-emp', 'Registrar');
        }
    };
    document.getElementById('main-fab').addEventListener('click', registrarEmp);
    var btnAnuncio = document.getElementById('btn-anunciate');
    if (btnAnuncio) btnAnuncio.addEventListener('click', registrarEmp);

    /* Estado de conexión */
    window.addEventListener('online', syncDesdeServidor);
    window.addEventListener('offline', function () {
        marcarSync('off');
        showToast('Modo offline');
    });

    /* Sesión opcional: la app es pública, solo restaura la sesión */
    if (typeof initPerfil === 'function') await initPerfil();
    if (typeof initEmprendimientos === 'function') await initEmprendimientos();
    await initAuth();

    /* Service worker para offline-first */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(function () {});
    }
});
