/* 19-ferias.js - Ferias de emprendimientos: formulario de registro
   (nombre, fecha, lugar, contacto, telefono, descripcion). */

async function initFerias() {
    try {
        var res = await fetch('parciales/ferias.html');
        var tmp = document.createElement('div');
        tmp.innerHTML = await res.text();
        var vista = tmp.querySelector('#view-feria');
        var main = document.querySelector('.app-main');
        if (vista && main) main.appendChild(vista);
    } catch (e) {
        return;
    }
    var form = document.getElementById('form-feria');
    if (form) form.addEventListener('submit', guardarFeria);
}

async function guardarFeria(e) {
    e.preventDefault();
    if (typeof guardarEvento === 'function') return guardarEvento(e);
    showToast('Actualizá la aplicación para registrar eventos');
}
