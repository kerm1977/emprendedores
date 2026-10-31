/* 55-compresor.js - Compresor universal de imagenes (sin CDN).
   Entrada File o dataURL; salida JPEG dataURL con el lado mayor
   limitado y calidad que baja hasta entrar bajo el tope, cuidando
   que ocupe el minimo espacio posible en /uploads sin perder
   legibilidad visual. Uso: comprimirImagenApp(entrada, opts) -> Promise<dataURL> */

function comprimirImagenApp(entrada, opciones) {
    opciones = opciones || {};
    var maxLado = opciones.maxLado || 640;
    var topeBytes = opciones.topeBytes || 800 * 1024;
    var calidadIni = opciones.calidad || .78;
    return new Promise(function (resolve, reject) {
        var img = new Image();
        var origen = typeof entrada === 'string' ? entrada : URL.createObjectURL(entrada);
        img.onerror = function () {
            if (typeof entrada !== 'string') URL.revokeObjectURL(origen);
            reject(new Error('No se pudo leer la imagen. Elegí una foto válida'));
        };
        img.onload = function () {
            try {
                var escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
                var lado = 1, calidad = calidadIni;
                var cv = document.createElement('canvas');
                for (var i = 0; i < 18; i++) {
                    cv.width = Math.max(1, Math.round(img.naturalWidth * escala * lado));
                    cv.height = Math.max(1, Math.round(img.naturalHeight * escala * lado));
                    var ctx = cv.getContext('2d');
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, cv.width, cv.height);
                    ctx.drawImage(img, 0, 0, cv.width, cv.height);
                    var out = cv.toDataURL('image/jpeg', calidad);
                    var payload = out.split(',')[1] || '';
                    var bytes = payload.length * .75 - ((payload.match(/=+$/) || [''])[0].length);
                    if (payload && bytes <= topeBytes) { resolve(out); return; }
                    if (calidad > .45) calidad -= .08;
                    else lado *= .8;
                }
                reject(new Error('No se pudo comprimir la imagen por debajo de ' + Math.round(topeBytes / 1024) + ' KB'));
            } catch (e) { reject(e); }
            finally { if (typeof entrada !== 'string') URL.revokeObjectURL(origen); }
        };
        img.src = origen;
    });
}
