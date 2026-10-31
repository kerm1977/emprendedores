/* 58-mi-historial.js - "Mi historial" para TODO usuario logueado:
   likes dados, usuarios/negocios bloqueados (con desbloquear),
   reportes de problema del sitio y denuncias a comercios.
   Cada seccion muestra 10 registros por pagina. */

var _histPag = { likes: 0, bloq: 0, sitio: 0, den: 0 };

function prepararMiHistorial() {
    if (document.getElementById('btn-mi-historial')) return;
    var u = usuarioActual();
    if (!u) return;
    var salir = document.getElementById('btn-info-dev') || document.getElementById('btn-salir-perfil');
    if (!salir) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btn-mi-historial';
    btn.className = 'perfil-btn-ajustes';
    btn.innerHTML = '<i class="fas fa-clock-rotate-left"></i> Mi historial';
    salir.parentNode.insertBefore(btn, salir);
    btn.onclick = abrirMiHistorial;
}

/* Acordeon paginado: 10 por pagina en todas las secciones */
function _histSeccion(titulo, icono, items, clave, filaHtml, vacio) {
    var porPag = 10, paginas = Math.max(1, Math.ceil(items.length / porPag));
    if (_histPag[clave] >= paginas) _histPag[clave] = paginas - 1;
    var ini = _histPag[clave] * porPag;
    var cuerpo = items.length
        ? items.slice(ini, ini + porPag).map(filaHtml).join('')
        : '<p class="rep-sub">' + vacio + '</p>';
    var nav = paginas > 1
        ? '<div class="evt-acciones" style="justify-content:center;margin:8px 0">' +
          '<button class="rep-cancelar" data-pag="' + clave + '" data-dir="-1"' + (_histPag[clave] ? '' : ' disabled') + '>«</button>' +
          '<span class="rep-sub" style="align-self:center">' + (_histPag[clave] + 1) + '/' + paginas + '</span>' +
          '<button class="rep-cancelar" data-pag="' + clave + '" data-dir="1"' + (_histPag[clave] + 1 < paginas ? '' : ' disabled') + '>»</button></div>'
        : '';
    return '<details class="evt-acordeon"' + (clave === 'likes' ? ' open' : '') + '><summary><i class="fas ' + icono + '"></i> ' + titulo + ' (' + items.length + ')</summary>' + cuerpo + nav + '</details>';
}

function abrirMiHistorial() {
    var u = usuarioActual();
    var vista = document.getElementById('view-mi-historial');
    if (!u || !vista) return;
    var me = String(u.email).trim().toLowerCase();
    var gustados = (App.data.emprendimientos || []).filter(function (e) {
        return (e.likes || []).some(function (l) { return _likeEm(l) === me && !l.retiradoEn; });
    });
    var mios = (App.data.bloqueados || {})[u.email] || [];
    var repSitio = (App.data.notificaciones || []).filter(function (n) {
        return n.tipo === 'problema' && String(n.texto || '').indexOf(me) === 0;
    });
    var denuncias = (App.data.reportes || []).filter(function (r) {
        return String(r.usuario || '').trim().toLowerCase() === me;
    });

    vista.innerHTML = '<div class="perfil-card" style="text-align:left">' +
        '<h3><i class="fas fa-clock-rotate-left"></i> Mi historial</h3>' +
        _histSeccion('Comercios que me gustan', 'fa-heart', gustados, 'likes', function (e) {
            return '<div class="dic-item"><b>' + escapeHtml(e.nombre) + '</b> · ' + escapeHtml(e.categoria || '') +
                ' <button class="rep-cancelar" data-ver="' + e.id + '" style="padding:3px 10px;font-size:.78rem">Ver</button></div>';
        }, 'Todavía no diste like a ningún comercio.') +
        _histSeccion('Bloqueados por mí', 'fa-ban', mios, 'bloq', function (b) {
            return '<div class="dic-item"><b>' + escapeHtml(b.nombre || b.email) + '</b> · ' + escapeHtml(b.email) +
                ' <button class="rep-cancelar" data-desb="' + escapeHtml(b.email) + '">Desbloquear</button></div>';
        }, 'No tenés a nadie bloqueado.') +
        _histSeccion('Problemas del sitio reportados', 'fa-bug', repSitio, 'sitio', function (n) {
            return '<div class="dic-item"><small>' + new Date(n.ts).toLocaleString('es-CR') + '</small><br>' + escapeHtml(String(n.texto).slice(0, 140)) + '</div>';
        }, 'No has reportado problemas del sitio.') +
        _histSeccion('Denuncias a comercios', 'fa-flag', denuncias, 'den', function (r) {
            return '<div class="dic-item"><b>' + escapeHtml(r.emprendimiento || '') + '</b> · ' + escapeHtml(r.motivo || '') +
                '<br><small>' + new Date(r.ts).toLocaleString('es-CR') + ' · ' + escapeHtml(r.estado || 'pendiente') + '</small></div>';
        }, 'No has denunciado comercios.') +
        '<button class="perfil-btn-ajustes" id="hist-volver" style="margin-top:14px"><i class="fas fa-arrow-left"></i> Volver a mi perfil</button></div>';
    vista.querySelector('#hist-volver').onclick = function () { irAVista('view-perfil', 'Perfil'); };
    vista.addEventListener('click', function (e) {
        var pg = e.target.closest('[data-pag]');
        if (pg) { _histPag[pg.dataset.pag] += Number(pg.dataset.dir); abrirMiHistorial(); return; }
        var v = e.target.closest('[data-ver]');
        if (v) verEmprendimiento(v.dataset.ver);
        var d = e.target.closest('[data-desb]');
        if (d && confirm('¿Desbloquear a ' + d.dataset.desb + '?')) {
            var mapa = App.data.bloqueados = App.data.bloqueados || {};
            mapa[u.email] = (mapa[u.email] || []).filter(function (b) { return b.email !== d.dataset.desb; });
            saveDataAhora(); abrirMiHistorial(); showToast('Desbloqueado');
        }
    });
    irAVista('view-mi-historial', 'Mi historial');
}
