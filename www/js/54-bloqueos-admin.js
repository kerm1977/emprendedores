/* 54-bloqueos-admin.js - Bloqueos administrativos del superusuario.
   Ticket con motivo; el negocio/usuario queda oculto al publico y el
   dueno ve una tarjeta con la razon (ej: pago pendiente). */

function bloqueosAdmin() {
    App.data.bloqueosAdmin = App.data.bloqueosAdmin || [];
    return App.data.bloqueosAdmin;
}

function bloqueoDe(email, id) {
    var correo = String(email || '').trim().toLowerCase();
    return (bloqueosAdmin()).filter(function (b) {
        return b.activo && ((b.email && b.email === correo) || (id != null && String(b.empId) === String(id)));
    })[0] || null;
}

function estaBloqueadoAdmin(email, id) {
    return !!bloqueoDe(email, id);
}

function prepararBloqueosAdmin() {
    var u = usuarioActual();
    if (!u || u.rol !== 'super' || document.getElementById('btn-bloqueos-admin')) return;
    var salir = document.getElementById('btn-salir-perfil');
    if (!salir) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btn-bloqueos-admin';
    btn.className = 'perfil-btn-ajustes';
    btn.innerHTML = '<i class="fas fa-shield-halved"></i> Bloqueos';
    salir.parentNode.insertBefore(btn, salir);
    btn.onclick = function () {
        renderVistaBloqueos();
        irAVista('view-bloqueos', 'Bloqueos');
    };
}

/* Pagina dedicada de Bloqueos (no modal): tickets activos arriba,
   y los candidatos a bloquear solo aparecen al buscar. */
var _baSel = null;
function renderVistaBloqueos() {
    var vista = document.getElementById('view-bloqueos');
    if (!vista) return;
    _baSel = null;
    var activos = bloqueosAdmin().filter(function (b) { return b.activo; });
    vista.innerHTML = '<div class="perfil-card" style="text-align:left">' +
        '<h3><i class="fas fa-shield-halved"></i> Bloqueos</h3>' +
        '<p class="rep-sub">Tickets de bloqueo sobre usuarios y negocios.</p>' +
        '<h4>Activos (' + activos.length + ')</h4>' +
        (activos.length ? activos.map(function (b) {
            return '<div class="dic-item"><b>' + escapeHtml(b.nombre || b.email) + '</b>' +
                (b.pendientePago ? ' <small>· pago pendiente</small>' : '') +
                '<br><small>' + escapeHtml(b.motivo || '') + ' · ' + new Date(b.ts).toLocaleString('es-CR') + '</small>' +
                ' <button class="rep-cancelar" data-desbloq="' + b.id + '">Desbloquear</button></div>';
        }).join('') : '<p class="rep-sub">No hay bloqueos activos.</p>') +
        '<hr style="border:none;border-top:1px solid var(--border-soft);margin:12px 0">' +
        '<h4>Buscar para bloquear</h4>' +
        '<p class="rep-sub">Escribí nombre, correo o teléfono; los resultados aparecen debajo.</p>' +
        '<div class="buscador"><i class="fas fa-magnifying-glass"></i>' +
        '<input type="search" id="ba-buscar" placeholder="Nombre, correo o teléfono"></div>' +
        '<div id="ba-candidatos" style="margin-top:8px"></div>' +
        '<div id="ba-form" hidden style="margin-top:8px">' +
        '<input id="ba-nombre" readonly style="width:100%;margin-bottom:6px">' +
        '<textarea id="ba-motivo" rows="3" maxlength="500" placeholder="Motivo del bloqueo (ticket)" style="width:100%"></textarea>' +
        '<label style="display:flex;gap:6px;align-items:center;margin:6px 0"><input type="checkbox" id="ba-pendiente"> Pago pendiente (ocultar hasta ponerse al día)</label>' +
        '<button class="emp-btn-guardar" id="ba-guardar">Crear bloqueo</button></div>' +
        '<button class="perfil-btn-ajustes" id="ba-volver" style="margin-top:14px"><i class="fas fa-arrow-left"></i> Volver a mi perfil</button></div>';
    vista.querySelector('#ba-volver').onclick = function () { irAVista('view-perfil', 'Perfil'); };
    vista.querySelector('#ba-buscar').oninput = function () { pintarCandidatos(this.value); };
    vista.querySelector('#ba-guardar').onclick = function () {
        var motivo = vista.querySelector('#ba-motivo').value.trim();
        if (!_baSel || !motivo) { showToast('Elegí un objetivo y escribí el motivo'); return; }
        bloqueosAdmin().push({ id: 'bloq-' + Date.now(), email: _baSel.email, empId: _baSel.empId, nombre: _baSel.nombre, motivo: motivo, pendientePago: vista.querySelector('#ba-pendiente').checked, ts: Date.now(), activo: true });
        saveDataAhora();
        renderVistaBloqueos();
        if (typeof renderTodo === 'function') renderTodo();
        showToast('Bloqueo creado para ' + _baSel.nombre);
        _baSel = null;
    };
    vista.onclick = function (e) {
        var item = e.target.closest('[data-sel]');
        if (item) {
            _baSel = { email: item.dataset.email, empId: item.dataset.emp || null, nombre: item.dataset.nom };
            vista.querySelector('#ba-nombre').value = _baSel.nombre;
            vista.querySelector('#ba-form').hidden = false;
            vista.querySelector('#ba-motivo').focus();
            return;
        }
        var des = e.target.closest('[data-desbloq]');
        if (des) {
            var t = bloqueosAdmin().filter(function (b) { return b.id === des.dataset.desbloq; })[0];
            if (t) t.activo = false;
            saveDataAhora();
            renderVistaBloqueos();
            if (typeof renderTodo === 'function') renderTodo();
            showToast('Bloqueo levantado');
        }
    };
}

/* Los candidatos solo se listan con busqueda (2+ caracteres): nombre,
   correo o telefono, sobre negocios y contactos no bloqueados aun. */
function pintarCandidatos(q) {
    var box = document.getElementById('ba-candidatos');
    if (!box) return;
    if ((q || '').trim().length < 2) {
        box.innerHTML = '<p class="rep-sub">Escribí al menos 2 letras para buscar.</p>';
        return;
    }
    var filtro = q.trim().toLowerCase();
    var qd = q.replace(/\D/g, '');
    var candidatos = [];
    (App.data.emprendimientos || []).forEach(function (e) {
        var correo = (e.owner || e.email || '').trim().toLowerCase();
        if (correo && !bloqueoDe(correo, e.id)) {
            candidatos.push({ email: correo, empId: e.id, nombre: e.nombre || '', tel: e.telefono || '', etiqueta: 'negocio' });
        }
    });
    (App.data.emprendedores || []).forEach(function (p) {
        var correo = (p.email || p.owner || '').trim().toLowerCase();
        if (correo && !bloqueoDe(correo, null)) {
            candidatos.push({ email: correo, empId: null, nombre: p.emprendimiento || p.nombre || '', tel: p.telefono || '', etiqueta: 'contacto' });
        }
    });
    var filtrados = candidatos.filter(function (c) {
        return c.nombre.toLowerCase().indexOf(filtro) !== -1 ||
               c.email.indexOf(filtro) !== -1 ||
               (qd && String(c.tel).replace(/\D/g, '').indexOf(qd) !== -1);
    }).slice(0, 25);
    box.innerHTML = filtrados.map(function (c) {
        return '<div class="dic-item" data-sel="1" data-email="' + escapeHtml(c.email) + '" data-emp="' + (c.empId || '') + '" data-nom="' + escapeHtml(c.nombre + ' · ' + c.email) + '">' +
            '<b>' + escapeHtml(c.nombre) + '</b> <small>(' + c.etiqueta + ')</small><br>' +
            '<small>' + escapeHtml(c.email) + (c.tel ? ' · ' + escapeHtml(String(c.tel)) : '') + '</small>' +
            ' <button class="emp-btn-guardar" style="padding:4px 10px;font-size:.8rem">Bloquear</button></div>';
    }).join('') || '<p class="rep-sub">Sin coincidencias.</p>';
}

/* Tarjeta de aviso al dueno bloqueado, arriba de Negocios */
function avisoBloqueoAdmin() {
    var viejo = document.getElementById('aviso-bloqueo-admin');
    if (viejo) viejo.remove();
    var u = usuarioActual();
    if (!u || App.vistaActual !== 'view-emprendimientos') return;
    var me = (u.email || '').trim().toLowerCase();
    var mias = (App.data.emprendimientos || []).filter(function (e) {
        return (e.owner || '').trim().toLowerCase() === me;
    });
    var bloq = bloqueosAdmin().filter(function (b) {
        return b.activo && mias.some(function (e) {
            return (e.owner || '').trim().toLowerCase() === b.email || String(e.id) === String(b.empId);
        });
    })[0];
    if (!bloq) return;
    var vista = document.getElementById('view-emprendimientos');
    if (!vista) return;
    var card = document.createElement('div');
    card.id = 'aviso-bloqueo-admin';
    card.className = 'evt-nota';
    card.style.cssText = 'border:1px solid var(--border-soft);border-left:4px solid #dc2626;border-radius:10px;padding:12px;margin-bottom:10px;background:var(--bg-soft)';
    card.innerHTML = '<b><i class="fas fa-ban"></i> ' + (bloq.pendientePago
        ? 'Su negocio no será visible hasta ponerse al día.'
        : 'Su negocio fue bloqueado.') + '</b><br>' + escapeHtml(bloq.motivo || '');
    vista.insertBefore(card, vista.firstChild);
}

/* Se inyecta tras cada render de Negocios sin tocar el render original */
(function () {
    var orig = window.renderEmprendimientos;
    if (typeof orig === 'function') {
        window.renderEmprendimientos = function () {
            var r = orig.apply(this, arguments);
            avisoBloqueoAdmin();
            return r;
        };
    }
})();
