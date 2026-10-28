/* 10-buscador.js - Buscador global bajo el logo:
   busca por nombre de negocio, categoría, lugar, teléfono
   (de negocio o de contacto) y nombre de contacto. */

function soloDigitos(s) {
    return (s || '').replace(/\D/g, '');
}

/* Normaliza: minúsculas y sin acentos ("musica" = "música") */
function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/* Distancia de edición (Levenshtein) para strings cortos */
function levCorto(a, b) {
    var m = a.length, n = b.length, prev = [], cur = [];
    for (var j = 0; j <= n; j++) prev[j] = j;
    for (var i = 1; i <= m; i++) {
        cur[0] = i;
        for (var j = 1; j <= n; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1,
                prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        var t = prev; prev = cur; cur = t;
    }
    return prev[n];
}

/* Fuzzy: cada palabra del campo acepta errores de dedo.
   "hard" -> "jard..." (dist 1), "rest" -> "restaurante" (substring) */
/* Alias: match exacto/substring normalizado (sin fuzzy, evita
   falsos positivos tipo "menta" -> "venta") */
function aliasCoincide(alias, q) {
    var a = norm(alias);
    var b = norm(q);
    return b.length >= 3 && (a.indexOf(b) !== -1 || b.indexOf(a) !== -1);
}

function coincideFuzzy(campo, q) {
    var t = norm(campo);
    if (t.indexOf(q) !== -1) return true;
    if (q.length < 4) return false;
    var limite = q.length <= 5 ? 1 : 2;
    var palabras = t.split(/[^a-z0-9]+/);
    for (var i = 0; i < palabras.length; i++) {
        var w = palabras[i];
        if (Math.abs(w.length - q.length) > limite) continue;
        if (levCorto(q, w.slice(0, q.length)) <= limite) return true;
    }
    return false;
}

function campoCoincide(campo, q, qDigitos) {
    if (coincideFuzzy(campo, q)) return true;
    if (qDigitos.length >= 3) {
        return soloDigitos(campo).indexOf(qDigitos) !== -1;
    }
    return false;
}

function buscarEmprendimientos(q, qDigitos) {
    return (App.data.emprendimientos || []).filter(function (e) {
        return campoCoincide(e.nombre, q, qDigitos) ||
               campoCoincide(e.categoria, q, qDigitos) ||
               campoCoincide(e.lugar, q, qDigitos) ||
               campoCoincide(e.telefono, q, qDigitos);
    });
}

function buscarContactos(q, qDigitos) {
    return (App.data.emprendedores || []).filter(function (p) {
        return campoCoincide(p.nombre, q, qDigitos) ||
               campoCoincide(p.emprendimiento, q, qDigitos) ||
               campoCoincide(p.telefono, q, qDigitos);
    });
}

function resEmprend(e) {
    return '' +
        '<div class="res-item" data-tipo="emprend" data-id="' + e.id + '">' +
            '<div class="res-icono"><i class="fas ' + iconoDeCategoria(e.categoria) + '"></i></div>' +
            '<div class="res-info">' +
                '<div class="res-nombre">' + escapeHtml(e.nombre) + '</div>' +
                '<div class="res-detalle">' + escapeHtml(e.categoria) +
                    (e.telefono ? ' · ' + escapeHtml(e.telefono) : '') + '</div>' +
            '</div>' +
        '</div>';
}

function resContacto(p) {
    return '' +
        '<div class="res-item" data-tipo="contacto" data-nombre="' + escapeHtml(p.nombre) + '">' +
            '<div class="res-icono">' + inicial(p.nombre) + '</div>' +
            '<div class="res-info">' +
                '<div class="res-nombre">' + escapeHtml(p.nombre) + '</div>' +
                '<div class="res-detalle">' + escapeHtml(p.emprendimiento || '') +
                    (p.telefono ? ' · ' + escapeHtml(p.telefono) : '') + '</div>' +
            '</div>' +
        '</div>';
}

/* Busca grupos de categorías y categorías sueltas del catálogo */
function buscarCategorias(q) {
    var res = [];
    /* Sinonimos de plagas: recomiendan fumigacion/exterminio primero */
    /* Alias por rubro (ALIAS_TABLA en 00-alias.js) + caso aceite.
       Se desactivan desde el Dashboard del superusuario */
    var aliasOn = App.data.aliasActivo !== false;
    ALIAS_TABLA.forEach(function (t) {
        if (!aliasOn) return;
        if (t[0].some(function (a) { return aliasCoincide(a, q); })) {
            t[1].forEach(function (c) {
                res.push({ tipo: 'catitem', grupo: c[1], cat: c[0],
                           icono: c[2], detalle: 'Recomendado · ' + c[1] });
            });
        }
    });
    if (aliasOn && esCalibreAceite(q)) {
        [['Cambio de aceite', 'Mecánica', 'fa-oil-can'],
         ['Mecánico automotriz', 'Mecánica', 'fa-car'],
         ['Autorrepuestos', 'Mecánica', 'fa-gears']].forEach(function (c) {
            res.push({ tipo: 'catitem', grupo: c[1], cat: c[0],
                       icono: c[2], detalle: 'Recomendado · ' + c[1] });
        });
    }
    CATEGORIAS.forEach(function (g) {
        if (coincideFuzzy(g.grupo, q)) {
            res.push({ tipo: 'grupo', grupo: g.grupo, cat: '', icono: g.icono,
                       detalle: 'Grupo · ' + g.items.length + ' categorías' });
        }
        g.items.forEach(function (it) {
            if (coincideFuzzy(it[0], q)) {
                res.push({ tipo: 'catitem', grupo: g.grupo, cat: it[0], icono: it[1],
                           detalle: 'Categoría · ' + g.grupo });
            }
        });
    });
    /* Sin duplicados: si la recomendacion ya salio por nombre directo */
    var vistos = {};
    return res.filter(function (r) {
        var k = r.grupo + '|' + r.cat;
        if (vistos[k]) return false;
        vistos[k] = true;
        return true;
    });
}

function buscarNotas(q, qDigitos) {
    return (App.data.ferias || App.data.notas || []).filter(function (n) {
        return campoCoincide(n.titulo, q, qDigitos) ||
            campoCoincide(n.texto, q, qDigitos) ||
            campoCoincide(n.lugar, q, qDigitos) ||
            campoCoincide(n.contacto, q, qDigitos) ||
            campoCoincide(n.telefono, q, qDigitos);
    });
}

function resNota(n) {
    return '' +
        '<div class="res-item" data-tipo="nota" data-id="' + n.id + '">' +
            '<div class="res-icono"><i class="fas fa-note-sticky"></i></div>' +
            '<div class="res-info">' +
                '<div class="res-nombre">' + escapeHtml(n.titulo) + '</div>' +
                '<div class="res-detalle">' + escapeHtml(n.texto) + '</div>' +
            '</div>' +
        '</div>';
}
