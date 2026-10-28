/* 09-emergencia.js - Acceso de emergencia: verificar codigo y gestionar
   superusuarios (reset forzado de clave / eliminacion). */

var _codigoEmergencia = '';

function wireEmergencia() {
    document.getElementById('emergencia-verificar').addEventListener('click', async function () {
        var err = document.getElementById('emergencia-error');
        err.textContent = '';
        _codigoEmergencia = document.getElementById('emergencia-codigo').value.trim();
        try {
            var res = await fetch('/api/emergency/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: _codigoEmergencia })
            });
            var data = await res.json();
            if (!res.ok) { err.textContent = data.error; return; }
            renderSupers(data.superusers);
        } catch (e) {
            err.textContent = 'Sin conexión con el servidor';
        }
    });
}

function renderSupers(supers) {
    var box = document.getElementById('emergencia-supers');
    box.hidden = false;
    if (!supers.length) {
        box.innerHTML = '<p class="login-error">No quedan superusuarios.</p>';
        return;
    }
    box.innerHTML = supers.map(function (s) {
        return '' +
            '<div class="super-row" data-email="' + escapeHtml(s.email) + '">' +
                '<span class="super-email">' + escapeHtml(s.email) + '</span>' +
                '<button type="button" class="super-btn" data-accion="reset">Nueva clave</button>' +
                '<button type="button" class="super-btn peligro" data-accion="borrar">Eliminar</button>' +
            '</div>' +
            '<div class="super-reset" data-reset="' + escapeHtml(s.email) + '" hidden>' +
                '<input type="password" class="login-input" placeholder="Nueva contraseña">' +
                '<button type="button" class="btn-login btn-sm">Guardar</button>' +
            '</div>';
    }).join('');

    box.querySelectorAll('.super-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var email = btn.closest('.super-row').dataset.email;
            if (btn.dataset.accion === 'borrar') borrarSuper(email);
            else mostrarReset(email, btn.closest('.super-row'));
        });
    });
    box.querySelectorAll('.super-reset .btn-login').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var wrap = btn.closest('.super-reset');
            guardarReset(wrap.dataset.reset, wrap.querySelector('input').value);
        });
    });
}

function mostrarReset(email, row) {
    var panel = row.parentElement.querySelector('[data-reset="' + email + '"]');
    panel.hidden = !panel.hidden;
}

async function emergenciaPost(ruta, extra) {
    var res = await fetch('/api/emergency/' + ruta, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ code: _codigoEmergencia }, extra))
    });
    return res.json();
}

async function guardarReset(email, nuevaPass) {
    var err = document.getElementById('emergencia-error');
    err.textContent = '';
    if (!nuevaPass) { err.textContent = 'Escribe la nueva contraseña'; return; }
    var data = await emergenciaPost('reset', { email: email, password: nuevaPass });
    if (data.ok) showToast('Contraseña actualizada: ' + email);
    else err.textContent = data.error || 'Error';
}

async function borrarSuper(email) {
    var err = document.getElementById('emergencia-error');
    err.textContent = '';
    var data = await emergenciaPost('delete', { email: email });
    if (data.ok) {
        showToast('Superusuario eliminado: ' + email);
        var row = document.querySelector('.super-row[data-email="' + email + '"]');
        var reset = document.querySelector('[data-reset="' + email + '"]');
        if (row) row.remove();
        if (reset) reset.remove();
    } else {
        err.textContent = data.error || 'Error';
    }
}
