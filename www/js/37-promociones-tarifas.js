async function abrirTarifasPromociones() {
    var panel = await promoApi('/panel');
    if (!panel.superusuario) throw new Error('Solo el superusuario puede configurar las tarifas');
    var cfg = panel.config;
    var ov = promoModal('Tarifas y cupos de publicidad', '<p class="promo-nota">Los importes quedan sin habilitar hasta que los configurés. Plan personalizado: tarifa de tres días ÷ 3 × días; para uno o dos días se aplica el recargo configurable.</p>' +
        '<label>Empresas visibles en espacio pagado<input id="promo-capacidad" type="number" min="1" max="1000" value="' + cfg.capacidad + '"></label>' +
        '<label>Mensaje e instrucciones de pago<textarea id="promo-mensaje" rows="5">' + escapeHtml(cfg.mensaje) + '</textarea></label>' +
        '<label>Recargo porcentual para planes de uno o dos días<input id="promo-recargo" type="number" min="0" max="500" value="' + cfg.recargo_personal + '"></label>' +
        cfg.planes.map(function (p) { return '<label>' + escapeHtml(p.nombre) + ' · colones<input type="number" min="1" max="100000000" data-plan="' + p.id + '" value="' + (p.precio || '') + '" placeholder="Sin tarifa"></label>'; }).join('') +
        '<button class="promo-boton" id="promo-guardar">Guardar tarifas</button>');
    promoAccion(ov, '#promo-guardar', async function () {
        var datos = { capacidad: Number(ov.querySelector('#promo-capacidad').value), mensaje: ov.querySelector('#promo-mensaje').value, recargo_personal: Number(ov.querySelector('#promo-recargo').value), planes: cfg.planes.map(function (p) {
            var valor = ov.querySelector('[data-plan="' + p.id + '"]').value;
            return { id: p.id, precio: valor === '' ? null : Number(valor) };
        }) };
        await promoApi('/config', datos, 'PUT');
        ov.remove(); await sincronizarPromociones(); showToast('Tarifas guardadas en el servidor');
    });
}
