/* 08-usuarios.js - CRUD de usuarios registrados (Ajustes > Usuarios) */

function renderVistaUsuarios() {
    var v = document.getElementById('view-usuarios');
    if (!v || v.dataset.listo) return;
    v.dataset.listo = '1';
    v.innerHTML = '' +
        '<div class="vista-encabezado">' +
            '<button type="button" class="super-btn" id="u-volver"><i class="fas fa-arrow-left"></i></button>' +
            '<h3 class="section-title mb-0">Usuarios</h3>' +
            '<button type="button" class="filtro-chip" id="u-nuevo">+ Nuevo</button>' +
        '</div>' +
        '<form id="u-form" class="login-form mb-3" hidden autocomplete="off">' +
            '<input type="hidden" id="u-id">' +
            '<div class="login-fila">' +
                '<label class="login-label">Nombre<input class="login-input" id="u-nombre" required></label>' +
                '<label class="login-label">Apellido<input class="login-input" id="u-apellido"></label>' +
            '</div>' +
            '<div class="login-fila">' +
                '<label class="login-label">Teléfono<input class="login-input" id="u-tel"></label>' +
                '<label class="login-label">Cédula<input class="login-input" id="u-ced"></label>' +
            '</div>' +
            '<label class="login-label">Correo<input class="login-input" id="u-email" type="email" required></label>' +
            '<label class="login-label">Contraseña<input class="login-input" id="u-pass" type="password" placeholder="Vacío = sin cambios"></label>' +
            '<p class="login-error" id="u-error"></p>' +
            '<div class="login-fila">' +
                '<button type="submit" class="btn-login">Guardar</button>' +
                '<button type="button" class="super-btn" id="u-cancelar">Cancelar</button>' +
            '</div>' +
        '</form>' +
        '<div id="lista-usuarios" class="cards-grid"></div>';
    wireUsuarios();
}

var _usuariosCache = [];

async function cargarUsuarios() {
    var box = document.getElementById('lista-usuarios');
    try {
        var res = await fetch('/api/usuarios');
        var data = await res.json();
        _usuariosCache = data.usuarios || [];
        box.innerHTML = _usuariosCache.length
            ? _usuariosCache.map(filaUsuario).join('')
            : '<div class="vacio"><i class="fas fa-users"></i>Sin usuarios</div>';
        wireUsuariosItems(box);
    } catch (e) {
        box.innerHTML = '<div class="vacio"><i class="fas fa-cloud-slash"></i>Sin conexión</div>';
    }
}

function filaUsuario(u) {
    var esSuper = u.rol === 'super';
    return '' +
        '<div class="contacto-item" data-id="' + u.id + '">' +
            '<div class="contacto-avatar">' + inicial(u.nombre) + '</div>' +
            '<div class="contacto-info">' +
                '<div class="contacto-nombre">' + escapeHtml(u.nombre) + ' ' + escapeHtml(u.apellido || '') +
                    (esSuper ? ' <span class="emprend-badge estado-destacado">Super</span>' : '') +
                '</div>' +
                '<div class="contacto-tel">' + escapeHtml(u.email) +
                    (u.telefono ? ' · ' + escapeHtml(u.telefono) : '') + '</div>' +
            '</div>' +
            (esSuper ? '' :
                '<button type="button" class="super-btn u-editar" title="Editar"><i class="fas fa-pen"></i></button>' +
                '<button type="button" class="super-btn peligro u-borrar" title="Eliminar"><i class="fas fa-trash"></i></button>') +
        '</div>';
}

function wireUsuariosItems(box) {
    box.querySelectorAll('.u-editar').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = btn.closest('.contacto-item').dataset.id;
            editarUsuario(id);
        });
    });
    box.querySelectorAll('.u-borrar').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = btn.closest('.contacto-item').dataset.id;
            borrarUsuario(id);
        });
    });
}

async function editarUsuario(id) {
    var u = _usuariosCache.find(function (x) { return String(x.id) === String(id); });
    if (!u) return;
    var f = document.getElementById('u-form');
    f.hidden = false;
    document.getElementById('u-id').value = u.id;
    document.getElementById('u-nombre').value = u.nombre;
    document.getElementById('u-apellido').value = u.apellido || '';
    document.getElementById('u-email').value = u.email;
    document.getElementById('u-tel').value = u.telefono || '';
    document.getElementById('u-ced').value = u.cedula || '';
    document.getElementById('u-pass').value = '';
    f.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function borrarUsuario(id) {
    var r = await fetch('/api/usuarios/' + id, { method: 'DELETE' });
    var data = await r.json();
    if (data.ok) {
        showToast('Usuario eliminado');
        cargarUsuarios();
    } else {
        showToast(data.error || 'No se pudo eliminar');
    }
}

function wireUsuarios() {
    document.getElementById('u-volver').addEventListener('click', function () {
        irAVista('view-ajustes');
    });
    document.getElementById('u-nuevo').addEventListener('click', function () {
        var f = document.getElementById('u-form');
        f.hidden = false;
        f.reset();
        document.getElementById('u-id').value = '';
    });
    document.getElementById('u-cancelar').addEventListener('click', function () {
        document.getElementById('u-form').hidden = true;
    });
    document.getElementById('u-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        var err = document.getElementById('u-error');
        err.textContent = '';
        var id = document.getElementById('u-id').value;
        var payload = {
            nombre: document.getElementById('u-nombre').value,
            apellido: document.getElementById('u-apellido').value,
            email: document.getElementById('u-email').value,
            telefono: document.getElementById('u-tel').value,
            cedula: document.getElementById('u-ced').value,
            password: document.getElementById('u-pass').value
        };
        try {
            var res = await fetch(id ? '/api/usuarios/' + id : '/api/auth/register', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            var data = await res.json();
            if (!res.ok) { err.textContent = data.error; return; }
            showToast(id ? 'Usuario actualizado' : 'Usuario creado');
            document.getElementById('u-form').hidden = true;
            cargarUsuarios();
        } catch (e2) {
            err.textContent = 'Sin conexión con el servidor';
        }
    });
}
