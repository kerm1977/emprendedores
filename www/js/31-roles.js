/* BLINDADO (orden del usuario): prohibido modificar/eliminar
   sin orden explicita. Pedir permiso antes de tocar. */
/* 31-roles.js - Sistema de roles.
   super  : todo (incluye eliminar supers y asignar cualquier rol)
   admin1 : casi todo; NO puede eliminar superusuarios ni dar rol super
   admin2 : NO puede eliminar usuarios; ve info de empresas,
            edita imagenes y (mas adelante) mensajes
   user   : usuario normal (mismas capacidades por Google,
            huella o correo: solo difiere el registro) */

var ROLES = [
    ['super',   'Superusuario'],
    ['admin1',  'Administrador 1'],
    ['admin2',  'Administrador 2'],
    ['user',    'Usuario']
];

function rolLabel(r) {
    var m = ROLES.find(function (x) { return x[0] === r; });
    return m ? m[1] : 'Usuario';
}

/* Permiso de borrado segun rol del actor y del objetivo */
function puedeEliminarUsuario(actor, objetivo) {
    if (!actor || actor.rol === 'admin2' || actor.rol === 'user') {
        return false;
    }
    if (actor.rol === 'admin1' && objetivo.rol === 'super') {
        return false;
    }
    return actor.rol === 'super' || actor.rol === 'admin1';
}

/* Asignar rol: solo super da 'super'; admin1 hasta admin2 */
function puedeAsignarRol(actor, nuevoRol) {
    if (!actor) return false;
    if (actor.rol === 'super') return true;
    if (actor.rol === 'admin1' && nuevoRol !== 'super') return true;
    return false;
}

async function cambiarRol(uid, nuevoRol) {
    var actor = usuarioActual();
    if (!puedeAsignarRol(actor, nuevoRol)) {
        showToast('Sin permiso para ese rol');
        return;
    }
    var res = await fetch(apiUrl('/api/usuarios/' + uid), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: nuevoRol })
    });
    var data = await res.json();
    if (data.ok) {
        showToast('Rol: ' + rolLabel(nuevoRol));
        cargarUsuarios();
    } else {
        showToast(data.error || 'No se pudo cambiar el rol');
    }
}
