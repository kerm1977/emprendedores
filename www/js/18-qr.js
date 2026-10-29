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
        telefono: document.getElementById('emp-telefono').value.trim(),
        telefono2: document.getElementById('emp-telefono2').value.trim(),
        email: document.getElementById('emp-email').value.trim(),
        contacto: document.getElementById('emp-contacto').value.trim(),
        whatsapp: document.getElementById('emp-whatsapp').value.trim(),
        lat: document.getElementById('emp-lat').value,
        lng: document.getElementById('emp-lng').value,
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
    irAVista('view-emprendimientos', 'Negocios');
}

/* FAB: en Perfil con sesion (registrar emprendimiento) y en Ferias */
function actualizarFab(viewId) {
    var fab = document.getElementById('main-fab');
    if (!fab) return;
    var logueado = typeof usuarioActual === 'function' && !!usuarioActual();
    fab.hidden = !((viewId === 'view-perfil' && logueado) ||
                   viewId === 'view-notas');
}

/* QR: se genera al registrar; el icono abre el visor para escanear */
async function mostrarQR(id) {
    var emp = (App.data.emprendimientos || []).find(function (x) {
        return String(x.id) === String(id);
    });
    if (!emp) return;
    if (!emp.qr) {
        emp.qr = generarQRToken();
        await saveData();
    }
    var canvas = document.getElementById('qr-canvas');
    if (canvas && typeof QRious === 'function') {
        new QRious({
            element: canvas, value: emp.qr,
            size: 220, level: 'M', foreground: '#0f172a'
        });
    }
    var nombre = document.getElementById('qr-nombre');
    if (nombre) nombre.textContent = emp.nombre;
    var m = document.getElementById('modal-qr');
    if (m) m.hidden = false;
}

function cerrarQR() {
    var m = document.getElementById('modal-qr');
    if (m) m.hidden = true;
}
