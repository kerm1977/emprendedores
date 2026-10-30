var _promoAvisosCola = Promise.resolve();

function actualizarAvisosPromocion() {
    _promoAvisosCola = _promoAvisosCola.then(procesarAvisosPromocion).catch(function () {});
    return _promoAvisosCola;
}

function idAvisoPromocion(texto) {
    var hash = 5381;
    for (var i = 0; i < texto.length; i++) hash = (hash * 33 ^ texto.charCodeAt(i)) | 0;
    return (hash & 0x3fffffff) + 100000;
}

async function procesarAvisosPromocion() {
    var u = usuarioActual(), panel = Promociones.panel;
    var LN = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications;
    var anterior = await localforage.getItem('promo-alarmas-v1');
    var permiso = LN ? (await LN.checkPermissions().catch(function () { return { display: 'denied' }; })).display : 'denied';
    var firma = u && panel ? u.id + ':' + permiso + ':' + JSON.stringify(panel.activos.map(function (a) { return [a.emp, a.ends]; })) : '';
    try {
    if (LN && (!anterior || anterior.firma !== firma)) {
        if (anterior && Array.isArray(anterior.ids) && anterior.ids.length) await LN.cancel({ notifications: anterior.ids.map(function (id) { return { id: id }; }) });
        var notificaciones = [];
        if (u && panel && permiso === 'granted') {
            await LN.createChannel({ id: 'promociones', name: 'Vencimientos de promociones', importance: 4 });
            panel.activos.filter(function (a) { return a.uid === u.id; }).forEach(function (a) {
                [2, 1].forEach(function (dias) {
                    var momento = a.ends - dias * 86400;
                    if (momento <= promoAhora()) return;
                    notificaciones.push({ id: idAvisoPromocion(u.id + ':' + a.emp + ':' + dias), title: dias === 2 ? 'Tu promoción vence en dos días' : 'Último día de tu promoción', body: 'Vence el ' + promoFecha(a.ends) + '. Abrí Emprendedores para extender el plazo.', channelId: 'promociones', schedule: { at: new Date((momento - Promociones.desfase) * 1000), allowWhileIdle: true }, extra: { promocion: a.emp } });
                });
            });
            if (notificaciones.length) await LN.schedule({ notifications: notificaciones });
        }
        await localforage.setItem('promo-alarmas-v1', { firma: firma, ids: notificaciones.map(function (n) { return n.id; }) });
    }
    } catch (error) { Promociones.errorAvisosLocales = error.message; }
    if (!u || !panel || document.querySelector('.modal-cat:not([hidden]), .imagen-ampliada, #login-overlay.visible')) return;
    var avisos = [];
    panel.activos.filter(function (a) { return a.uid === u.id; }).forEach(function (a) {
        var faltan = a.ends - promoAhora();
        if (faltan <= 2 * 86400) avisos.push({ key: a.emp + ':' + a.ends + ':' + (faltan <= 86400 ? 'ultimo' : 'dos'), emp: a.emp, texto: faltan <= 0 ? 'Tu promoción venció.' : faltan <= 86400 ? 'Tu promoción está en su último día.' : 'Tu promoción vence en dos días.', ends: a.ends });
    });
    if (panel.superusuario) panel.solicitudes.filter(function (r) { return r.estado === 'pendiente'; }).forEach(function (r) { avisos.push({ key: 'pago:' + r.id, texto: 'Pago informado por ' + r.email + ' para ' + r.nombre + '. Requiere verificación del superusuario.' }); });
    for (var i = 0; i < avisos.length; i++) {
        var a = avisos[i], key = 'promo-aviso:' + u.id + ':' + a.key;
        if (await localforage.getItem(key)) continue;
        var ov = promoModal('Aviso de promoción', '<p>' + escapeHtml(a.texto) + '</p>' + (a.ends ? '<p>Vencimiento: ' + promoFecha(a.ends) + '</p>' : '') + '<button class="promo-boton" id="promo-aviso-abrir">' + (a.emp ? 'Extender plazo' : 'Revisar pago informado') + '</button>');
        await localforage.setItem(key, true);
        (function (aviso, modal) {
            modal.querySelector('#promo-aviso-abrir').onclick = function () {
                modal.remove();
                var e = (App.data.emprendimientos || []).find(function (e) { return String(e.id) === aviso.emp; });
                if (e) abrirPromocionNegocio(e).catch(function (err) { showToast(err.message); });
                else abrirPanelPromociones();
            };
        })(a, ov);
        break;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    var LN = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications;
    if (LN) LN.addListener('localNotificationActionPerformed', function () { abrirPanelPromociones(); });
});
