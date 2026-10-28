/* 15-tarjeta.js - Tarjeta digital descargable: genera una mini pagina
   HTML independiente (estilos embebidos, sin CDNs) con la info del
   emprendimiento; todos los enlaces son tocables. */

function soloDigitos(t) {
    return (t || '').replace(/\D/g, '');
}

function enlaceTarjeta(href, clase, texto) {
    return href
        ? '<a class="' + clase + '" href="' + href +
          '" target="_blank" rel="noopener">' + texto + '</a>'
        : '';
}

function htmlTarjeta(e, contacto) {
    var wa = soloDigitos((contacto && contacto.telefono) || e.whatsapp || e.telefono);
    var tel = soloDigitos(e.telefono) || wa;
    var pluses = (e.pluses || []).map(function (p) {
        var def = (typeof PLUSES !== 'undefined' ? PLUSES : []).find(function (x) {
            return x[0] === p;
        });
        return def ? '<span class="plus">' + def[1] + '</span>' : '';
    }).join('');

    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
'<meta name="viewport" content="width=device-width, initial-scale=1">' +
'<title>' + e.nombre + ' · Emprendedores</title><style>' +
'*{margin:0;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif}' +
'body{background:#f1f5f9;min-height:100vh;display:flex;align-items:center;' +
'justify-content:center;padding:18px}' +
'.card{background:#fff;border-radius:22px;max-width:380px;width:100%;overflow:hidden;' +
'box-shadow:0 12px 40px rgba(15,23,42,.15)}' +
'.hero{background:linear-gradient(135deg,#ea580c,#c2410c);color:#fff;' +
'padding:26px 20px;text-align:center}' +
'.hero .logo{width:64px;height:64px;margin:0 auto 10px;border-radius:50%;' +
'background:rgba(255,255,255,.18);display:flex;align-items:center;' +
'justify-content:center;font-size:26px;font-weight:800}' +
'.hero h1{font-size:1.3rem}' +
'.hero p{font-size:.8rem;opacity:.9;margin-top:4px}' +
'.cuerpo{padding:18px 20px}' +
'.fila{display:flex;gap:8px;padding:9px 0;border-bottom:1px solid #f1f5f9;' +
'font-size:.88rem;color:#334155;word-break:break-all}' +
'.fila b{color:#ea580c;min-width:74px;font-size:.78rem;text-transform:uppercase}' +
'.acciones{display:flex;gap:10px;margin:14px 0}' +
'.acciones a{flex:1;text-align:center;padding:12px;border-radius:12px;' +
'font-weight:700;font-size:.9rem;text-decoration:none}' +
'.llamar{background:#f1f5f9;color:#0f172a;border:1.5px solid #e2e8f0}' +
'.wa{background:#25d366;color:#fff}' +
'.enlaces{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}' +
'.enlaces a{padding:7px 13px;border-radius:999px;font-size:.78rem;font-weight:700;' +
'text-decoration:none}' +
'.maps{background:rgba(26,115,232,.12);color:#1a73e8}' +
'.waze{background:rgba(51,204,255,.14);color:#0097a7}' +
'.fb{background:rgba(24,119,242,.12);color:#1877f2}' +
'.tk{background:#0f172a;color:#fff}' +
'.plus{display:inline-block;margin:0 6px 6px 0;padding:5px 11px;border-radius:999px;' +
'background:rgba(234,88,12,.1);color:#ea580c;font-size:.75rem;font-weight:600}' +
'.pie{text-align:center;font-size:.7rem;color:#94a3b8;padding:0 0 14px}' +
'</style></head><body><div class="card">' +
'<div class="hero"><div class="logo">' +
    (e.nombre || 'E').charAt(0).toUpperCase() + '</div>' +
'<h1>' + e.nombre + '</h1>' +
'<p>' + (e.categoria || '') + (e.lugar ? ' · ' + e.lugar : '') + '</p></div>' +
'<div class="cuerpo">' +
(contacto && contacto.nombre ? '<div class="fila"><b>Responsable</b><span>' +
    contacto.nombre + '</span></div>' : '') +
(tel ? '<div class="fila"><b>Teléfono</b><span>' + (e.telefono || '') +
    '</span></div>' : '') +
(wa ? '<div class="fila"><b>WhatsApp</b><span>' + wa + '</span></div>' : '') +
(e.horario ? '<div class="fila"><b>Horario</b><span>' + e.horario +
    '</span></div>' : '') +
(e.desc ? '<div class="fila"><b>Ofrece</b><span>' + e.desc + '</span></div>' : '') +
'<div class="acciones">' +
enlaceTarjeta(tel ? 'tel:' + tel : '', 'llamar', 'Llamar') +
enlaceTarjeta(wa ? 'https://wa.me/' + wa : '', 'wa', 'WhatsApp') +
'</div>' +
'<div class="enlaces">' +
enlaceTarjeta(e.maps, 'maps', 'Cómo llegar · Maps') +
enlaceTarjeta(e.waze, 'waze', 'Cómo llegar · Waze') +
enlaceTarjeta(e.facebook, 'fb', 'Facebook') +
enlaceTarjeta(e.tiktok, 'tk', 'TikTok') +
'</div>' +
(pluses ? '<div>' + pluses + '</div>' : '') +
'</div><div class="pie">Emprendedores · Tarjeta digital</div></div></body></html>';
}

async function descargarTarjeta(id) {
    var e = (App.data.emprendimientos || []).find(function (x) {
        return String(x.id) === String(id);
    });
    if (!e) return;
    var contacto = (App.data.emprendedores || []).find(function (c) {
        return String(c.empId) === String(e.id);
    });
    var html = htmlTarjeta(e, contacto);
    var blob = new Blob([html], { type: 'text/html' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tarjeta-' +
        (e.nombre || 'emprendimiento').toLowerCase()
            .replace(/[^a-z0-9]+/gi, '-') + '.html';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    showToast('Tarjeta digital descargada');
}
