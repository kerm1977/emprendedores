/* BLINDADO (orden del usuario): prohibido modificar/eliminar
   sin orden explicita. Pedir permiso antes de tocar. */
/* 28-reportes.js - Reportar emprendimiento + Terminos de uso.
   El reporte lo envian usuarios logueados; queda en
   App.data.reportes y sincroniza al servidor. */

function abrirReporte(empId) {
    var u = usuarioActual();
    if (!u) { mostrarLogin(); return; }
    var e = (App.data.emprendimientos || []).find(function (x) {
        return String(x.id) === String(empId);
    });
    if (!e) return;
    if (esCreadorNegocio(e, u)) {
        showToast('No podés reportar tu propio emprendimiento');
        return;
    }
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja">' +
        '<h3><i class="fas fa-flag"></i> Reportar emprendimiento</h3>' +
        '<p class="rep-advertencia"><i class="fas fa-triangle-exclamation"></i> ' +
        'Reportar por competencia o sin criterio, fundamento ni evidencia puede ocasionar ' +
        'la suspensión o el bloqueo temporal de la cuenta de quien reporta, tras revisión del equipo.</p>' +
        '<p class="rep-sub"><b>' + escapeHtml(e.nombre) + '</b><br>' +
        'Reportado por: ' + escapeHtml(u.email) + '</p>' +
        '<div class="rep-motivos">' +
        ['Contenido peligroso', 'Falsedad de empresa',
         'Falsedad de productos', 'Robo', 'Fraude', 'Otro'].map(function (m) {
            return '<button type="button" class="rep-motivo" ' +
                'data-m="' + m + '"><i class="fas fa-triangle-' +
                'exclamation"></i> ' + m + '</button>';
        }).join('') +
        '</div>' +
        '<textarea id="rep-texto" class="rep-txt" ' +
            'placeholder="Describí qué sucedió y tu experiencia...">' +
        '</textarea>' +
        '<button class="emp-btn-guardar" id="rep-enviar" disabled>' +
            'Enviar reporte</button>' +
        '<button class="rep-cancelar" id="rep-cerrar">Cancelar</button>' +
        '</div>';
    var motivo = '';
    ov.querySelectorAll('.rep-motivo').forEach(function (b) {
        b.onclick = function () {
            motivo = b.dataset.m;
            ov.querySelectorAll('.rep-motivo').forEach(function (x) {
                x.classList.remove('on');
            });
            b.classList.add('on');
            ov.querySelector('#rep-enviar').disabled = !motivo;
        };
    });
    ov.querySelector('#rep-cerrar').onclick = function () { ov.remove(); };
    ov.onclick = function (ev) { if (ev.target === ov) ov.remove(); };
    ov.querySelector('#rep-enviar').onclick = async function () {
        var actual = usuarioActual();
        if (!actual || actual.email !== u.email || esCreadorNegocio(e, actual)) {
            showToast('Esta sesión no puede enviar el reporte');
            ov.remove();
            return;
        }
        App.data.reportes = App.data.reportes || [];
        App.data.reportes.push({
            empId: e.id, emprendimiento: e.nombre,
            usuario: u.email, motivo: motivo,
            estado: 'pendiente',
            texto: ov.querySelector('#rep-texto').value.trim(),
            ts: Date.now()
        });
        ov.remove();
        saveData = saveDataAhora || saveData; /* reportes: sin debounce */
        if (typeof pushNotificacion === 'function') {
            if (typeof logActividad === 'function') {
                logActividad('reporte',
                    u.email + ' reportó a ' + e.nombre +
                    ': ' + motivo);
            }
            pushNotificacion('reporte',
                u.email + ' reportó a ' + e.nombre + ': ' + motivo);
        }
        await saveData();
        showToast('Reporte enviado al equipo');
    };
    document.body.appendChild(ov);
}

/* Terminos y condiciones de uso: en primer registro y en Ajustes */
function verTerminos() {
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja">' +
        '<h3><i class="fas fa-file-contract"></i> Términos de uso</h3>' +
        '<p class="rep-sub">Emprendedores es una herramienta creada ' +
        'para facilitar la búsqueda de emprendimientos y servicios ' +
        'nuevos. <b>No nos hacemos responsables</b> de la información, ' +
        'productos o servicios que cada usuario publica en su cuenta. ' +
        'Al usar la app aceptás estos términos.</p>' +
        '<button class="emp-btn-guardar" id="ter-ok">Aceptar</button>' +
        '</div>';
    ov.querySelector('#ter-ok').onclick = async function () {
        await localforage.setItem('emprende-terminos', true);
        ov.remove();
    };
    ov.onclick = function (ev) { if (ev.target === ov) ov.remove(); };
    document.body.appendChild(ov);
}

/* Delegacion global del boton reportar dentro de tarjetas */
document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.rep-btn');
    if (!btn) return;
    ev.stopPropagation();
    var card = btn.closest('[data-id]');
    if (card) abrirReporte(card.dataset.id);
});

/* Likes con fecha: cada usuario puede dar like una vez cada
   3 meses. El corazon vuelve a negro pasado ese plazo, pero el
   like historico SIGUE contando — nunca se resta. */
var LIKE_MES = 3; /* 3 meses */

function _likeTs(l) { return l && typeof l === 'object' ? Number(l.ts) || 0 : 0; }
function _likeEm(l) {
    return String(l && typeof l === 'object' ? l.email || l.by || '' : l || '').trim().toLowerCase();
}

function ultimoLike(e, correo) {
    return (e.likes || []).filter(function (l) {
        return _likeEm(l) === _likeEm(correo);
    }).reduce(function (ultimo, l) { return ultimo === null || _likeTs(l) >= _likeTs(ultimo) ? l : ultimo; }, null);
}

function finPlazoLike(l) {
    var fecha = new Date(_likeTs(l) - 6 * 3600000);
    var dia = fecha.getUTCDate();
    fecha.setUTCDate(1);
    fecha.setUTCMonth(fecha.getUTCMonth() + LIKE_MES);
    var ultimoDia = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 0)).getUTCDate();
    fecha.setUTCDate(Math.min(dia, ultimoDia));
    return fecha.getTime() + 6 * 3600000;
}

function likesContables(e) {
    return (e.likes || []).filter(function (l) { return l && !l.retiradoEn; });
}

function totalLikes(e) { return likesContables(e).length; }

function tieneLike(e) {
    var u = usuarioActual();
    if (!u) return false;
    var ultimo = ultimoLike(e, u.email);
    return !!(ultimo && !ultimo.retiradoEn && Date.now() < finPlazoLike(ultimo)); /* rojo mientras vigente */
}

function toggleLike(empId) {
    var u = usuarioActual();
    if (!u) { mostrarLogin(); return; }
    var e = (App.data.emprendimientos || []).find(function (x) {
        return String(x.id) === String(empId);
    });
    if (!e) return;
    if (esCreadorNegocio(e, u)) {
        showToast('No podés dar like a tu propio emprendimiento');
        return;
    }
    e.likes = e.likes || [];
    var ultimo = ultimoLike(e, u.email);
    if (ultimo && ultimo.retiradoEn) {
        ultimo.ts = Date.now();
        delete ultimo.retiradoEn;
        showToast('Like activado: empieza un nuevo plazo de tres meses');
        saveData().then(renderTodo);
        return;
    }
    if (ultimo && Date.now() < finPlazoLike(ultimo)) {
        ultimo.retiradoEn = Date.now();
        if (typeof logActividad === 'function') logActividad('like', u.email + ' retiró su like de ' + e.nombre);
        showToast('Like desactivado. Podés volver a activarlo cuando quieras');
        saveData().then(renderTodo);
        return;
    }
    /* nuevo like se suma sin borrar el historial */
    e.likes.push({ email: u.email, ts: Date.now() });
    if (typeof logActividad === 'function') {
        logActividad('like', u.email + ' dio like a ' + e.nombre);
    }
    showToast('¡Like enviado!');
    saveData().then(renderTodo);
}

/* Delegacion del corazon */
document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.emp-like');
    if (!btn) return;
    ev.stopPropagation();
    var card = btn.closest('[data-id]');
    if (card) toggleLike(card.dataset.id);
});
