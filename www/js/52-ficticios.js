/* 52-ficticios.js - Datos de prueba (10 contactos + 10 negocios).
   Solo superusuario, desde Ajustes: cargar y eliminar. Cada registro
   lleva ficticio:true para identificarlo y borrarlo sin tocar datos reales. */

var FICTICIOS = (function () {
    var personas = [
        ['María Fernández Rojas', 'Café La Montaña', '87010001', 'mariaf@ficticio.cr', 'San José', 'Montes de Oca', 'San Pedro'],
        ['José Pablo Mena', 'Mena Tech Solutions', '87010002', 'jmena@ficticio.cr', 'San José', 'Escazú', 'San Rafael'],
        ['Ana Lucía Villalta', 'Panadería Villalta', '87010003', 'avillalta@ficticio.cr', 'Heredia', 'Heredia', 'Mercedes'],
        ['Carlos Eduardo Solano', 'Ferretería El Tornillo', '87010004', 'csolano@ficticio.cr', 'Alajuela', 'Alajuela', 'Centro'],
        ['Daniela Quirós Vega', 'Estudio Yoga DQ', '87010005', 'dquiros@ficticio.cr', 'Cartago', 'Cartago', 'Oriental'],
        ['Fernando Rojas Mora', 'Rojas Fotografía', '87010006', 'frojas@ficticio.cr', 'Puntarenas', 'Puntarenas', 'Chacarita'],
        ['Gabriela Sancho Díaz', 'Florería Sancho', '87010007', 'gsancho@ficticio.cr', 'Heredia', 'Santo Domingo', 'San Vicente'],
        ['Henry Vargas León', 'Transporte Vargas', '87010008', 'hvargas@ficticio.cr', 'Alajuela', 'San Ramón', 'San Ramón'],
        ['Isabel Cordero Núñez', 'Veterinaria Cordero', '87010009', 'icordero@ficticio.cr', 'San José', 'Desamparados', 'San Rafael Arriba'],
        ['Javier Mejía Solís', 'Mejía Consultores', '87010010', 'jmejia@ficticio.cr', 'Guanacaste', 'Liberia', 'Liberia']];
    var categorias = ['Comercio y ventas', 'Servicios profesionales', 'Alimentos y bebidas', 'Salud y bienestar', 'Tecnología', 'Educación', 'Turismo', 'Hogar y construcción', 'Arte y cultura', 'Transporte'];
    var usuarios = personas.map(function (p, i) {
        return { id: 'fic-u' + (i + 1), ficticio: true, nombre: p[0], emprendimiento: p[1], telefono: p[2], email: p[3], provincia: p[4], canton: p[5], distrito: p[6], referencia: 'Contenido de prueba' };
    });
    var negocios = personas.map(function (p, i) {
        return { id: 'fic-e' + (i + 1), ficticio: true, nombre: p[1], categoria: categorias[i], telefono: p[2], email: p[3], owner: p[3], provincia: p[4], canton: p[5], distrito: p[6], direccion: 'Centro de ' + p[6], horarioTexto: 'L-V 8:00-17:00', descripcion: 'Negocio ficticio de prueba: ' + p[1] + ' en ' + p[6] + ', ' + p[4] + '. Datos de muestra para probar buscadores y vistas.', pluses: [], pausado: false, likes: 0 };
    });
    return { usuarios: usuarios, negocios: negocios };
})();

function cargarFicticios() {
    (App.data.emprendedores = App.data.emprendedores || []).push.apply(App.data.emprendedores, FICTICIOS.usuarios);
    (App.data.emprendimientos = App.data.emprendimientos || []).push.apply(App.data.emprendimientos, FICTICIOS.negocios);
    saveDataAhora();
    renderTodo();
    showToast('Datos de prueba cargados: 10 contactos y 10 negocios');
    prepararFicticios();
}

function eliminarFicticios() {
    var u = App.data.emprendedores || [], e = App.data.emprendimientos || [];
    var total = u.filter(function (x) { return x.ficticio; }).length + e.filter(function (x) { return x.ficticio; }).length;
    App.data.emprendedores = u.filter(function (x) { return !x.ficticio; });
    App.data.emprendimientos = e.filter(function (x) { return !x.ficticio; });
    saveDataAhora();
    renderTodo();
    showToast(total + ' registros ficticios eliminados');
    prepararFicticios();
}

function prepararFicticios() {
    var u = usuarioActual();
    if (!u || u.rol !== 'super') return;
    var viejo = document.getElementById('ficticios-box');
    if (viejo) viejo.remove();
    var destino = document.getElementById('view-ajustes');
    if (!destino) return;
    var hay = (App.data.emprendedores || []).some(function (x) { return x.ficticio; });
    var box = document.createElement('div');
    box.id = 'ficticios-box';
    box.innerHTML = '<details class="evt-acordeon"><summary><i class="fas fa-flask-vial"></i> Datos de prueba (ficticios)</summary>' +
        '<p class="rep-sub">Cargá 10 contactos y 10 negocios ficticios para probar buscadores y vistas. Se eliminan sin tocar datos reales.</p>' +
        (hay ? '<button class="rep-cancelar" id="fic-eliminar"><i class="fas fa-trash"></i> Eliminar datos ficticios</button>'
             : '<button class="emp-btn-guardar" id="fic-cargar"><i class="fas fa-database"></i> Cargar datos de prueba</button>') + '</details>';
    destino.appendChild(box);
    var c = box.querySelector('#fic-cargar'), d = box.querySelector('#fic-eliminar');
    if (c) c.onclick = cargarFicticios;
    if (d) d.onclick = eliminarFicticios;
}
