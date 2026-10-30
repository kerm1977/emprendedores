var EVENTO_CAMPOS = { titulo: 'fer-nombre', fecha: 'fer-fecha', horaInicio: 'fer-hora-inicio', horaFin: 'fer-hora-fin', lugar: 'fer-lugar', contacto: 'fer-contacto', telefono: 'fer-telefono', texto: 'fer-desc' };

function solicitudEventoNueva() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    return Array.from(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

async function prepararNuevoEvento() {
    if (!requiereLogin() || Eventos.nuevoEnProceso) return;
    Eventos.nuevoEnProceso = true;
    try { await prepararFormularioEvento(null); }
    finally { Eventos.nuevoEnProceso = false; }
}

async function abrirEdicionEvento(id) {
    var e = await eventoApi('/' + encodeURIComponent(id));
    if (!e.editable) throw new Error('Solo el creador y los superusuarios pueden editar el evento');
    await prepararFormularioEvento(e);
}

async function prepararFormularioEvento(e) {
    var cfg = await eventoApi('/opciones');
    var form = document.getElementById('form-feria');
    if (!form) throw new Error('El formulario sigue cargando. Intentá abrirlo nuevamente.');
    form.reset(); Eventos.editando = e; Eventos.solicitud = e ? null : solicitudEventoNueva();
    Object.keys(EVENTO_CAMPOS).forEach(function (k) { document.getElementById(EVENTO_CAMPOS[k]).value = e ? e[k] || '' : ''; });
    var etiquetas = cfg.etiquetas.slice();
    if (e && !etiquetas.some(function (t) { return t.id === e.etiqueta; })) etiquetas.push({ id: e.etiqueta, nombre: e.etiquetaNombre + ' (etiqueta anterior)', precio: null });
    var select = document.getElementById('fer-etiqueta');
    select.innerHTML = '<option value="">Elegí una etiqueta</option>' + etiquetas.map(function (t) { return '<option value="' + escapeHtml(t.id) + '">' + escapeHtml(t.nombre) + (t.precio ? ' · ' + eventoMoneda(t.precio) : ' · tarifa pendiente') + '</option>'; }).join('');
    select.value = e ? e.etiqueta : '';
    document.getElementById('fer-titulo-form').textContent = e ? 'Editar evento' : 'Nuevo evento';
    document.getElementById('fer-guardar').textContent = e ? 'Guardar cambios' : 'Guardar evento';
    document.getElementById('fer-info').textContent = e && e.paid_at ? 'Se conserva el pago aprobado. ' + (e.estado === 'aprobado' ? 'Los cambios se publican directamente.' : 'El evento sigue pendiente hasta que un superusuario lo apruebe.') : 'El anuncio requiere pago y aprobación del superusuario. Los datos no se publican al guardar la solicitud.';
    irAVista('view-feria', e ? 'Editar evento' : 'Nuevo evento');
    window.scrollTo({ top: 0, behavior: 'auto' });
}

function datosFormularioEvento() {
    var datos = { etiqueta: document.getElementById('fer-etiqueta').value };
    Object.keys(EVENTO_CAMPOS).forEach(function (k) { datos[k] = document.getElementById(EVENTO_CAMPOS[k]).value.trim(); });
    return datos;
}

function instruccionesPagoEvento(pago, precio) {
    var sinpe = pago.sinpe, cuentas = Array.isArray(pago.cuentas) ? pago.cuentas : [];
    var html = '<p class="evt-nota">Este anuncio constituye un cobro de ' + eventoMoneda(precio) + '.</p>';
    if (typeof sinpe === 'string') { if (sinpe) html += '<p><b>SINPE Móvil:</b> ' + escapeHtml(sinpe) + '</p>'; }
    else if (sinpe && sinpe.telefono) {
        html += '<p><b>SINPE Móvil:</b> ' + escapeHtml(sinpe.telefono) + (sinpe.nombre ? ' — ' + escapeHtml(sinpe.nombre) : '') + '</p>';
    }
    cuentas.forEach(function (c) {
        html += '<p><b>Cuenta ' + escapeHtml(c.banco || '') + ' ' + escapeHtml(c.moneda || '') + ':</b> ' + escapeHtml(c.cuenta || '') + (c.nombre ? ' — ' + escapeHtml(c.nombre) : '') + '</p>';
    });
    if (typeof pago.cuenta === 'string' && pago.cuenta) html += '<p><b>Cuenta bancaria:</b> ' + escapeHtml(pago.cuenta) + '</p>';
    return html + '<p class="evt-descripcion">' + escapeHtml(pago.mensaje || '') + '</p>';
}

async function guardarEvento(ev) {
    ev.preventDefault();
    if (!requiereLogin()) return;
    var boton = document.getElementById('fer-guardar'); boton.disabled = true;
    try {
        var datos = datosFormularioEvento(), anterior = Eventos.editando;
        if (anterior) datos.revision = anterior.revision;
        else datos.solicitud = Eventos.solicitud;
        var pagado = anterior && anterior.paid_at;
        var cuota = pagado ? null : await eventoApi('/cotizar', datos);
        if (cuota) { datos.precio = cuota.precio; datos.config_revision = cuota.config_revision; }
        var texto = pagado
            ? (anterior.precio === 0 ? '<p class="evt-nota">Anuncio sin tarifa. Se conserva la aprobación; no hay cobro.</p>' : '<p class="evt-nota">Se conserva el pago aprobado de ' + eventoMoneda(anterior.precio) + '. No se genera un nuevo cobro automático.</p>')
            : (cuota.gratuito ? '<p class="evt-nota">Este tipo de anuncio no requiere pago. Solo necesita la aprobación del superusuario.</p>' : instruccionesPagoEvento(cuota.pago, cuota.precio));
        var ov = eventoModal(pagado ? 'Confirmar cambios del evento' : 'Anuncio de evento · pago y aprobación',
            '<h4>' + escapeHtml(datos.titulo) + '</h4>' + texto +
            '<p>El anuncio finaliza 24 horas después del horario final del evento, en hora de Costa Rica.' + (cuota ? ' Vencimiento: ' + eventoFecha(cuota.expires) + '.' : '') + '</p>' +
            '<p>' + (pagado && anterior.estado === 'aprobado' ? 'Los cambios se publicarán directamente.' : (cuota && cuota.gratuito ? 'Quedará pendiente hasta que un superusuario lo apruebe.' : 'Quedará pendiente hasta que un superusuario compruebe el pago y lo apruebe.')) + ' Este botón no realiza cargos.</p>' +
            '<button type="button" class="evt-boton" id="evt-enviar">' + (pagado ? 'Guardar cambios' : 'Guardar solicitud pendiente') + '</button>');
        eventoAccion(ov, '#evt-enviar', async function () {
            var guardado = await eventoApi(anterior ? '/' + encodeURIComponent(anterior.id) : '', datos, anterior ? 'PUT' : 'POST');
            ov.cerrar(); Eventos.editando = null; Eventos.solicitud = null;
            document.getElementById('form-feria').reset();
            await sincronizarEventos(); irAVista('view-notas', 'Eventos de emprendedores');
            showToast(guardado.estado === 'aprobado' ? 'Evento actualizado y publicado' : 'Evento guardado pendiente de aprobación');
            await abrirEvento(guardado.id);
        });
    } catch (error) { showToast(error.message); }
    finally { boton.disabled = false; }
}
