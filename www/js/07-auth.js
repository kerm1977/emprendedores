/* 07-auth.js - Sesion opcional: login online + offline (bcryptjs),
   registro de usuarios. La app es publica; el login solo se pide
   para registrar un emprendimiento o administrar. */

var SESION_KEY = 'emprende-session';
var LASTLOGIN_KEY = 'emprende-lastlogin';
var sesion = null;

function usuarioActual() {
    return sesion ? sesion.user : null;
}

async function initAuth() {
    sesion = await localforage.getItem(SESION_KEY);
    actualizarSesionUI();
}

/* Refleja el estado de sesion en Ajustes */
function actualizarSesionUI() {
    var u = usuarioActual();
    var sub = document.getElementById('sesion-usuario');
    if (sub) sub.textContent = u ? u.email : 'Invitado';
    var btn = document.getElementById('btn-logout');
    if (!btn) return;
    var titulo = btn.querySelector('.ajuste-titulo');
    if (titulo) titulo.textContent = u ? 'Cerrar sesión' : 'Iniciar sesión';
    var icono = btn.querySelector('.ajuste-icono');
    if (icono) {
        icono.className = 'fas ajuste-icono ' +
            (u ? 'fa-right-from-bracket' : 'fa-right-to-bracket');
    }
    if (typeof actualizarNavSesion === 'function') actualizarNavSesion();
}

/* true si hay sesion; si no, abre el login y devuelve false */
function requiereLogin() {
    if (sesion) return true;
    mostrarLogin();
    return false;
}

/* ============ Pantalla de login ============ */

async function mostrarLogin() {
    var root = document.getElementById('login-root');
    if (!root.dataset.cargado) {
        try {
            var res = await fetch('parciales/login.html');
            root.innerHTML = await res.text();
        } catch (e) {
            showToast('Sin conexión');
            return;
        }
        root.dataset.cargado = '1';
        wireLogin();
    }
    document.getElementById('login-overlay').classList.add('visible');
}

function ocultarLogin() {
    var ov = document.getElementById('login-overlay');
    if (ov) ov.classList.remove('visible');
}

async function cerrarSesion() {
    sesion = null;
    await localforage.removeItem(SESION_KEY);
    actualizarSesionUI();
    showToast('Sesión cerrada');
}

/* ============ Login ============ */

async function intentarLogin(email, pass) {
    try {
        var res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: pass })
        });
        var data = await res.json();
        if (!res.ok) return { ok: false, error: data.error || 'Error de acceso' };
        await guardarSesion(data.user, data.pass_hash);
        return { ok: true };
    } catch (e) {
        return loginOffline(email, pass);
    }
}

/* Offline: valida contra el ultimo hash bcrypt cacheado (bcrypt.js) */
async function loginOffline(email, pass) {
    var last = await localforage.getItem(LASTLOGIN_KEY);
    if (!last || last.user.email !== email) {
        return { ok: false, error: 'Sin conexión y sin credenciales locales' };
    }
    try {
        if (dcodeIO.bcrypt.compareSync(pass, last.pass_hash)) {
            sesion = { user: last.user, pass_hash: last.pass_hash, offline: true };
            await localforage.setItem(SESION_KEY, sesion);
            return { ok: true, offline: true };
        }
    } catch (e) {}
    return { ok: false, error: 'Correo o contraseña incorrectos' };
}

async function guardarSesion(user, passHash) {
    sesion = { user: user, pass_hash: passHash };
    await localforage.setItem(SESION_KEY, sesion);
    await localforage.setItem(LASTLOGIN_KEY, { user: user, pass_hash: passHash });
    actualizarSesionUI();
}

/* ============ Wiring de la pantalla ============ */

function wireLogin() {
    document.querySelectorAll('.login-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.login-tab').forEach(function (t) {
                t.classList.toggle('active', t === tab);
            });
            var reg = tab.dataset.tab === 'registro';
            document.getElementById('form-login').hidden = reg;
            document.getElementById('form-registro').hidden = !reg;
        });
    });

    document.getElementById('login-cerrar').addEventListener('click', ocultarLogin);

    /* X superior y toque fuera del cuadro: cierran y vuelven a Inicio */
    var volverInicio = function () {
        ocultarLogin();
        irAVista('view-inicio', 'Inicio');
    };
    var bx = document.getElementById('login-x');
    if (bx) bx.addEventListener('click', volverInicio);
    var ov = document.getElementById('login-overlay');
    if (ov) {
        ov.addEventListener('click', function (e) {
            if (e.target === ov) volverInicio();
        });
    }

    /* Ojitos para mostrar/ocultar contraseña */
    document.querySelectorAll('.pass-ojo').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var input = document.getElementById(btn.dataset.ojo);
            var icono = btn.querySelector('i');
            var ver = input.type === 'password';
            input.type = ver ? 'text' : 'password';
            icono.className = ver ? 'fas fa-eye-slash' : 'fas fa-eye';
            btn.classList.toggle('activo', ver);
        });
    });

    document.getElementById('form-login').addEventListener('submit', async function (e) {
        e.preventDefault();
        var err = document.getElementById('login-error');
        err.textContent = '';
        var r = await intentarLogin(
            document.getElementById('login-email').value.trim(),
            document.getElementById('login-pass').value
        );
        if (r.ok) {
            ocultarLogin();
            showToast('Bienvenido ' + (sesion.user.nombre || '') + (r.offline ? ' (offline)' : ''));
        } else {
            err.textContent = r.error;
        }
    });

    document.getElementById('form-registro').addEventListener('submit', registrarUsuario);
    document.getElementById('emergencia-toggle').addEventListener('click', function () {
        var p = document.getElementById('emergencia-panel');
        p.hidden = !p.hidden;
    });
    wireEmergencia();
}

async function registrarUsuario(e) {
    e.preventDefault();
    var err = document.getElementById('reg-error');
    err.textContent = '';
    var pass = document.getElementById('reg-pass').value;
    var pass2 = document.getElementById('reg-pass2').value;
    if (pass !== pass2) {
        err.textContent = 'Las contraseñas no coinciden';
        return;
    }
    try {
        var res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: document.getElementById('reg-nombre').value,
                apellido: document.getElementById('reg-apellido').value,
                email: document.getElementById('reg-email').value,
                telefono: document.getElementById('reg-telefono').value,
                cedula: document.getElementById('reg-cedula').value,
                password: pass
            })
        });
        var data = await res.json();
        if (!res.ok) { err.textContent = data.error; return; }
        showToast(data.merged
            ? 'Cuenta vinculada: tus registros quedaron unidos'
            : 'Cuenta creada, ya puedes ingresar');
        document.querySelector('.login-tab[data-tab="ingresar"]').click();
        document.getElementById('login-email').value = data.user.email;
    } catch (e2) {
        err.textContent = 'Sin conexión con el servidor';
    }
}
