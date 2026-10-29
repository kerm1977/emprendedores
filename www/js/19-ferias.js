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
    var feria = {
        id: 'fer-' + Date.now(),
        titulo: document.getElementById('fer-nombre').value.trim(),
        fecha: document.getElementById('fer-fecha').value,
        horaInicio: document.getElementById('fer-hora-inicio').value,
        horaFin: document.getElementById('fer-hora-fin').value,
        lugar: document.getElementById('fer-lugar').value.trim(),
        contacto: document.getElementById('fer-contacto').value.trim(),
        telefono: document.getElementById('fer-telefono').value.trim(),
        texto: document.getElementById('fer-desc').value.trim()
    };
    if (!feria.titulo) {
        showToast('Escribí el nombre de la feria');
        return;
    }
    App.data.ferias = App.data.ferias || [];
    App.data.ferias.push(feria);
    await saveData();
    e.target.reset();
    renderNotas();
    showToast('Feria registrada');
    irAVista('view-notas', 'Ferias');
}
