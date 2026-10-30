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
    var salir = document.getElementById('btn-salir-perfil');
    if (!salir) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btn-mis-empresas';
    btn.className = 'perfil-btn-ajustes';
    btn.innerHTML = '<i class="fas fa-briefcase"></i> Mis empresas';
    salir.parentNode.insertBefore(btn, salir);
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
                ' <small>' + escapeHtml(e.categoria || '') + (e.pausa ? ' · pausado' : '') + '</small><br>' +
                (promo ? '<p class="evt-nota" style="margin:6px 0 0"><i class="fas fa-hourglass-half"></i> Espacio pagado · restante: <b data-cd="' + promo.ends + '">' + formatoCuenta(promo.ends - promoAhora()) + '</b></p>' : '') +
                (bloq ? '<p class="evt-nota" style="margin:6px 0 0"><i class="fas fa-ban"></i> ' + (bloq.pendientePago ? 'Su negocio no será visible hasta ponerse al día.' : 'Su negocio fue bloqueado.') + '<br><small>' + escapeHtml(bloq.motivo || '') + '</small></p>' :
                '<button class="rep-cancelar" data-editar="' + i + '" style="margin:4px 6px 0 0;padding:4px 10px;font-size:.8rem"><i class="fas fa-pen"></i> Editar</button>' +
                '<button class="rep-cancelar" data-eliminar="' + i + '" style="margin-top:4px;padding:4px 10px;font-size:.8rem"><i class="fas fa-trash"></i> Eliminar</button>') + '</div>';
        }).join('') : '<p class="rep-sub">Todavía no tenés empresas registradas.</p>') +
        '</div><button class="emp-btn-guardar" id="mis-agregar"><i class="fas fa-plus"></i> Agregar otra empresa</button>' +
        '<button class="rep-cancelar" id="mis-cerrar">Cerrar</button></div>';
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
        var bd = ev.target.closest('[data-eliminar]');
        if (bd) eliminarMiEmpresa(ov, mias[Number(bd.dataset.eliminar)]);
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

function eliminarMiEmpresa(ovPadre, e) {
    var paso = 0;
    var textos = [
        '¿Eliminar "' + (e.nombre || '') + '"? Dejará de aparecer en el directorio.',
        'Esta acción quita tu empresa del catálogo público.',
        'El registro se elimina de la sincronización en la próxima subida.',
        'Última confirmación: ¿eliminar definitivamente?'];
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja"><h3><i class="fas fa-trash"></i> Eliminar empresa</h3>' +
        '<p id="me-paso">' + textos[0] + '</p>' +
        '<button class="emp-btn-guardar" id="me-confirma">Confirmar (1 de 4)</button>' +
        '<button class="rep-cancelar" id="me-cancela">Cancelar</button></div>';
    ov.querySelector('#me-cancela').onclick = function () { ov.remove(); };
    ov.querySelector('#me-confirma').onclick = function () {
        paso++;
        if (paso < 4) {
            ov.querySelector('#me-paso').textContent = textos[paso];
            this.textContent = 'Confirmar (' + (paso + 1) + ' de 4)';
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
