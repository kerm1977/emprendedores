/* 18-qr.js - Codigo QR por emprendimiento (QRious vendored).
   El codigo no se muestra en la tarjeta, solo el icono. */


function generarQRToken() {
    return 'EMPRENDE:' + Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8);
}

async function guardarEmprendimiento(e) {
    e.preventDefault();
    var u = typeof usuarioActual === 'function' ? usuarioActual() : null;
    var emp = {
        id: 'emp-' + Date.now(),
        nombre: document.getElementById('emp-nombre').value.trim(),
        categoria: document.getElementById('emp-categoria').value,
        logo: await subirLogo(App._empLogoTmp, 'emp-' + Date.now()),
        telefono: document.getElementById('emp-telefono').value.trim(),
        telefono2: document.getElementById('emp-telefono2').value.trim(),
        email: document.getElementById('emp-email').value.trim(),
        contacto: document.getElementById('emp-contacto').value.trim(),
        whatsapp: document.getElementById('emp-whatsapp').value.trim(),
        lat: document.getElementById('emp-lat').value,
        lng: document.getElementById('emp-lng').value,
        provincia: document.getElementById('emp-provincia').value.trim(),
        canton: document.getElementById('emp-canton').value.trim(),
        distrito: document.getElementById('emp-distrito').value.trim(),
        lugar: document.getElementById('emp-lugar').value.trim(),
        horario: horarioTexto(),
        agenda: agendaSeleccionada(),
        facebook: document.getElementById('emp-facebook').value.trim(),
        tiktok: document.getElementById('emp-tiktok').value.trim(),
        instagram: document.getElementById('emp-instagram').value.trim(),
        telegram: document.getElementById('emp-telegram').value.trim(),
        maps: document.getElementById('emp-maps').value.trim(),
        waze: document.getElementById('emp-waze').value.trim(),
        pluses: plusesSeleccionados(),
        desc: document.getElementById('emp-desc').value.trim(),
        estado: 'nuevo',
        clics: 0,
        qr: generarQRToken(),
        owner: u ? u.email : ''
    };
    if (!emp.nombre || !emp.categoria) {
        showToast('Completa nombre y categoría');
        return;
    }
    if (!emp.provincia) {
        showToast('Elegí la provincia del emprendimiento');
        return;
    }
    App.data.emprendimientos = App.data.emprendimientos || [];
    App.data.emprendimientos.push(emp);

    /* El directorio guarda: emprendimiento, contacto y WhatsApp */
    var nombreContacto = emp.contacto ||
        (u ? ((u.nombre || '') + ' ' + (u.apellido || '')).trim() : '');
    App.data.emprendedores = App.data.emprendedores || [];
    App.data.emprendedores.push({
        id: 'con-' + Date.now(),
        nombre: nombreContacto || emp.nombre,
        emprendimiento: emp.nombre,
        telefono: emp.whatsapp || emp.telefono,
        whatsapp: !!emp.whatsapp,
        empId: emp.id
    });
    await saveData();
    e.target.reset();
    renderTodo();
    showToast('Emprendimiento registrado');
    /* Descarga automatica de la tarjeta digital al registrar */
    if (typeof descargarTarjeta === 'function') {
        descargarTarjeta(emp.id);
    }
    /* Abre el detalle del emprendimiento recien creado:
       contacto, horario, pluses, mapa, QR y tarjeta */
    if (typeof verEmprendimiento === 'function') {
        verEmprendimiento(emp.id);
    } else {
        irAVista('view-emprendimientos', 'Negocios');
    }
    /* Paso 8: contrasena opcional -> intenta crear la cuenta en
       segundo plano con timeout; NUNCA bloquea el registro */
    var pass = (document.getElementById('emp-pass') || {}).value || '';
    var pass2 = (document.getElementById('emp-pass2') || {}).value || '';
    if (pass || pass2) {
        if (pass !== pass2 || pass.length < 6) {
            showToast(pass.length < 6
                ? 'Contraseña mínimo 6 caracteres'
                : 'Las contraseñas no coinciden');
        } else {
            crearCuentaFondo(emp, pass);
        }
    }
}

/* Crea la cuenta en segundo plano; si no hay servidor no pasa nada */
async function crearCuentaFondo(emp, pass) {
    if (!emp.email) return;
    try {
        var ctrl = new AbortController();
        var t = setTimeout(function () { ctrl.abort(); }, 8000);
        var res = await fetch(apiUrl('/api/auth/register'), {
            method: 'POST', signal: ctrl.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: emp.contacto || emp.nombre,
                email: emp.email, telefono: emp.telefono,
                password: pass
            })
        });
        clearTimeout(t);
        var d = await res.json();
        if (d.ok && typeof intentarLogin === 'function') {
            var lr = await intentarLogin(emp.email, pass);
            if (lr.ok) showToast('Cuenta creada: ya podés editar');
        } else if (d.error) {
            showToast(d.error);
        }
    } catch (e) {
        /* sin servidor: el emprendimiento quedo guardado igual */
    }
}

/* QR del emprendimiento: dibuja en el modal con QRious */
function mostrarQR(id) {
    var emp = (App.data.emprendimientos || []).find(function (x) {
        return String(x.id) === String(id);
    });
    if (!emp) return;
    var modal = document.getElementById('modal-qr');
    var canvas = document.getElementById('qr-canvas');
    var nombre = document.getElementById('qr-nombre');
    if (!modal || !canvas) return;
    var contenido = emp.qr ||
        'EMPRENDEDORES|' + (emp.nombre || '') + '|' + (emp.telefono || '');
    if (typeof QRious !== 'undefined') {
        new QRious({ element: canvas, value: contenido, size: 220 });
    }
    if (nombre) nombre.textContent = emp.nombre || '';
    modal.hidden = false;
}

function cerrarQR() {
    var modal = document.getElementById('modal-qr');
    if (modal) modal.hidden = true;
}

/* Sube el logo comprimido a uploads/ en el servidor; si no hay
   red, queda el base64 local como respaldo */
async function subirLogo(b64, empId) {
    if (!b64) return '';
    try {
        var res = await fetch(apiUrl('/api/uploads'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: empId, data: b64 })
        });
        if (res.ok) {
            var d = await res.json();
            if (d && d.url) return d.url;
        }
    } catch (e) {}
    return b64; /* respaldo local si el servidor no responde */
}
