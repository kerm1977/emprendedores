function mapaTarjetaHtml(nombre, origenMapa) {
    return '<details id="desplegar-mapa"><summary class="boton ver-mapa">Ver mapa</summary>' +
        '<div class="mapa-contenedor" id="mapa-contenedor"><iframe id="mapa-negocio" title="Ubicación de ' + nombre +
        '" loading="lazy" referrerpolicy="no-referrer" tabindex="-1" data-origen="' + textoTarjeta(origenMapa) + '"></iframe>' +
        '<button type="button" class="activar-mapa" id="activar-mapa" aria-controls="mapa-negocio">' +
        '<span>Tocá para activar el mapa</span></button></div>' +
        '<div class="acciones"><button type="button" class="boton control-mapa" id="centrar-mapa" aria-controls="mapa-negocio">' +
        'Centrar ubicación</button><button type="button" class="boton control-mapa" id="bloquear-mapa" hidden>' +
        'Bloquear mapa</button></div><p class="nota" id="estado-mapa" aria-live="polite">Mapa bloqueado para evitar movimientos accidentales.</p></details>';
}

function eventosMapaTarjeta() {
    var desplegable = document.getElementById('desplegar-mapa');
    var contenedor = document.getElementById('mapa-contenedor');
    var mapa = document.getElementById('mapa-negocio');
    var activar = document.getElementById('activar-mapa');
    var bloquear = document.getElementById('bloquear-mapa');
    var estado = document.getElementById('estado-mapa');
    function fijarActivo(activo) {
        contenedor.classList.toggle('activo', activo);
        activar.hidden = activo;
        bloquear.hidden = !activo;
        mapa.tabIndex = activo ? 0 : -1;
        estado.textContent = activo ? 'Mapa activo. Usá Bloquear mapa para volver a desplazarte por la página.' :
            'Mapa bloqueado para evitar movimientos accidentales.';
    }
    desplegable.addEventListener('toggle', function () {
        fijarActivo(false);
        if (desplegable.open && !mapa.getAttribute('src')) mapa.src = mapa.getAttribute('data-origen');
    });
    activar.addEventListener('click', function () { fijarActivo(true); });
    bloquear.addEventListener('click', function () { fijarActivo(false); activar.focus(); });
    document.getElementById('centrar-mapa').addEventListener('click', function () {
        mapa.src = mapa.getAttribute('data-origen');
        fijarActivo(false);
    });
}

function plantillaTarjeta(datos) {
    var { e, contacto, tel2, wa, nombre, direccion, mapa, logo, redes, pluses, agenda,
        acciones, navegacion, fechaDescarga } = datos;
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer"><title>${nombre} · Emprendedores</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f8fafc;color:#172033;font-family:system-ui,-apple-system,sans-serif;line-height:1.6}
a{overflow-wrap:anywhere}header{background:white}.hero{background:linear-gradient(120deg,#c2410c,#ea580c);color:white;padding:42px clamp(18px,5vw,72px)}
.marca{display:flex;justify-content:center;align-items:center;padding:16px 18px;background:white}
.marca-logo{width:min(190px,100%);height:auto;display:block}.identidad{display:flex;align-items:center;flex-direction:column;gap:18px;text-align:center}
.logo{width:112px;height:112px;border-radius:50%;object-fit:contain;background:white;color:#c2410c;display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:800;flex-shrink:0}
h1{font-size:clamp(1.8rem,5vw,3rem);line-height:1.15;margin:10px 0;overflow-wrap:anywhere}h2{margin:0 0 18px;font-size:1.25rem}
header p{margin:8px 0}.acciones{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}header .acciones{justify-content:center}
.boton,.red{display:inline-flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;padding:12px 18px;border-radius:12px;background:#c2410c;color:#fff;font-weight:700;min-height:48px;border:1px solid #fff6}
.wa{background:#15803d;color:white}.google-maps{background:#1967d2;color:#fff}.waze{background:#33ccff;color:#102a43}.icono-maps{width:28px;height:28px;background:white;border-radius:50%;padding:3px;flex-shrink:0}
.boton:focus-visible,.red:focus-visible,.activar-mapa:focus-visible{outline:3px solid #2563eb;outline-offset:3px}
main{padding:24px clamp(16px,4vw,64px);display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}
section{background:white;border:1px solid #e2e8f0;border-radius:20px;padding:24px;flex:1 1 340px;min-width:0}
.ancho{flex-basis:100%}.descripcion{white-space:pre-wrap;overflow-wrap:anywhere}dl{margin:0}.fila{padding:12px 0;border-bottom:1px solid #e2e8f0;display:flex;flex-wrap:wrap;gap:6px 18px}
dt{font-weight:700;flex:0 1 140px;color:#9a3412}dd{margin:0;flex:1 1 180px;overflow-wrap:anywhere;white-space:pre-wrap}
ul{padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:10px}li{background:#c2410c;color:#fff;padding:8px 14px;border-radius:20px;font-weight:600}
.mapa-contenedor{position:relative;margin-top:16px}iframe{display:block;width:100%;height:320px;border:0;border-radius:14px;background:#f1f5f9}
.mapa-contenedor:not(.activo) iframe{pointer-events:none}.activar-mapa{position:absolute;inset:0;width:100%;border:0;border-radius:14px;background:#ffffff38;cursor:pointer;touch-action:pan-y}
.activar-mapa span{display:inline-block;max-width:90%;padding:12px 16px;background:#c2410c;color:white;border-radius:12px;font:700 .95rem system-ui;box-shadow:0 2px 8px #0003}
.control-mapa{font:700 .95rem system-ui;cursor:pointer}.ver-mapa{cursor:pointer;list-style:none}.ver-mapa::-webkit-details-marker{display:none}.ver-mapa::before{content:'+'}details[open]>.ver-mapa::before{content:'−'}
[hidden]{display:none!important}.nota{color:#64748b;font-size:.9rem}footer{text-align:center;padding:24px;color:#64748b}
.firma{display:block;margin-top:6px;font-size:.65rem;color:#7c8490}.corazon{color:#dc2626}
@media(max-width:480px){section{padding:18px}.acciones>*{flex:1 1 140px}.hero{padding-top:26px}.logo{width:76px;height:76px}}
</style></head><body>
<header><div class="marca">${marcaTarjeta()}</div><div class="hero"><div class="identidad">
${logo ? '<img class="logo" alt="Logo de ' + nombre + '" src="' + textoTarjeta(logo) + '">' : '<div class="logo" aria-hidden="true">' + textoTarjeta((e.nombre || 'E').charAt(0).toUpperCase()) + '</div>'}
<div><h1>${nombre}</h1><p>${textoTarjeta(direccion)}</p>
${e.contacto || (contacto && contacto.nombre) ? '<p>Responsable: ' + textoTarjeta(e.contacto || contacto.nombre) + '</p>' : ''}
<p>${textoTarjeta(e.categoria || '')}</p></div></div>
<nav class="acciones" aria-label="Contactar al emprendimiento">${acciones}</nav></div></header>
<main><section><h2>Conocé nuestro emprendimiento</h2>
${e.desc ? '<p class="descripcion">' + textoTarjeta(e.desc) + '</p>' : ''}
<dl>${filaTarjeta('Responsable', e.contacto || (contacto && contacto.nombre))}
${filaTarjeta('Teléfono', e.telefono)}${filaTarjeta('Otro teléfono', e.telefono2)}
${filaTarjeta('WhatsApp', wa ? '+' + wa : '')}${filaTarjeta('Correo', e.email)}
${filaTarjeta('Ubicación', direccion)}</dl>
${tel2 ? '<div class="acciones">' + enlaceTarjeta('tel:+' + tel2, 'boton', 'Llamar al segundo teléfono') + '</div>' : ''}
</section><section><h2>Horario de atención</h2>
${e.h24 ? '<p><strong>Atención las 24 horas</strong></p>' : ''}
${e.horario ? '<p class="descripcion">' + textoTarjeta(e.horario) + '</p>' : ''}
${agenda ? '<dl>' + agenda + '</dl>' : (!e.horario && !e.h24 ? '<p>Consultá nuestros horarios por los medios de contacto.</p>' : '')}
${e.feriados ? '<p>También atendemos días feriados.</p>' : ''}</section>
${redes ? '<section><h2>Redes sociales y sitio web</h2><nav class="acciones" aria-label="Redes sociales">' + redes + '</nav></section>' : ''}
${pluses ? '<section><h2>Servicios y facilidades</h2><ul>' + pluses + '</ul></section>' : ''}
<section class="ancho"><h2>${e.sinUbicacion ? 'Servicio a domicilio' : 'Dónde encontrarnos'}</h2><p>${textoTarjeta(direccion)}</p>
${mapa}${navegacion ? '<nav class="acciones" aria-label="Cómo llegar">' + navegacion + '</nav>' : ''}
${mapa ? '<p class="nota">Mapa © OpenStreetMap. El mapa, las redes y las rutas requieren conexión a internet.</p>' : ''}
${!e.sinUbicacion && !mapa ? '<p class="nota">El negocio no tiene coordenadas registradas para mostrar un mapa.</p>' : ''}
</section></main><footer><time>${textoTarjeta(fechaDescarga)}</time>
<small class="firma">Hecho con <span class="corazon" role="img" aria-label="amor">♥</span> por La Tribu de los Libres</small></footer>
${mapa ? '<script>(' + eventosMapaTarjeta.toString() + ')();</script>' : ''}
</body></html>`;
}
