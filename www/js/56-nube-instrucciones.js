/* 56-nube-instrucciones.js - "Programar desde la nube": el super envia
   una instruccion a la cola del servidor; el listener local la entrega
   a Devin Cloud. Modulo aislado (borrar este archivo + la seccion
   view-nube + el script tag elimina toda la funcion). */

function prepararNube() {
    var u = usuarioActual();
    var btn0 = document.getElementById('btn-nube');
    /* Usuario convencional: el botón nunca se ve ni queda visible */
    if (!u || u.rol !== 'super') {
        if (btn0) btn0.hidden = true;
        return;
    }
    if (btn0) { btn0.hidden = false; return; }
    var salir = document.getElementById('btn-info-dev') || document.getElementById('btn-salir-perfil');
    if (!salir) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btn-nube';
    btn.className = 'perfil-btn-ajustes';
    btn.style.marginTop = '40px';
    btn.innerHTML = '<i class="fas fa-cloud"></i> Programar desde la nube';
    salir.parentNode.insertBefore(btn, salir);
    btn.onclick = abrirNube;
}

function nubeApi(ruta, opts) {
    opts = opts || {};
    if (opts.body !== undefined && typeof opts.body !== 'string') {
        opts.body = JSON.stringify(opts.body);
        opts.headers = { 'Content-Type': 'application/json' };
    }
    return fetch(apiUrl(ruta), opts).then(function (r) {
        return r.text().then(function (t) {
            try { return JSON.parse(t); }
            catch (e) { return { ok: false, error: 'Servidor respondió ' + r.status + ' sin JSON (sesión vencida o sin conexión)' }; }
        });
    });
}

function abrirNube() {
    var vista = document.getElementById('view-nube');
    if (!vista) return;
    vista.innerHTML = '<div class="perfil-card" style="text-align:left">' +
        '<h3><i class="fas fa-cloud"></i> Programar desde la nube</h3>' +
        '<p class="rep-sub">Escribí la instrucción para Devin. Queda en cola y una sesión en la nube la ejecuta sobre el repositorio.</p>' +
        '<a class="perfil-btn-ajustes" href="https://app.devin.ai/org/kenneth-ruiz-22d134db" target="_blank" rel="noopener" style="display:block;text-decoration:none;margin-bottom:10px"><i class="fas fa-arrow-up-right-from-square"></i> Ver sesiones de Devin en vivo</a>' +
        '<textarea id="nube-texto" rows="5" maxlength="4000" placeholder="Ej: agregá la subcategoría X en el grupo Y..." style="width:100%"></textarea>' +
        '<button class="emp-btn-guardar" id="nube-enviar" disabled style="margin-top:10px">Enviar a Devin</button>' +
        '<button class="perfil-btn-ajustes" id="nube-ping" style="margin-top:8px"><i class="fas fa-bolt"></i> Probar comunicación</button>' +
        '<button class="perfil-btn-ajustes" id="nube-clave" style="margin-top:8px"><i class="fas fa-key"></i> Clave del listener</button>' +
        '<div id="nube-clave-box" hidden style="margin-top:8px"></div>' +
        '<hr style="border:none;border-top:1px solid var(--border-soft);margin:14px 0">' +
        '<details class="evt-acordeon"><summary><i class="fas fa-list"></i> Instrucciones enviadas</summary>' +
        '<div id="nube-lista" style="margin-top:8px"></div>' +
        '<div id="nube-pagina" style="display:flex;gap:8px;justify-content:center;margin-top:8px"></div>' +
        '<button class="rep-cancelar" id="nube-exportar" style="margin-top:8px;padding:5px 12px;font-size:.8rem"><i class="fas fa-file-arrow-down"></i> Exportar a TXT</button></details>' +
        '<details class="evt-acordeon" open><summary><i class="fas fa-terminal"></i> Consola</summary>' +
        '<div id="nube-consola" style="background:#0f172a;color:#86efac;font-family:monospace;font-size:.72rem;padding:10px;border-radius:8px;height:200px;overflow-y:auto;margin-top:8px"></div>' +
        '<div style="display:flex;gap:8px;margin-top:6px">' +
        '<button class="rep-cancelar" id="nube-copiar" style="margin:0;padding:6px 14px;font-size:.8rem;flex:1"><i class="fas fa-copy"></i> Copiar consola</button>' +
        '<button class="rep-cancelar" id="nube-limpiar" style="margin:0;padding:6px 14px;font-size:.8rem;flex:1"><i class="fas fa-eraser"></i> Limpiar consola</button></div></details>' +
        '<button class="perfil-btn-ajustes" id="nube-volver" style="margin-top:14px"><i class="fas fa-arrow-left"></i> Volver a mi perfil</button></div>';
    vista.querySelector('#nube-volver').onclick = function () { irAVista('view-perfil', 'Perfil'); };
    vista.querySelector('#nube-clave').onclick = function () {
        nubeApi('/api/instrucciones/clave').then(function (json) {
            var box = vista.querySelector('#nube-clave-box');
            box.hidden = false;
            box.innerHTML = json.clave
                ? '<p class="rep-sub">Pegá esta clave en .env como INSTRUC_KEY=</p>' +
                  '<div class="dic-item"><b id="nube-key">' + escapeHtml(json.clave) + '</b></div>'
                : '<p class="rep-sub">No se pudo generar la clave.</p>';
        });
    };
    var ta = vista.querySelector('#nube-texto');
    var btn = vista.querySelector('#nube-enviar');
    ta.addEventListener('input', function () { btn.disabled = ta.value.trim().length < 5; });
    vista.querySelector('#nube-ping').onclick = function () {
        nubeLog('> ping enviado');
        nubeApi('/api/instrucciones', { method: 'POST', body: { texto: '[ping] ' + Date.now() } })
            .then(function (json) {
                if (!json.ok) { nubeLog('ping fallo: ' + JSON.stringify(json)); return; }
                nubeLog('ping #' + json.id + ' en cola; esperando respuesta...');
                var t0 = Date.now();
                var t = setInterval(function () {
                    nubeApi('/api/instrucciones').then(function (cola) {
                        var fila = (cola.instrucciones || []).filter(function (i) { return i.id === json.id; })[0];
                        if (fila && fila.estado === 'tomada') {
                            clearInterval(t);
                            var ms = Date.now() - t0;
                            nubeLog('PING OK: ida y vuelta en ' + (ms / 1000).toFixed(1) + 's (celular → servidor → PC → vuelta)');
                            showToast('Comunicación con Devin: OK (' + (ms / 1000).toFixed(1) + 's)');
                        } else if (Date.now() - t0 > 30000) {
                            clearInterval(t);
                            nubeLog('PING sin respuesta en 30s: el listener no esta corriendo');
                        }
                    });
                }, 1000);
            });
    };
    vista.querySelector('#nube-exportar').onclick = function () {
        var lista = _nubeTodas.length ? _nubeTodas : [];
        if (!lista.length) { showToast('No hay instrucciones para exportar'); return; }
        var txt = 'INSTRUCCIONES ENVIADAS A DEVIN - ' + new Date().toLocaleString('es-CR') + '\n' +
            '='.repeat(60) + '\n\n' + lista.map(function (i) {
                return '#' + i.id + ' [' + (i.estado === 'pendiente' ? 'EN COLA' : i.estado.toUpperCase()) + ']' +
                    ' ' + new Date(i.ts * 1000).toLocaleString('es-CR') +
                    (i.sesion ? '\nSesion: ' + i.sesion : '') +
                    '\n' + i.texto + '\n' + '-'.repeat(60);
            }).join('\n');
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
        a.download = 'instrucciones-devin.txt';
        a.click();
        showToast('Exportadas ' + lista.length + ' instrucciones');
    };
    vista.querySelector('#nube-limpiar').onclick = function () {
        vista.querySelector('#nube-consola').innerHTML = '';
        nubeLog('consola limpiada');
    };
    vista.querySelector('#nube-copiar').onclick = function () {
        var texto = vista.querySelector('#nube-consola').innerText;
        if (navigator.clipboard) navigator.clipboard.writeText(texto).then(function () { showToast('Consola copiada'); });
        else { var r = document.createRange(); r.selectNodeContents(vista.querySelector('#nube-consola')); getSelection().addRange(r); showToast('Seleccioná y copiá manualmente'); }
    };
    btn.onclick = function () {
        btn.disabled = true;
        var texto = ta.value.trim();
        nubeLog('> POST /api/instrucciones (' + texto.length + ' caracteres)');
        nubeApi('/api/instrucciones', { method: 'POST', body: { texto: texto } })
            .then(function (json) {
                nubeLog('respuesta: ' + JSON.stringify(json));
                if (!json.ok) throw new Error(json.error || 'Error al enviar');
                ta.value = '';
                showToast('Instrucción enviada a la cola de Devin');
                pintarNube();
            })
            .catch(function (e) { nubeLog('ERROR: ' + e.message); showToast(e.message); btn.disabled = false; });
    };
    pintarNube();
    irAVista('view-nube', 'Programar desde la nube');
}

var _nubePagina = 0, _nubeTodas = [];

/* Consola de diagnostico: hora + linea; se puede copiar entera. */
function nubeLog(msg) {
    var con = document.getElementById('nube-consola');
    if (!con) return;
    var hora = new Date().toLocaleTimeString('es-CR');
    con.innerHTML += '<div>[' + hora + '] ' + escapeHtml(String(msg)) + '</div>';
    con.scrollTop = con.scrollHeight;
}

function pintarNube() {
    var box = document.getElementById('nube-lista');
    if (!box) return;
    nubeApi('/api/instrucciones').then(function (json) {
        nubeLog('GET cola: ' + JSON.stringify(json).slice(0, 300));
        var lista = (json && json.instrucciones) || [];
        _nubeTodas = lista;
        var porPag = 20, total = lista.length, paginas = Math.max(1, Math.ceil(total / porPag));
        if (_nubePagina >= paginas) _nubePagina = paginas - 1;
        var corte = lista.slice(_nubePagina * porPag, (_nubePagina + 1) * porPag);
        box.innerHTML = corte.length ? corte.map(function (i) {
            return '<div class="dic-item"><b>#' + i.id + ' · ' + (i.estado === 'pendiente' ? 'en cola' : i.estado) + '</b>' +
                ' <small>' + new Date(i.ts * 1000).toLocaleString('es-CR') + '</small>' +
                (i.sesion ? '<br><a href="' + escapeHtml(i.sesion) + '" style="font-size:.82rem;color:var(--primary-color)"><i class="fas fa-eye"></i> Ver sesión en vivo</a>' : '') +
                '<br><small>' + escapeHtml(i.texto) + '</small></div>';
        }).join('') : '<p class="rep-sub">Sin instrucciones todavía.</p>';
        var pag = document.getElementById('nube-pagina');
        if (pag) pag.innerHTML = paginas > 1
            ? '<button class="rep-cancelar" id="np-ant" ' + (_nubePagina === 0 ? 'disabled' : '') + ' style="padding:4px 12px">◀</button>' +
              '<span class="rep-sub" style="align-self:center">' + (_nubePagina + 1) + '/' + paginas + '</span>' +
              '<button class="rep-cancelar" id="np-sig" ' + (_nubePagina >= paginas - 1 ? 'disabled' : '') + ' style="padding:4px 12px">▶</button>'
            : '';
        var ant = document.getElementById('np-ant'), sig = document.getElementById('np-sig');
        if (ant) ant.onclick = function () { _nubePagina--; pintarNube(); };
        if (sig) sig.onclick = function () { _nubePagina++; pintarNube(); };
    }).catch(function (e) { nubeLog('ERROR cola: ' + e.message); box.innerHTML = '<p class="rep-sub">No se pudo cargar la cola.</p>'; });
}
