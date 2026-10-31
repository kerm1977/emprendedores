/* BLINDADO (orden del usuario): prohibido modificar/eliminar
   sin orden explicita. Pedir permiso antes de tocar. */
/* 30-notificaciones.js - Notificador para superusuarios.
   Guarda eventos en App.data.notificaciones (sync) y muestra
   campana + contador en el Perfil del super. */

function pushNotificacion(tipo, texto) {
    App.data.notificaciones = App.data.notificaciones || [];
    App.data.notificaciones.push({ tipo: tipo, texto: texto,
                                   ts: Date.now(), leida: false });
}

function notifCount() {
    return (App.data.notificaciones || []).filter(function (n) {
        return !n.leida;
    }).length;
}

/* Campana en el Perfil del superusuario */
function reflejarNotificaciones() {
    var u = usuarioActual();
    var camp = document.getElementById('perfil-notif');
    if (!camp) return;
    var es = u && u.rol === 'super';
    camp.hidden = !es;
    var badge = document.getElementById('perfil-notif-count');
    if (badge) badge.textContent = notifCount();
}

/* Lista de notificaciones en modal; al abrirla marca leidas */
function abrirNotificaciones() {
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    var items = (App.data.notificaciones || []).slice().reverse();
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja">' +
        '<h3><i class="fas fa-bell"></i> Notificaciones</h3>' +
        '<div style="max-height:50vh;overflow-y:auto">' +
        (items.length ? items.map(function (n) {
            var ic = n.tipo === 'reporte' ? 'fa-flag' :
                     n.tipo === 'problema' ? 'fa-bug' :
                     n.tipo === 'prohibida' ? 'fa-ban' : 'fa-trash';
            return '<div class="dic-item">' +
                '<i class="fas ' + ic + '"></i> ' +
                escapeHtml(n.texto) +
                '<br><small>' + new Date(n.ts).toLocaleString('es-CR') +
                '</small></div>';
        }).join('') : '<p class="rep-sub">Sin notificaciones</p>') +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:10px">' +
        '<button class="rep-cancelar" id="notif-limpiar" style="margin:0"><i class="fas fa-broom"></i> Limpiar notificaciones</button>' +
        '<button class="rep-cancelar" id="notif-historial" style="margin:0"><i class="fas fa-clock-rotate-left"></i> Historial</button>' +
        '<button class="emp-btn-guardar" id="notif-cerrar" style="margin:0 0 0 auto">Cerrar</button>' +
        '</div></div>';
    ov.querySelector('#notif-cerrar').onclick = function () {
        ov.remove(); reflejarNotificaciones();
    };
    ov.querySelector('#notif-limpiar').onclick = function () { confirmarLimpiarNotificaciones(ov); };
    ov.querySelector('#notif-historial').onclick = function () { abrirHistorialNotificaciones(); };
    ov.onclick = function (ev) { if (ev.target === ov) ov.remove(); };
    document.body.appendChild(ov);
    /* marcar leidas */
    (App.data.notificaciones || []).forEach(function (n) {
        n.leida = true;
    });
    saveData();
}

/* Limpiar: pide 3 confirmaciones; las notificaciones se archivan en
   localforage ('historial-notificaciones') para poder recargarlas. */
var HISTORIAL_NOTIF = 'historial-notificaciones';

function confirmarLimpiarNotificaciones(ovPadre) {
    var paso = 0;
    var textos = [
        '¿Seguro que querés limpiar todas las notificaciones?',
        'Si las borrás, el panel quedará sin registro visible. Se conservan en el historial de respaldo.',
        'Última confirmación: ¿limpiar notificaciones?'];
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja">' +
        '<h3><i class="fas fa-broom"></i> Limpiar notificaciones</h3>' +
        '<p id="notif-paso">' + textos[0] + '</p>' +
        '<button class="emp-btn-guardar" id="notif-confirma">Confirmar (1 de 3)</button>' +
        '<button class="rep-cancelar" id="notif-cancela">Cancelar</button></div>';
    ov.querySelector('#notif-cancela').onclick = function () { ov.remove(); };
    ov.querySelector('#notif-confirma').onclick = async function () {
        paso++;
        if (paso < 3) {
            ov.querySelector('#notif-paso').textContent = textos[paso];
            this.textContent = 'Confirmar (' + (paso + 1) + ' de 3)';
            return;
        }
        try {
            var previas = await localforage.getItem(HISTORIAL_NOTIF) || [];
            var archivadas = (App.data.notificaciones || []).map(function (n) {
                return { tipo: n.tipo, texto: n.texto, ts: n.ts, archivadoEn: Date.now() };
            });
            await localforage.setItem(HISTORIAL_NOTIF, previas.concat(archivadas).slice(-500));
        } catch (e) {}
        App.data.notificaciones = [];
        saveDataAhora();
        ov.remove();
        if (ovPadre && ovPadre.isConnected) { ovPadre.remove(); }
        reflejarNotificaciones();
        showToast('Notificaciones limpiadas y archivadas en el historial');
    };
    document.body.appendChild(ov);
}

async function abrirHistorialNotificaciones() {
    var items = (await localforage.getItem(HISTORIAL_NOTIF) || []).slice().reverse();
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja">' +
        '<h3><i class="fas fa-clock-rotate-left"></i> Historial de notificaciones</h3>' +
        '<div style="max-height:50vh;overflow-y:auto">' +
        (items.length ? items.map(function (n) {
            var ic = n.tipo === 'reporte' ? 'fa-flag' : n.tipo === 'problema' ? 'fa-bug' : n.tipo === 'prohibida' ? 'fa-ban' : 'fa-trash';
            return '<div class="dic-item"><i class="fas ' + ic + '"></i> ' + escapeHtml(n.texto || '') +
                '<br><small>' + new Date(n.ts).toLocaleString('es-CR') + '</small></div>';
        }).join('') : '<p class="rep-sub">Historial vacío.</p>') + '</div>' +
        (items.length ? '<button class="emp-btn-guardar" id="notif-restaurar">Recargar al panel</button>' : '') +
        '<button class="rep-cancelar" id="notif-hist-cerrar">Cerrar</button></div>';
    ov.querySelector('#notif-hist-cerrar').onclick = function () { ov.remove(); };
    var rest = ov.querySelector('#notif-restaurar');
    if (rest) rest.onclick = async function () {
        App.data.notificaciones = (App.data.notificaciones || []).concat(items.slice().reverse().map(function (n) {
            return { tipo: n.tipo, texto: n.texto, ts: n.ts, leida: true };
        }));
        saveDataAhora();
        ov.remove();
        reflejarNotificaciones();
        showToast('Historial recargado en el panel de notificaciones');
    };
    document.body.appendChild(ov);
}

/* Boton "Reportar problema con el sitio" en el Perfil (usuarios con sesion).
   La descripcion viaja como notificacion a los superusuarios mediante
   App.data.notificaciones, que ya se sincroniza con el servidor. */
function prepararReporteSitio() {
    var u = usuarioActual();
    if (!u || document.getElementById('btn-reportar-sitio')) return;
    var salir = document.getElementById('btn-info-dev') || document.getElementById('btn-salir-perfil');
    if (!salir) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btn-reportar-sitio';
    btn.className = 'perfil-btn-ajustes';
    /* El super no reporta: él VE los reportes de la gente */
    if (u.rol === 'super') {
        btn.innerHTML = '<i class="fas fa-list-check"></i> Ver reportes del sitio';
        salir.parentNode.insertBefore(btn, salir);
        btn.onclick = function () { irAVista('view-dashboard', 'Reportes del sitio'); };
        return;
    }
    btn.innerHTML = '<i class="fas fa-bug"></i> Reportar problema con el sitio';
    salir.parentNode.insertBefore(btn, salir);
    btn.onclick = abrirReporteSitio;
}

/* Reporte de problema: pagina completa (no modal) con editor WYSIWYG
   grande y herramientas en horizontal. */
function abrirReporteSitio() {
    var vista = document.getElementById('view-reporte-sitio');
    if (!vista) return;
    vista.innerHTML = '<div class="perfil-card" style="text-align:left">' +
        '<h3 id="rep-sitio-titulo" tabindex="-1" style="outline:none"><i class="fas fa-bug"></i> Reportar problema con el sitio</h3>' +
        '<p class="rep-sub">Describí qué está pasando (hasta unas 500 palabras). Podés usar negrita, itálica, subrayado, alineación y listas.</p>' +
        '<div id="rep-sitio-editor"></div>' +
        '<p class="rep-sub" style="margin-top:12px">Tu reporte llega como notificación a los superusuarios, quienes lo revisan y te responden. Incluí qué estabas haciendo, qué esperabas y qué salió mal para poder ayudarte más rápido.</p>' +
        '<button class="emp-btn-guardar" id="rep-sitio-enviar" disabled style="margin-top:18px">Enviar reporte</button>' +
        '<button class="perfil-btn-ajustes" id="rep-sitio-volver" style="margin-top:10px"><i class="fas fa-arrow-left"></i> Volver a mi perfil</button></div>';
    var ed = wysiwygEditor('Contanos el problema con detalle...');
    ed.area.style.minHeight = '240px';
    vista.querySelector('#rep-sitio-editor').appendChild(ed);
    var enviar = vista.querySelector('#rep-sitio-enviar');
    ed.area.addEventListener('input', function () { enviar.disabled = ed.texto().length < 10; });
    vista.querySelector('#rep-sitio-volver').onclick = function () { irAVista('view-perfil', 'Perfil'); };
    enviar.onclick = function () {
        enviar.disabled = true;
        var u = usuarioActual();
        pushNotificacion('problema', (u ? u.email : 'Usuario') + ' reportó un problema: ' + ed.texto());
        saveDataAhora();
        reflejarNotificaciones();
        irAVista('view-perfil', 'Perfil');
        showToast('Reporte enviado a los superusuarios');
    };
    irAVista('view-reporte-sitio', 'Reportar problema');
    var titulo = vista.querySelector('#rep-sitio-titulo');
    if (titulo) setTimeout(function () { titulo.focus(); }, 60);
}

/* Dashboard del super: resumen + reportes recibidos */
function renderDashboard() {
    var res = document.getElementById('dash-resumen');
    var rep = document.getElementById('dash-reportes');
    if (!res || !rep) return;
    var d = App.data;
    res.innerHTML =
        '<div class="perfil-dato"><i class="fas fa-store"></i>' +
            '<span>Emprendimientos: <b>' +
            (d.emprendimientos || []).length + '</b> (pausados: ' +
            (d.emprendimientos || []).filter(function (e) {
                return e.pausa; }).length + ')</span></div>' +
        '<div class="perfil-dato"><i class="fas fa-users"></i>' +
            '<span>Contactos: <b>' + (d.emprendedores || []).length +
            '</b></span></div>' +
        '<div class="perfil-dato"><i class="fas fa-flag"></i>' +
            '<span>Reportes: <b>' + (d.reportes || []).length +
            '</b></span></div>';
    var items = (d.reportes || []).slice().reverse();
    rep.innerHTML = items.length ? items.map(function (r) {
        return '<div class="dic-item"><i class="fas fa-flag"></i> ' +
            '<b>' + escapeHtml(r.motivo || '') + '</b> — ' +
            escapeHtml(r.emprendimiento || '') + '<br>' +
            '<small>' + escapeHtml(r.usuario || '') +
            (r.texto ? ' · ' + escapeHtml(r.texto) : '') +
            ' · ' + new Date(r.ts).toLocaleString('es-CR') +
            '</small></div>';
    }).join('') : '<p class="rep-sub">Sin reportes todavía</p>';
}

/* Lista de reportes recibidos: empresa, motivo, quien, cuando, causa */
function abrirReportes() {
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    var items = (App.data.reportes || []).slice().reverse();
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja">' +
        '<h3><i class="fas fa-flag"></i> Reportes recibidos</h3>' +
        '<div style="max-height:55vh;overflow-y:auto">' +
        (items.length ? items.map(function (r) {
            var d = new Date(r.ts);
            return '<div class="dic-item">' +
                '<b>' + escapeHtml(r.emprendimiento || '') + '</b><br>' +
                '<small>Motivo: <b>' + escapeHtml(r.motivo || '') +
                '</b><br>' +
                'Reportó: ' + escapeHtml(r.usuario || '') + '<br>' +
                'Fecha: ' + d.toLocaleDateString('es-CR') +
                ' ' + d.toLocaleTimeString('es-CR') + '<br>' +
                (r.texto ? 'Causa: ' + escapeHtml(r.texto) : '') +
                '</small></div>';
        }).join('') : '<p class="rep-sub">Sin reportes todavía</p>') +
        '</div>' +
        '<button class="emp-btn-guardar" id="rep-cerrar2">Cerrar</button>' +
        '</div>';
    ov.querySelector('#rep-cerrar2').onclick = function () { ov.remove(); };
    ov.onclick = function (ev) { if (ev.target === ov) ov.remove(); };
    document.body.appendChild(ov);
}
