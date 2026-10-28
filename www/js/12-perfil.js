/* 12-perfil.js - Vista Perfil del usuario + modal de cierre de sesion.
   El avatar redondo del topbar abre la vista; el item de la barra
   cambia a "Salir" cuando hay sesion activa. */

function setTexto(id, t) {
    var el = document.getElementById(id);
    if (el) el.textContent = t;
}

function renderPerfil() {
    var u = typeof usuarioActual === 'function' ? usuarioActual() : null;
    if (!u) return;
    setTexto('perfil-nombre', ((u.nombre || '') + ' ' + (u.apellido || '')).trim() || 'Usuario');
    setTexto('perfil-rol', u.rol === 'super' ? 'Superusuario' : 'Emprendedor');
    setTexto('perfil-email', u.email || '—');
    setTexto('perfil-telefono', u.telefono || 'Sin teléfono');
    setTexto('perfil-cedula', u.cedula || 'Sin cédula');
}

function abrirModalSalir() {
    var m = document.getElementById('modal-salir');
    if (m) m.hidden = false;
}

function cerrarModalSalir() {
    var m = document.getElementById('modal-salir');
    if (m) m.hidden = true;
}

/* Perfil ↔ Salir en la barra segun el estado de sesion */
function actualizarNavSesion() {
    var item = document.querySelector('.magic-item[data-perfil]');
    var avatar = document.getElementById('perfil-top');
    var u = typeof usuarioActual === 'function' ? usuarioActual() : null;
    var logueado = !!u;
    var btnAjustes = document.getElementById('btn-ajustes-perfil');
    if (btnAjustes) btnAjustes.hidden = !(u && u.rol === 'super');
    if (item) {
        var icono = item.querySelector('.magic-icon i');
        var texto = item.querySelector('.magic-text');
        item.classList.toggle('es-salir', logueado);
        if (icono) icono.className = 'fas ' + (logueado ? 'fa-right-from-bracket' : 'fa-user');
        if (texto) texto.textContent = logueado ? 'Salir' : 'Perfil';
    }
    if (avatar) avatar.hidden = !logueado;
    if (logueado) renderPerfil();
}

async function initPerfil() {
    var vista, modal;
    try {
        var res = await fetch('parciales/perfil.html');
        var tmp = document.createElement('div');
        tmp.innerHTML = await res.text();
        vista = tmp.querySelector('#view-perfil');
        modal = tmp.querySelector('#modal-salir');
    } catch (e) {
        return;
    }
    var main = document.querySelector('.app-main');
    if (vista && main) main.appendChild(vista);
    if (modal) document.body.appendChild(modal);

    var avatar = document.getElementById('perfil-top');
    if (avatar) {
        avatar.addEventListener('click', function () {
            renderPerfil();
            irAVista('view-perfil', 'Perfil');
        });
    }
    var btnAjustes = document.getElementById('btn-ajustes-perfil');
    if (btnAjustes) {
        btnAjustes.addEventListener('click', function () {
            irAVista('view-ajustes', 'Ajustes');
        });
    }
    var btnPerfil = document.getElementById('btn-salir-perfil');
    if (btnPerfil) btnPerfil.addEventListener('click', abrirModalSalir);
    var btnCancel = document.getElementById('btn-cancelar-salir');
    if (btnCancel) btnCancel.addEventListener('click', cerrarModalSalir);
    var btnOk = document.getElementById('btn-confirmar-salir');
    if (btnOk) {
        btnOk.addEventListener('click', async function () {
            cerrarModalSalir();
            if (typeof cerrarSesion === 'function') await cerrarSesion();
            irAVista('view-inicio', 'Inicio');
        });
    }
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) cerrarModalSalir();
        });
    }
}
