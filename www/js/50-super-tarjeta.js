/* 50-super-tarjeta.js - Perfil del superusuario.
   Oculta la tarjeta de datos (telefono/cedula): el super no necesita
   verla. Al tocar su NOMBRE genera la tarjeta completa con toda la
   informacion de su cuenta para compartirla. */

function prepararSuperTarjeta() {
    var nombre = document.getElementById('perfil-nombre');
    if (!nombre) return;
    var datos = document.querySelector('#view-perfil .perfil-datos');
    var u = usuarioActual();
    if (u && u.rol === 'super') {
        if (datos) datos.hidden = true;
        nombre.style.cursor = 'pointer';
        nombre.title = 'Ver mi tarjeta de superusuario';
        if (!nombre.dataset.tarjeta) {
            nombre.dataset.tarjeta = '1';
            nombre.onclick = function () { abrirTarjetaSuper(); };
        }
    } else {
        if (datos) datos.hidden = false;
        if (nombre.dataset.tarjeta) { delete nombre.dataset.tarjeta; nombre.onclick = null; }
    }
}

function abrirTarjetaSuper() {
    var u = usuarioActual();
    if (!u) return;
    var ocultos = { promo_token: 1, password: 1, clave: 1, hash: 1, token: 1 };
    var etiquetas = { nombre: 'Nombre', apellido: 'Apellidos', email: 'Correo', rol: 'Rol', telefono: 'Teléfono', cedula: 'Cédula', foto: 'Foto', id: 'ID de usuario', creado: 'Registrado' };
    var filas = Object.keys(u).filter(function (k) {
        return !ocultos[k] && u[k] !== null && u[k] !== undefined && String(u[k]) !== '';
    }).map(function (k) {
        var v = String(u[k]);
        if (v.indexOf('/uploads/') === 0) v = v;
        return '<div class="perfil-dato"><span><b>' + escapeHtml(etiquetas[k] || k) + ':</b> ' + escapeHtml(v) + '</span></div>';
    }).join('');
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja" style="text-align:center">' +
        '<div class="perfil-avatar" style="margin:0 auto 10px">' + (u.foto ? '<img src="' + escapeHtml(apiUrl(u.foto)) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%" alt="foto">' : '<i class="fas fa-crown"></i>') + '</div>' +
        '<h3><i class="fas fa-crown"></i> ' + escapeHtml(u.nombre || 'Superusuario') + '</h3>' +
        '<span class="ota-version">SUPERUSUARIO</span>' +
        '<div style="text-align:left;margin-top:14px">' + filas + '</div>' +
        '<button class="emp-btn-guardar" id="ts-copiar"><i class="fas fa-copy"></i> Copiar datos</button>' +
        '<button class="rep-cancelar" id="ts-cerrar">Cerrar</button></div>';
    ov.querySelector('#ts-cerrar').onclick = function () { ov.remove(); };
    ov.querySelector('#ts-copiar').onclick = function () {
        var texto = filas.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        var nombreTxt = (u.nombre || '') + ' (' + (u.email || '') + ') — SUPERUSUARIO\n' + texto;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(nombreTxt).then(function () { showToast('Datos copiados'); });
        } else { showToast(nombreTxt); }
    };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
}
