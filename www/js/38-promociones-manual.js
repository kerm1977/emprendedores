function prepararPromocionDetalle(e) {
    var btn = document.getElementById('det-promocionar');
    if (!btn) return;
    btn.hidden = !esCreadorNegocio(e, usuarioActual());
    btn.onclick = function () { abrirPromocionNegocio(e).catch(function (err) { showToast(err.message); }); };
}

async function abrirPromocionNegocio(e) {
    if (!esCreadorNegocio(e, usuarioActual())) throw new Error('Solo el creador puede promocionar este negocio');
    var panel = await promoApi('/panel'), cfg = panel.config;
    var actual = panel.activos.find(function (a) { return a.emp === String(e.id) && a.ends > panel.server_now; });
    var cupos = await promoApi('');
    if (!actual && cupos.activos.length >= cupos.capacidad) {
        promoModal('Sin cupos disponibles', '<p>No realicés el pago todavía. Consultá al superusuario antes de solicitar una promoción nueva.</p>');
        return;
    }
    var ov = promoModal(actual ? 'Extender plazo de promoción' : 'Promocionar mi negocio',
        '<h4>' + escapeHtml(e.nombre) + '</h4><p class="promo-nota">' + escapeHtml(cfg.mensaje) + '</p>' +
        (actual ? '<p>Vigente hasta ' + promoFecha(actual.ends) + '. La extensión se suma al vencimiento actual.</p>' : '<p>La promoción comienza cuando el superusuario verifica y confirma el pago. Si no hay cupo, consultá antes de pagar.</p>') +
        '<label>Duración<select id="promo-plan">' + cfg.planes.map(function (p) { return '<option value="' + p.id + '"' + (!p.precio ? ' disabled' : '') + '>' + escapeHtml(p.nombre) + (p.precio ? ' · ' + promoMoneda(p.precio) : ' · sin tarifa') + '</option>'; }).join('') + '<option value="personal">Personalizar un plan específico</option></select></label>' +
        '<label id="promo-dias-fila" hidden>Días del plan personalizado<input id="promo-dias" type="number" min="1" max="365" value="1"></label>' +
        '<p id="promo-importe" class="promo-nota">Seleccioná el plazo para consultar el importe.</p>' +
        '<button class="promo-boton" id="promo-cotizar">Consultar precio</button><button class="promo-boton" id="promo-informar">Informar pago al superusuario</button>' +
        '<button class="promo-boton" type="button" disabled>Cobro integrado · próximamente</button>');
    var selector = ov.querySelector('#promo-plan');
    selector.onchange = function () { ov.querySelector('#promo-dias-fila').hidden = selector.value !== 'personal'; ov.querySelector('#promo-importe').textContent = 'Consultá el precio del nuevo plazo'; };
    selector.onchange();
    function datos() { return { emp: e.id, plan: selector.value, dias: Number(ov.querySelector('#promo-dias').value) }; }
    promoAccion(ov, '#promo-cotizar', async function () {
        var plan = await promoApi('/cotizar', datos());
        ov.querySelector('#promo-importe').textContent = plan.nombre + ': ' + promoMoneda(plan.precio);
    });
    promoAccion(ov, '#promo-informar', async function () {
        var solicitud = datos(), plan = await promoApi('/cotizar', solicitud);
        if (!confirm('¿Confirmás que realizaste el pago de ' + promoMoneda(plan.precio) + ' por ' + plan.nombre + '? El superusuario debe verificarlo. Este botón no realiza cargos.')) return;
        solicitud.precio = plan.precio;
        await promoApi('/solicitudes', solicitud);
        ov.remove(); await sincronizarPromociones(); showToast('Pago informado. Pendiente de verificación del superusuario');
    });
}

async function abrirPanelPromociones() {
    try {
        var panel = await promoApi('/panel'); Promociones.panel = panel;
        var ov = promoModal('Promociones y avisos',
            '<button class="promo-boton" id="promo-eventos">Administrar y promocionar eventos</button>' +
            (panel.superusuario ? '<button class="promo-boton" id="promo-tarifas">Configurar tarifas, mensaje y cupos</button>' : '') +
            '<h4>' + (panel.superusuario ? 'Promociones registradas' : 'Promociones de tus negocios') + '</h4>' +
            panel.activos.map(function (a) { var e = (App.data.emprendimientos || []).find(function (e) { return String(e.id) === a.emp; }); return '<div class="promo-fila"><b>' + escapeHtml(e ? e.nombre : a.emp) + '</b><p>Vencimiento: ' + promoFecha(a.ends) + (a.ends <= panel.server_now ? ' · vencida' : '') + '</p><button class="promo-boton" data-extender="' + escapeHtml(a.emp) + '">Extender plazo</button></div>'; }).join('') +
            '<h4>Pagos informados · ' + panel.solicitudes.filter(function (r) { return r.estado === 'pendiente'; }).length + ' pendientes</h4>' +
            (panel.solicitudes.length ? panel.solicitudes.map(function (r) { return '<div class="promo-fila"><b>' + escapeHtml(r.nombre) + '</b> · ' + escapeHtml(r.estado) + '<br>' + escapeHtml(r.email) + '<br>' + promoMoneda(r.precio) + ' · ' + promoFecha(r.created) + '<br>' + escapeHtml(JSON.parse(r.plan).nombre) + (panel.superusuario && r.estado === 'pendiente' ? '<br><button class="promo-boton" data-aprobar="' + r.id + '">Confirmar pago y activar</button><button class="promo-boton" data-rechazar="' + r.id + '">No confirmado</button>' : '') + '</div>'; }).join('') : '<p>No hay solicitudes de pago.</p>'));
        promoAccion(ov, '#promo-eventos', async function () { ov.remove(); await abrirAdministracionEventos(); });
        if (panel.superusuario) promoAccion(ov, '#promo-tarifas', abrirTarifasPromociones);
        ov.querySelectorAll('[data-extender]').forEach(function (btn) {
            btn.onclick = function () {
                var e = (App.data.emprendimientos || []).find(function (e) { return String(e.id) === btn.dataset.extender; });
                if (e) abrirPromocionNegocio(e).catch(function (err) { ov.querySelector('.promo-error').textContent = err.message; });
            };
            var e = (App.data.emprendimientos || []).find(function (e) { return String(e.id) === btn.dataset.extender; });
            btn.hidden = !e || !esCreadorNegocio(e, usuarioActual());
        });
        ['aprobar', 'rechazar'].forEach(function (tipo) {
            ov.querySelectorAll('[data-' + tipo + ']').forEach(function (btn) {
                btn.onclick = async function () {
                    if (!confirm(tipo === 'aprobar' ? '¿Verificaste el pago real y confirmás activar o extender esta promoción por el precio y plazo informados?' : '¿Marcar este pago como no confirmado?')) return;
                    btn.disabled = true;
                    try { await promoApi('/solicitudes/' + btn.dataset[tipo] + '/' + tipo, {}); ov.remove(); await sincronizarPromociones(); await abrirPanelPromociones(); }
                    catch (err) { ov.querySelector('.promo-error').textContent = err.message; btn.disabled = false; }
                };
            });
        });
    } catch (error) { showToast(error.message); }
}
