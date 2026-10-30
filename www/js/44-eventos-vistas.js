function renderEventos() {
    var lista = document.getElementById('lista-notas'); if (!lista) return;
    var eventos = eventosPublicos();
    lista.innerHTML = (Eventos.errorServidor ? '<p class="evt-nota">' + escapeHtml(Eventos.errorServidor) + '. Se muestra la última información pública disponible.</p>' : '') + (eventos.length ? eventos.map(function (e) {
        return '<button type="button" class="evt-card" data-evento="' + escapeHtml(e.id) + '"><span class="evt-etiqueta">' + escapeHtml(e.etiquetaNombre) + '</span><strong>' + escapeHtml(e.titulo) + '</strong><span>' + eventoFecha(e.inicio) + '</span><span>' + escapeHtml(e.lugar) + '</span><span>Ver información del evento</span></button>';
    }).join('') : '<p class="vacio">No hay eventos aprobados y vigentes.</p>');
    clearTimeout(Eventos.vencimiento);
    if (eventos.length) Eventos.vencimiento = setTimeout(renderEventos, Math.min(2147483647, Math.max(1, (Math.min.apply(null, eventos.map(function (e) { return e.expires; })) - eventoAhora()) * 1000 + 30)));
}

function buscarEventos(q, digitos) {
    return eventosPublicos().filter(function (e) { return ['titulo', 'texto', 'lugar', 'contacto', 'telefono', 'etiquetaNombre', 'fecha'].some(function (k) { return campoCoincide(e[k] || '', q, digitos); }); });
}

async function abrirEvento(id) {
    var e, sinConexion = false;
    try { e = await eventoApi('/' + encodeURIComponent(id)); }
    catch (error) {
        if (error.status && error.status < 500) throw error;
        e = eventosPublicos().find(function (n) { return n.id === id; });
        if (!e) throw error;
        e = Object.assign({}, e, { editable: false, superusuario: false }); sinConexion = true;
    }
    var tel = String(e.telefono || '').replace(/\D/g, '').slice(-8);
    var html = '<span class="evt-etiqueta">' + escapeHtml(e.etiquetaNombre) + '</span>' +
        '<p><b>Inicio:</b> ' + eventoFecha(e.inicio) + '</p><p><b>Finalización:</b> ' + eventoFecha(e.fin) + '</p>' +
        '<p><b>Lugar:</b> ' + escapeHtml(e.lugar) + '</p><p><b>Contacto:</b> ' + escapeHtml(e.contacto) + '</p><p><b>Teléfono:</b> ' + escapeHtml(e.telefono) + '</p>' +
        (tel.length === 8 ? '<a class="evt-boton" href="tel:+506' + tel + '">Llamar al contacto</a>' : '') +
        '<h4>Descripción</h4><p class="evt-descripcion">' + escapeHtml(e.texto) + '</p><p><small>El anuncio finaliza: ' + eventoFecha(e.expires) + ' · Costa Rica</small></p>';
    if (sinConexion) html += '<p class="evt-nota">Sin conexión: última versión pública sincronizada. Conectate para conocer cambios o cancelaciones y para administrar el evento.</p>';
    if (e.editable) {
        html += '<hr><p><b>Estado:</b> ' + escapeHtml(e.estado) + (e.expires <= eventoAhora() ? ' · anuncio vencido' : '') + '</p><p>' + escapeHtml(e.motivo) + '</p><p><b>Correo creador:</b> ' + escapeHtml(e.owner || 'No consta en el registro anterior') + '</p>';
        html += e.precio === 0 ? '<p class="evt-nota">Anuncio sin tarifa. Solo requiere aprobación del superusuario.</p>' : e.paid_at ? '<p class="evt-nota">Pago aprobado: ' + eventoMoneda(e.precio) + '. Se conserva al editar; no se genera otro cobro automático.</p>' : e.precio ? instruccionesPagoEvento(e.pago, e.precio) : '<p>Registro anterior: completá sus datos y tarifa usando Editar evento.</p>';
        html += '<div class="evt-acciones"><button class="evt-boton" id="evt-editar">Editar evento</button><button class="evt-boton" id="evt-cancelar">Cancelar publicación</button>';
        if (e.superusuario) html += e.estado === 'aprobado' ? '<button class="evt-boton" id="evt-revocar">Revocar publicación</button>' : '<button class="evt-boton" id="evt-aprobar">' + (e.paid_at ? 'Volver a aprobar evento' : 'Confirmar pago y publicar') + '</button><button class="evt-boton" id="evt-rechazar">No confirmar · dejar pendiente</button>';
        html += '</div><details><summary>Historial del evento</summary>' + (e.historial || []).map(function (h) { return '<p>' + escapeHtml(h.accion) + ' · ' + escapeHtml(h.actor || 'Importación') + ' · ' + eventoFecha(h.ts) + '</p>'; }).join('') + '</details>';
    }
    var ov = eventoModal(e.titulo, html);
    if (e.editable) {
        eventoAccion(ov, '#evt-editar', async function () { await abrirEdicionEvento(e.id); ov.cerrar(); });
        ['cancelar', 'revocar', 'rechazar', 'aprobar'].forEach(function (accion) {
            if (ov.querySelector('#evt-' + accion)) eventoAccion(ov, '#evt-' + accion, async function () { confirmarAccionEvento(e, accion, ov); });
        });
    }
}

function confirmarAccionEvento(e, accion, origen) {
    var aprobar = accion === 'aprobar';
    var ov = eventoModal(aprobar ? 'Confirmar evento' : 'Dejar evento pendiente',
        '<h4>' + escapeHtml(e.titulo) + '</h4><p>' + (aprobar ? (e.paid_at && e.precio ? 'Se reutiliza el pago ya aprobado. Confirmá que corresponde volver a publicar este evento.' : e.precio === 0 ? 'Este anuncio no requiere pago. Confirmá la publicación del evento.' : 'Confirmá únicamente si comprobaste el pago real de ' + (e.precio ? eventoMoneda(e.precio) : 'la tarifa pendiente') + '. La declaración del creador no equivale a un pago verificado.') : 'Se retira de la sección pública, pero no se borra. Un superusuario podrá encontrarlo y volver a aprobarlo.') + '</p><button class="evt-boton" id="evt-confirmar">' + (aprobar ? 'Confirmar y publicar' : 'Confirmar · conservar pendiente') + '</button>');
    eventoAccion(ov, '#evt-confirmar', async function () {
        await eventoApi('/' + encodeURIComponent(e.id) + '/acciones/' + accion, { revision: e.revision });
        ov.cerrar(); origen.cerrar(); await sincronizarEventos(); await abrirEvento(e.id);
    });
}

document.addEventListener('click', function (ev) {
    var card = ev.target.closest('[data-evento]');
    if (!card || card.disabled) return;
    card.disabled = true;
    abrirEvento(card.dataset.evento).catch(function (error) { showToast(error.message); }).finally(function () { card.disabled = false; });
});
