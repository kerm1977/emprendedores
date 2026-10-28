/* 14-contacto.js - Vista de detalle del contacto del directorio.
   Muestra emprendimiento, contacto, horario y acciones (llamar/WhatsApp). */

/* Vista de contacto: datos + botones de llamada y WhatsApp */
function verContacto(id) {
    var p = (App.data.emprendedores || []).find(function (x) {
        return String(x.id) === String(id);
    });
    if (!p) return;
    var emp = (App.data.emprendimientos || []).find(function (x) {
        return String(x.id) === String(p.empId);
    }) || {};
    setTexto('con-emp', p.emprendimiento || p.nombre);
    setTexto('con-nombre', p.nombre);
    setTexto('con-telefono', p.telefono || 'Sin teléfono');
    setTexto('con-horario', emp.horario || 'Horario no indicado');
    setTexto('con-lugar', emp.lugar || 'Sin ubicación');
    var digitos = (p.telefono || '').replace(/\D/g, '');
    /* Se ignora el codigo de pais (+506): el numero local son 8 digitos */
    var local = digitos.length > 8 ? digitos.slice(-8) : digitos;
    var btnLlamar = document.getElementById('btn-llamar');
    var btnWa = document.getElementById('btn-whatsapp');
    if (btnLlamar) {
        btnLlamar.href = 'tel:+506' + local;
        btnLlamar.hidden = !local;
    }
    if (btnWa) {
        /* WhatsApp solo para celulares CR: el numero local empieza con 6, 7 u 8 */
        var esMovil = /^[678]/.test(local);
        if (esMovil) {
            btnWa.href = 'https://wa.me/506' + local;
            btnWa.classList.remove('desactivado');
        } else {
            btnWa.removeAttribute('href');
            btnWa.classList.add('desactivado');
        }
    }
    irAVista('view-contacto', 'Contacto');
}
