var _carruselFirma = '', _carruselPausaHasta = 0, _carruselFrame = 0, _carruselTocando = false, _promoVencimiento = 0;

function mezclarCarrusel(lista) {
    for (var i = lista.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var v = lista[i]; lista[i] = lista[j]; lista[j] = v;
    }
    return lista;
}

function renderEspaciosPromocionados() {
    var cont = document.getElementById('lista-emprendimientos');
    if (!cont) return;
    var f = App.filtroCategoria || '', ahora = promoAhora();
    clearTimeout(_promoVencimiento);
    var futuros = Promociones.publico.activos.map(function (a) { return a.ends; }).filter(function (fin) { return fin > ahora; });
    if (futuros.length) _promoVencimiento = setTimeout(renderEspaciosPromocionados, Math.min(2147483647, Math.max(1, (Math.min.apply(null, futuros) - ahora) * 1000 + 30)));
    var ids = new Set(Promociones.publico.activos.filter(function (a) { return a.starts <= ahora && a.ends > ahora; }).map(function (a) { return String(a.emp); }));
    var lista = ((App.data || {}).emprendimientos || []).filter(function (e) { return !e.pausa && (!f || e.categoria === f); });
    var rango = new Map((App.ordenNegocios || []).map(function (id, i) { return [String(id), i]; }));
    var pagados = lista.filter(function (e) { return ids.has(String(e.id)); }).sort(function (a, b) { return (rango.get(String(a.id)) || 0) - (rango.get(String(b.id)) || 0); });
    var chip = document.getElementById('filtro-activo'); if (chip) chip.hidden = !f;
    var filtro = document.getElementById('filtro-nombre'); if (filtro) filtro.textContent = f;
    var count = document.getElementById('emprendimientos-count');
    if (count) count.textContent = pagados.length + ' en espacio pagado · capacidad ' + Promociones.publico.capacidad;
    cont.innerHTML = pagados.map(tarjetaEmprendimiento).join('') || '<p class="vacio">No hay promociones vigentes en esta selección.</p>';
    var pag = document.getElementById('emp-pag');
    if (pag) pag.innerHTML = '';
    /* El carrusel de gratuitos NO respeta el filtro de categoria: es
       seccion de descubrimiento y nunca debe ocultarse por filtros
       ni busquedas que no traigan resultados. */
    var todos = ((App.data || {}).emprendimientos || []).filter(function (e) { return !e.pausa; });
    var gratuitos = todos.filter(function (e) { return !ids.has(String(e.id)); });
    var seccion = document.getElementById('promo-gratuitos');
    if (!seccion) {
        seccion = document.createElement('section'); seccion.id = 'promo-gratuitos';
        seccion.innerHTML = '<h3>Descubrí más emprendimientos</h3><p>Negocios sin promoción · deslizá para explorar</p><div id="promo-carrusel" class="promo-carrusel" aria-label="Negocios sin promoción"></div><div id="promo-carrusel-2" class="promo-carrusel" aria-label="Más negocios sin promoción"></div>';
        (pag || cont).after(seccion);
        seccion.querySelectorAll('.promo-carrusel').forEach(function (carrusel) {
            carrusel.addEventListener('pointerdown', function () { _carruselTocando = true; }, { passive: true });
            carrusel.onclick = function (ev) { var tarjeta = ev.target.closest('[data-id]'); if (tarjeta) verEmprendimiento(tarjeta.dataset.id); };
        });
        document.addEventListener('pointerup', function () { _carruselTocando = false; });
        document.addEventListener('pointercancel', function () { _carruselTocando = false; });
        iniciarMovimientoCarrusel();
    }
    var firma = f + JSON.stringify(gratuitos.map(function (e) { return [e.id, e.categoria, e.nombre, e.logo, e.provincia, e.distrito]; }));
    if (firma !== _carruselFirma) {
        _carruselFirma = firma;
        var grupos = {};
        gratuitos.forEach(function (e) { (grupos[e.categoria || 'Otros'] = grupos[e.categoria || 'Otros'] || []).push(e); });
        var orden = mezclarCarrusel(Object.keys(grupos)).reduce(function (todos, cat) { return todos.concat(mezclarCarrusel(grupos[cat])); }, []);
        var tarjetas = orden.map(tarjetaEmprendimiento).join('');
        var invertidas = orden.slice().reverse().map(tarjetaEmprendimiento).join('');
        if (!tarjetas) tarjetas = invertidas = '<p class="vacio" style="flex:0 0 auto;padding:20px">Por ahora no hay negocios sin promoción.</p>';
        document.getElementById('promo-carrusel').innerHTML = tarjetas + tarjetas;
        document.getElementById('promo-carrusel-2').innerHTML = invertidas + invertidas;
    }
    seccion.hidden = false;
}

function iniciarMovimientoCarrusel() {
    if (_carruselFrame) return;
    var anterior = 0;
    function avanzar(ts) {
        var delta = Math.min(50, ts - (anterior || ts)); anterior = ts;
        /* Dos marquesinas infinitas en sentidos opuestos: contenido
           duplicado, al pasar la mitad se recicla sin salto. Nunca
           pausan; solo ceden mientras el dedo arrastra. */
        if (!_carruselTocando && !document.hidden && App.vistaActual === 'view-emprendimientos') {
            var el = document.getElementById('promo-carrusel'), mitad;
            if (el) {
                mitad = el.scrollWidth / 2;
                if (mitad > el.clientWidth) { el.scrollLeft += delta * .025; if (el.scrollLeft >= mitad) el.scrollLeft -= mitad; }
            }
            var el2 = document.getElementById('promo-carrusel-2');
            if (el2) {
                mitad = el2.scrollWidth / 2;
                if (mitad > el2.clientWidth) { el2.scrollLeft -= delta * .025; if (el2.scrollLeft <= 0) el2.scrollLeft += mitad; }
            }
        }
        _carruselFrame = requestAnimationFrame(avanzar);
    }
    _carruselFrame = requestAnimationFrame(avanzar);
}
