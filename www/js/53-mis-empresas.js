/* 53-mis-empresas.js - Panel "Mis empresas" del usuario logueado.
   Lista los negocios donde e.owner == correo de sesion (orden
   protegido de autoria), permite editar, eliminar y agregar otra. */

function misEmpresas() {
    var u = usuarioActual();
    var me = (u && u.email || '').trim().toLowerCase();
    return (App.data.emprendimientos || []).filter(function (e) {
        return String(e.owner || '').trim().toLowerCase() === me;
    });
}

function prepararMisEmpresas() {
    if (document.getElementById('btn-mis-empresas') || !usuarioActual()) return;
    /* Mis empresas va justo debajo de los datos del perfil */
    var datos = document.querySelector('#view-perfil .perfil-datos');
    var salir = document.getElementById('btn-info-dev') || document.getElementById('btn-salir-perfil');
    if (!datos && !salir) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btn-mis-empresas';
    btn.className = 'perfil-btn-ajustes';
    btn.innerHTML = '<i class="fas fa-briefcase"></i> Mis empresas';
    if (datos) datos.parentNode.insertBefore(btn, datos.nextSibling);
    else salir.parentNode.insertBefore(btn, salir);
    btn.onclick = abrirMisEmpresas;
}

function abrirMisEmpresas() {
    var mias = misEmpresas();
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja">' +
        '<h3><i class="fas fa-briefcase"></i> Mis empresas (' + mias.length + ')</h3>' +
        '<div style="max-height:45vh;overflow-y:auto">' +
        (mias.length ? mias.map(function (e, i) {
            var bloq = typeof bloqueoDe === 'function' ? bloqueoDe(e.owner, e.id) : null;
            var promo = promoDeEmpresa(e);
            return '<div class="dic-item"><b>' + escapeHtml(e.nombre || '') + '</b>' +
                ' <small>' + escapeHtml(e.categoria || '') + (e.pausa ? ' · oculto' : '') + '</small>' +
                (promo ? '<p class="evt-nota" style="margin:6px 0 0"><i class="fas fa-hourglass-half"></i> Espacio pagado · restante: <b data-cd="' + promo.ends + '">' + formatoCuenta(promo.ends - promoAhora()) + '</b></p>' : '') +
                (bloq ? '<p class="evt-nota" style="margin:6px 0 0"><i class="fas fa-ban"></i> ' + (bloq.pendientePago ? 'Su negocio no será visible hasta ponerse al día.' : 'Su negocio fue bloqueado.') + '<br><small>' + escapeHtml(bloq.motivo || '') + '</small></p>' :
                '<hr style="border:none;border-top:1px solid var(--border-soft);margin:8px 0">' +
                '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<button class="rep-cancelar" data-editar="' + i + '" style="margin:0;padding:5px 12px;font-size:.8rem"><i class="fas fa-pen"></i> Editar</button>' +
                '<button class="rep-cancelar" data-qr="' + i + '" style="margin:0;padding:5px 12px;font-size:.8rem;background:var(--primary-color);color:#fff;border-color:var(--primary-color)"><i class="fas fa-qrcode"></i> QR</button>' +
                '<button class="rep-cancelar" data-tarjeta="' + i + '" style="margin:0;padding:5px 12px;font-size:.8rem;background:var(--primary-color);color:#fff;border-color:var(--primary-color)"><i class="fas fa-id-card"></i> Tarjeta digital</button>' +
                '<button class="rep-cancelar" data-ocultar="' + i + '" style="margin:0;padding:5px 12px;font-size:.8rem"><i class="fas fa-eye' + (e.pausa ? '' : '-slash') + '"></i> ' + (e.pausa ? 'Mostrar' : 'Ocultar') + '</button>' +
                '<button class="rep-cancelar" data-eliminar="' + i + '" style="margin:0;padding:5px 12px;font-size:.8rem"><i class="fas fa-trash"></i> Eliminar</button></div>') + '</div>';
        }).join('') : '<p class="rep-sub">Todavía no tenés empresas registradas.</p>') +
        '</div><div style="text-align:center;margin-top:16px"><button class="emp-btn-guardar" id="mis-agregar" style="margin:0 auto"><i class="fas fa-plus"></i> Agregar otra empresa</button></div>' +
        '<button class="rep-cancelar" id="mis-cerrar" style="margin-top:8px">Cerrar</button></div>';
    ov.querySelector('#mis-cerrar').onclick = function () { ov.remove(); };
    ov.querySelector('#mis-agregar').onclick = function () {
        ov.remove();
        irAVista('view-registro-emp', 'Registrar');
    };
    ov.addEventListener('click', function (ev) {
        var be = ev.target.closest('[data-editar]');
        if (be) {
            var e = mias[Number(be.dataset.editar)];
            ov.remove();
            if (typeof abrirEdicion === 'function') abrirEdicion(e);
            return;
        }
        var bo = ev.target.closest('[data-ocultar]');
        if (bo) {
            var eo = mias[Number(bo.dataset.ocultar)];
            if (eo.pausa) { eo.pausa = false; saveDataAhora(); ov.remove(); abrirMisEmpresas(); showToast('Negocio visible de nuevo'); }
            else confirmarOcultar(ov, eo);
            return;
        }
        var bd = ev.target.closest('[data-eliminar]');
        if (bd) eliminarMiEmpresa(ov, mias[Number(bd.dataset.eliminar)]);
        var bqr = ev.target.closest('[data-qr]');
        if (bqr && typeof mostrarQR === 'function') {
            mostrarQR(mias[Number(bqr.dataset.qr)].id); return; }
        var btj = ev.target.closest('[data-tarjeta]');
        if (btj && typeof descargarTarjeta === 'function') {
            descargarTarjeta(mias[Number(btj.dataset.tarjeta)].id); }
    });
    document.body.appendChild(ov);
    var tick = setInterval(function () {
        if (!ov.isConnected) { clearInterval(tick); return; }
        ov.querySelectorAll('[data-cd]').forEach(function (el) {
            el.textContent = formatoCuenta(Number(el.dataset.cd) - promoAhora());
        });
    }, 1000);
}

function promoDeEmpresa(e) {
    if (typeof Promociones === 'undefined' || !Promociones.publico || typeof promoAhora !== 'function') return null;
    return (Promociones.publico.activos || []).filter(function (a) {
        return String(a.emp) === String(e.id) && a.ends > promoAhora();
    })[0] || null;
}

/* ends/ahora llegan en segundos: formato "5d 03:22:41" o "03:22:41" */
function formatoCuenta(segs) {
    var s = Math.max(0, Math.floor(segs));
    var d = Math.floor(s / 86400); s -= d * 86400;
    var t = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(function (n) {
        return String(n).padStart(2, '0');
    }).join(':');
    return d ? d + 'd ' + t : t;
}

function confirmarOcultar(ovPadre, e) {
    var paso = 0;
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja"><h3><i class="fas fa-eye-slash"></i> Ocultar empresa</h3>' +
        '<p id="oc-paso">¿Ocultar "' + escapeHtml(e.nombre || '') + '"? La gente no podrá encontrarla ni en el buscador ni en el directorio.</p>' +
        '<button class="emp-btn-guardar" id="oc-confirma">Confirmar (1 de 2)</button>' +
        '<button class="rep-cancelar" id="oc-cancela">Cancelar</button></div>';
    ov.querySelector('#oc-cancela').onclick = function () { ov.remove(); };
    ov.querySelector('#oc-confirma').onclick = function () {
        paso++;
        if (paso < 2) {
            ov.querySelector('#oc-paso').textContent = 'Última confirmación: tu negocio quedará oculto hasta que lo vuelvas a mostrar.';
            this.textContent = 'Confirmar (2 de 2)';
            return;
        }
        e.pausa = true;
        saveDataAhora();
        ov.remove();
        if (ovPadre && ovPadre.isConnected) { ovPadre.remove(); abrirMisEmpresas(); }
        if (typeof renderTodo === 'function') renderTodo();
        showToast('Negocio oculto del público');
    };
    document.body.appendChild(ov);
}

function eliminarMiEmpresa(ovPadre, e) {
    var paso = 0;
    var textos = [
        '¿Eliminar "' + (e.nombre || '') + '"? Dejará de aparecer en el directorio.',
        'Esta acción quita tu empresa del catálogo público.',
        'Última confirmación: ¿eliminar definitivamente?'];
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja"><h3><i class="fas fa-trash"></i> Eliminar empresa</h3>' +
        '<p id="me-paso">' + textos[0] + '</p>' +
        '<button class="emp-btn-guardar" id="me-confirma">Confirmar (1 de 3)</button>' +
        '<button class="rep-cancelar" id="me-cancela">Cancelar</button></div>';
    ov.querySelector('#me-cancela').onclick = function () { ov.remove(); };
    ov.querySelector('#me-confirma').onclick = function () {
        paso++;
        if (paso < 3) {
            ov.querySelector('#me-paso').textContent = textos[paso];
            this.textContent = 'Confirmar (' + (paso + 1) + ' de 3)';
            return;
        }
        App.data.emprendimientos = (App.data.emprendimientos || []).filter(function (x) { return x !== e; });
        if (typeof pushNotificacion === 'function') pushNotificacion('eliminacion', 'Empresa eliminada por su dueño: ' + (e.nombre || ''));
        saveDataAhora();
        ov.remove();
        if (ovPadre && ovPadre.isConnected) { ovPadre.remove(); abrirMisEmpresas(); }
        if (typeof renderTodo === 'function') renderTodo();
        showToast('Empresa eliminada');
    };
    document.body.appendChild(ov);
}
