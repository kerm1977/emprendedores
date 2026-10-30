async function abrirAdministracionEventos(q, pagina) {
    q = q || ''; pagina = pagina || 0;
    var panel = await eventoApi('/panel?q=' + encodeURIComponent(q) + '&pagina=' + pagina);
    var ov = eventoModal('Administrar y promocionar eventos',
        '<div class="evt-acciones"><button class="evt-boton" id="evt-nuevo">Nuevo evento</button>' + (panel.superusuario ? '<button class="evt-boton" id="evt-tarifas">Etiquetas, tarifas y datos de pago</button>' : '') + '</div>' +
        '<p>Los eventos no confirmados, cancelados o revocados se conservan pendientes. Solo un superusuario puede aceptarlos y publicarlos.</p>' +
        '<form id="evt-busqueda"><label>Buscar evento, creador o contacto<input id="evt-query" maxlength="160" value="' + escapeHtml(q) + '"></label><button type="submit" class="evt-boton">Buscar</button></form>' +
        '<p>' + panel.total + ' registros · página ' + (panel.pagina + 1) + ' de ' + panel.paginas + '</p>' +
        (panel.eventos.length ? panel.eventos.map(function (e) {
            return '<div class="evt-fila"><strong>' + escapeHtml(e.titulo) + '</strong><p>' + escapeHtml(e.etiquetaNombre) + ' · ' + escapeHtml(e.estado) + (e.expires <= eventoAhora() ? ' · anuncio vencido' : '') + '</p><p>' + escapeHtml(e.owner || 'Creador no registrado en la feria anterior') + '</p><p>' + escapeHtml(e.motivo) + '</p><p>' + eventoFecha(e.inicio) + '</p><button class="evt-boton" data-ver-evento="' + escapeHtml(e.id) + '">Ver y administrar</button></div>';
        }).join('') : '<p>No hay eventos para esta búsqueda.</p>') +
        '<div class="evt-acciones">' + (pagina ? '<button class="evt-boton" id="evt-anterior">Anterior</button>' : '') + (pagina + 1 < panel.paginas ? '<button class="evt-boton" id="evt-siguiente">Siguiente</button>' : '') + '</div>');
    ov.querySelector('#evt-nuevo').onclick = function () { ov.cerrar(); prepararNuevoEvento().catch(function (e) { showToast(e.message); }); };
    if (panel.superusuario) ov.querySelector('#evt-tarifas').onclick = function () { ov.cerrar(); abrirConfiguracionEventos(panel.config); };
    ov.querySelector('#evt-busqueda').onsubmit = function (ev) {
        ev.preventDefault(); var busqueda = ov.querySelector('#evt-query').value.trim();
        ov.cerrar(); abrirAdministracionEventos(busqueda, 0).catch(function (e) { showToast(e.message); });
    };
    ov.querySelectorAll('[data-ver-evento]').forEach(function (btn) { btn.onclick = function () { ov.cerrar(); abrirEvento(btn.dataset.verEvento).catch(function (e) { showToast(e.message); }); }; });
    ['anterior', 'siguiente'].forEach(function (tipo) {
        var btn = ov.querySelector('#evt-' + tipo);
        if (btn) btn.onclick = function () { ov.cerrar(); abrirAdministracionEventos(q, pagina + (tipo === 'anterior' ? -1 : 1)).catch(function (e) { showToast(e.message); }); };
    });
}

function filaEtiquetaEvento(e) {
    return '<div class="evt-fila" data-etiqueta-id="' + escapeHtml(e.id || '') + '"><details class="evt-acordeon"' + (e.id ? '' : ' open') + '><summary>' + escapeHtml(e.nombre || 'Nueva etiqueta') + '</summary>' +
        '<label>Nombre de la etiqueta<input data-nombre value="' + escapeHtml(e.nombre || '') + '" maxlength="80" style="text-transform:capitalize"></label>' +
        '<label>Valor del anuncio en colones<input data-precio type="number" inputmode="numeric" pattern="[0-9]*" min="1" max="100000000" value="' + (e.precio || '') + '" placeholder="Sin tarifa"' + (e.gratis ? ' disabled' : '') + '></label>' +
        '<label class="evt-check"><input data-gratis type="checkbox"' + (e.gratis ? ' checked' : '') + '> No se requiere precio (anuncio gratuito)</label>' +
        '<label class="evt-check"><input data-activo type="checkbox"' + (e.activo !== false ? ' checked' : '') + '> Habilitada para nuevos eventos</label>' +
        (!e.id ? '<button class="evt-boton" type="button" data-quitar-etiqueta>Quitar etiqueta nueva</button>' : '<small>Para retirarla del selector, desactivala; no se borran eventos anteriores.</small>') +
        '</details></div>';
}

function abrirConfiguracionEventos(cfg) {
    var sinpes = cfg.sinpes.slice(), cuentas = cfg.cuentas.slice();
    var seleccionadas = new Set(cfg.seleccion_cuentas || []);
    var ov = eventoModal('Configuración independiente de eventos',
        '<p>Solo superusuarios pueden guardar etiquetas, precios y destinos. No se realizan cobros automáticos.</p>' +
        '<details class="evt-acordeon"><summary>Formas de pago</summary>' +
        '<label>Teléfono SINPE Móvil<select id="evt-sinpe"></select></label>' +
        '<div id="evt-sinpe-nuevo" hidden><label>Nombre del SINPE<input id="evt-sinpe-nombre" maxlength="160" placeholder="Nombre de la persona"></label><label>Número de teléfono<input id="evt-sinpe-tel" maxlength="80" placeholder="Ej: 88881234"></label><button class="evt-boton" type="button" id="evt-sinpe-agregar">Agregar número SINPE</button></div>' +
        '<div class="emp-campo"><span>Cuentas bancarias</span><div id="evt-cuentas"></div></div>' +
        '<button class="evt-boton" type="button" id="evt-cuenta-toggle">Agregar otro número de cuenta</button>' +
        '<div id="evt-cuenta-nueva" hidden><label>Nombre de la cuenta<input id="evt-cuenta-nombre" maxlength="160" placeholder="Titular"></label><label>Banco<input id="evt-cuenta-banco" maxlength="160" placeholder="Ej: BCR, MUCAP, BN..."></label><label>Moneda<select id="evt-cuenta-moneda"><option value="colones">colones</option><option value="dólares">dólares</option></select></label><label>Número de cuenta<input id="evt-cuenta-iban" maxlength="160" placeholder="CR..."></label><button class="evt-boton" type="button" id="evt-cuenta-agregar">Agregar cuenta</button></div>' +
        '<label>Mensaje e instrucciones de pago<textarea id="evt-mensaje" rows="4" maxlength="3000">' + escapeHtml(cfg.mensaje) + '</textarea></label></details>' +
        '<h4>Etiquetas y valores por evento</h4><div id="evt-etiquetas">' + cfg.etiquetas.map(filaEtiquetaEvento).join('') + '</div>' +
        '<button class="evt-boton" id="evt-agregar-etiqueta">Agregar etiqueta</button><button class="evt-boton" id="evt-guardar-config">Guardar configuración</button>');
    var selSinpe = ov.querySelector('#evt-sinpe'), boxCuentas = ov.querySelector('#evt-cuentas');
    function pintarSinpe() {
        selSinpe.innerHTML = '<option value="">Sin SINPE / solo cuentas</option>' + sinpes.map(function (s) {
            return '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.telefono) + ' — ' + escapeHtml(s.nombre) + '</option>';
        }).join('') + '<option value="__nuevo__">Agregar otro número SINPE</option>';
        selSinpe.value = cfg.seleccion_sinpe || '';
    }
    function pintarCuentas() {
        boxCuentas.innerHTML = cuentas.map(function (c) {
            return '<label class="evt-check"><input type="checkbox" data-cuenta="' + escapeHtml(c.id) + '"' + (seleccionadas.has(c.id) ? ' checked' : '') + '> ' + escapeHtml(c.nombre) + ' · ' + escapeHtml(c.banco) + ' ' + escapeHtml(c.moneda) + ' → ' + escapeHtml(c.cuenta) + '</label>';
        }).join('') + '<label class="evt-check"><input type="checkbox" id="evt-ninguna"' + (seleccionadas.size ? '' : ' checked') + '> Ninguna / Solo usar SINPE</label>';
        boxCuentas.querySelectorAll('[data-cuenta]').forEach(function (chk) {
            chk.onchange = function () {
                if (chk.checked) seleccionadas.add(chk.dataset.cuenta); else seleccionadas.delete(chk.dataset.cuenta);
                ov.querySelector('#evt-ninguna').checked = !seleccionadas.size;
            };
        });
        ov.querySelector('#evt-ninguna').onchange = function () {
            if (this.checked) {
                seleccionadas.clear();
                boxCuentas.querySelectorAll('[data-cuenta]').forEach(function (c) { c.checked = false; });
            }
        };
    }
    pintarSinpe(); pintarCuentas();
    selSinpe.onchange = function () { ov.querySelector('#evt-sinpe-nuevo').hidden = selSinpe.value !== '__nuevo__'; };
    ov.querySelector('#evt-sinpe-agregar').onclick = function () {
        var nombre = ov.querySelector('#evt-sinpe-nombre').value.trim(), tel = ov.querySelector('#evt-sinpe-tel').value.trim();
        if (!nombre || !tel) { ov.querySelector('.evt-error').textContent = 'Completá el nombre y el número del SINPE'; return; }
        var s = { id: solicitudEventoNueva(), nombre: nombre, telefono: tel };
        sinpes.push(s); pintarSinpe(); selSinpe.value = s.id;
        ov.querySelector('#evt-sinpe-nuevo').hidden = true;
        ov.querySelector('.evt-error').textContent = '';
    };
    ov.querySelector('#evt-cuenta-toggle').onclick = function () { ov.querySelector('#evt-cuenta-nueva').hidden = !ov.querySelector('#evt-cuenta-nueva').hidden; };
    ov.querySelector('#evt-cuenta-agregar').onclick = function () {
        var c = { id: solicitudEventoNueva(), nombre: ov.querySelector('#evt-cuenta-nombre').value.trim(), banco: ov.querySelector('#evt-cuenta-banco').value.trim(), moneda: ov.querySelector('#evt-cuenta-moneda').value, cuenta: ov.querySelector('#evt-cuenta-iban').value.trim() };
        if (!c.nombre || !c.banco || !c.cuenta) { ov.querySelector('.evt-error').textContent = 'Completá nombre, banco y número de cuenta'; return; }
        cuentas.push(c); seleccionadas.add(c.id); pintarCuentas();
        ov.querySelector('#evt-cuenta-nueva').hidden = true;
        ov.querySelector('.evt-error').textContent = '';
    };
    ov.addEventListener('input', function (ev) {
        if (ev.target.matches('[data-precio]')) ev.target.value = ev.target.value.replace(/\D/g, '');
        if (ev.target.matches('[data-nombre]')) {
            var suma = ev.target.closest('details').querySelector('summary');
            suma.textContent = ev.target.value.trim() || 'Nueva etiqueta';
        }
    });
    ov.addEventListener('change', function (ev) {
        if (ev.target.matches('[data-gratis]')) {
            var precio = ev.target.closest('details').querySelector('[data-precio]');
            precio.disabled = ev.target.checked;
            if (ev.target.checked) precio.value = '';
        }
    });
    ov.querySelector('#evt-agregar-etiqueta').onclick = function () { ov.querySelector('#evt-etiquetas').insertAdjacentHTML('beforeend', filaEtiquetaEvento({})); };
    ov.addEventListener('click', function (ev) { var btn = ev.target.closest('[data-quitar-etiqueta]'); if (btn) btn.closest('[data-etiqueta-id]').remove(); });
    eventoAccion(ov, '#evt-guardar-config', async function () {
        if (selSinpe.value === '__nuevo__') throw new Error('Agregá el número SINPE nuevo o elegí otro destino');
        var datos = { revision: cfg.revision, mensaje: ov.querySelector('#evt-mensaje').value.trim(), sinpes: sinpes, seleccion_sinpe: selSinpe.value || null, cuentas: cuentas, seleccion_cuentas: Array.from(seleccionadas), etiquetas: Array.from(ov.querySelectorAll('[data-etiqueta-id]')).map(function (fila) {
            var precio = fila.querySelector('[data-precio]').value, gratis = fila.querySelector('[data-gratis]').checked;
            return { id: fila.dataset.etiquetaId, nombre: fila.querySelector('[data-nombre]').value.trim(), precio: gratis ? null : (precio === '' ? null : Number(precio)), gratis: gratis, activo: fila.querySelector('[data-activo]').checked };
        }) };
        var nueva = await eventoApi('/config', datos, 'PUT'); ov.cerrar(); showToast('Etiquetas, tarifas e instrucciones de eventos guardadas');
        await abrirConfiguracionEventos(nueva);
    });
}
