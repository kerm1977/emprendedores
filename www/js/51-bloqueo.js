/* 51-bloqueo.js - Bloqueo bidireccional de usuarios/emprendimientos.
   App.data.bloqueados[miEmail] = [{email, nombre, ts}]; si A bloquea a B,
   ni A ve a B ni B ve a A (las listas se filtran en ambos sentidos). */

function correosBloqueados() {
    var u = typeof usuarioActual === 'function' ? usuarioActual() : null;
    var me = u && u.email;
    if (!me) return [];
    var mapa = App.data.bloqueados || {};
    var lista = (mapa[me] || []).map(function (b) { return b.email; });
    Object.keys(mapa).forEach(function (otro) {
        if ((mapa[otro] || []).some(function (b) { return b.email === me; })) lista.push(otro);
    });
    return lista;
}

function estaBloqueado(email) {
    email = String(email || '').trim().toLowerCase();
    return !!email && correosBloqueados().indexOf(email) !== -1;
}

function prepararBloqueo() {
    if (document.getElementById('btn-bloqueo')) return;
    var u = usuarioActual();
    if (!u) return;
    var salir = document.getElementById('btn-salir-perfil');
    if (!salir) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btn-bloqueo';
    btn.className = 'perfil-btn-ajustes';
    btn.innerHTML = '<i class="fas fa-ban"></i> Bloquear usuarios o negocios';
    salir.parentNode.insertBefore(btn, salir);
    btn.onclick = abrirBloqueo;
}

function abrirBloqueo() {
    var me = usuarioActual().email;
    var mapa = App.data.bloqueados = App.data.bloqueados || {};
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    var candidatos = [];
    (App.data.emprendedores || []).forEach(function (p) {
        var correo = (p.email || p.owner || '').trim().toLowerCase();
        if (correo && correo !== me) candidatos.push({ email: correo, nombre: p.emprendimiento || p.nombre, tipo: 'emprendedor' });
    });
    (App.data.emprendimientos || []).forEach(function (e) {
        var correo = (e.owner || e.email || '').trim().toLowerCase();
        if (correo && correo !== me) candidatos.push({ email: correo, nombre: e.nombre, tipo: 'negocio' });
    });
    var vistos = {}, unicos = [];
    candidatos.forEach(function (c) { if (!vistos[c.email]) { vistos[c.email] = 1; unicos.push(c); } });
    unicos = unicos.filter(function (c) { return !estaBloqueado(c.email) || !(mapa[me] || []).some(function (b) { return b.email === c.email; }); });
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja">' +
        '<h3><i class="fas fa-ban"></i> Bloquear usuarios o negocios</h3>' +
        '<p class="rep-sub">Al bloquear, ninguno de los dos podrá ver el contenido del otro.</p>' +
        '<h4>Bloqueados por mí (' + (mapa[me] || []).length + ')</h4>' +
        ((mapa[me] || []).length ? mapa[me].map(function (b) {
            return '<div class="dic-item"><b>' + escapeHtml(b.nombre || b.email) + '</b> · ' + escapeHtml(b.email) +
                ' <button class="rep-cancelar" data-desbloquear="' + escapeHtml(b.email) + '">Desbloquear</button></div>';
        }).join('') : '<p class="rep-sub">No hay bloqueos.</p>') +
        '<h4>Disponibles para bloquear</h4>' +
        '<input id="bloq-buscar" type="search" placeholder="Buscar por nombre o correo" style="width:100%;margin-bottom:8px">' +
        '<div id="bloq-lista" style="max-height:35vh;overflow-y:auto"></div>' +
        '<button class="rep-cancelar" id="bloq-cerrar">Cerrar</button></div>';
    function pintar(q) {
        var filtro = (q || '').toLowerCase();
        ov.querySelector('#bloq-lista').innerHTML = unicos.filter(function (c) {
            return !filtro || c.nombre.toLowerCase().indexOf(filtro) !== -1 || c.email.indexOf(filtro) !== -1;
        }).slice(0, 40).map(function (c) {
            return '<div class="dic-item"><b>' + escapeHtml(c.nombre) + '</b> <small>(' + c.tipo + ')</small><br><small>' + escapeHtml(c.email) + '</small>' +
                ' <button class="emp-btn-guardar" data-bloquear="' + escapeHtml(c.email) + '" style="padding:4px 10px;font-size:.8rem">Bloquear</button></div>';
        }).join('') || '<p class="rep-sub">Sin coincidencias.</p>';
    }
    pintar('');
    ov.querySelector('#bloq-buscar').oninput = function () { pintar(this.value); };
    ov.addEventListener('click', function (e) {
        var bq = e.target.closest('[data-bloquear]');
        if (bq) {
            var email = bq.dataset.bloquear, cand = unicos.filter(function (c) { return c.email === email; })[0];
            (mapa[me] = mapa[me] || []).push({ email: email, nombre: cand ? cand.nombre : email, ts: Date.now() });
            saveDataAhora();
            ov.remove(); abrirBloqueo();
            showToast('Bloqueado: ' + email);
        }
        var dq = e.target.closest('[data-desbloquear]');
        if (dq) {
            mapa[me] = (mapa[me] || []).filter(function (b) { return b.email !== dq.dataset.desbloquear; });
            saveDataAhora();
            ov.remove(); abrirBloqueo();
            showToast('Desbloqueado');
        }
    });
    ov.querySelector('#bloq-cerrar').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
}

/* El bloqueo filtra las listas envolviendo las funciones de render y
   busqueda sin tocarlas: se ocultan en ambos sentidos (A<->B). */
function envolverLista(nombre, campo, correoDe) {
    var orig = window[nombre];
    if (typeof orig !== 'function') return;
    window[nombre] = function () {
        var lista = App.data[campo];
        if (lista) App.data[campo] = lista.filter(function (x) {
            return !estaBloqueado(correoDe(x)) &&
                !(typeof estaBloqueadoAdmin === 'function' && estaBloqueadoAdmin(correoDe(x), x.id));
        });
        try { return orig.apply(this, arguments); }
        finally { if (lista) App.data[campo] = lista; }
    };
}
function envolverBusqueda(nombre, correoDe) {
    var orig = window[nombre];
    if (typeof orig !== 'function') return;
    window[nombre] = function () {
        var r = orig.apply(this, arguments);
        return Array.isArray(r) ? r.filter(function (x) {
            return !estaBloqueado(correoDe(x)) &&
                !(typeof estaBloqueadoAdmin === 'function' && estaBloqueadoAdmin(correoDe(x), x.id));
        }) : r;
    };
}
envolverLista('renderEmprendimientos', 'emprendimientos', function (e) { return e.owner || e.email; });
envolverLista('renderDirectorio', 'emprendedores', function (p) { return p.email || p.owner; });
envolverBusqueda('buscarEmprendimientos', function (e) { return e.owner || e.email; });
envolverBusqueda('buscarContactos', function (p) { return p.email || p.owner; });
