var MAX_FOTO_PERFIL = 50 * 1024;

/* Compresion de foto de perfil (orden del usuario): JPEG max 50 KB,
   bajando calidad y luego dimensiones hasta entrar bajo el tope */
function comprimirFotoUsuario(file) {
    return new Promise(function (resolve, reject) {
        var img = new Image();
        var origen = URL.createObjectURL(file);
        img.onerror = function () {
            URL.revokeObjectURL(origen);
            reject(new Error('No se pudo leer la imagen. Elegí una foto válida'));
        };
        img.onload = function () {
            try {
                var escala = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
                var lado = 1, calidad = .82;
                var cv = document.createElement('canvas');
                for (var i = 0; i < 16; i++) {
                    cv.width = Math.max(1, Math.round(img.naturalWidth * escala * lado));
                    cv.height = Math.max(1, Math.round(img.naturalHeight * escala * lado));
                    var ctx = cv.getContext('2d');
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, cv.width, cv.height);
                    ctx.drawImage(img, 0, 0, cv.width, cv.height);
                    var out = cv.toDataURL('image/jpeg', calidad);
                    var payload = out.split(',')[1] || '';
                    var bytes = payload.length * .75 - ((payload.match(/=+$/) || [''])[0].length);
                    if (payload && bytes <= MAX_FOTO_PERFIL) { resolve(out); return; }
                    if (calidad > .5) calidad -= .1;
                    else lado *= .75;
                }
                reject(new Error('No se pudo comprimir la foto por debajo de 50 KB'));
            } catch (error) { reject(error); }
            finally { URL.revokeObjectURL(origen); }
        };
        img.src = origen;
    });
}

async function subirFotoPerfil(data, id) {
    var res = await fetch(apiUrl('/api/uploads'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'usr-' + id, data: data })
    });
    if (!res.ok) throw new Error('No se pudo subir la foto al servidor');
    var foto = await res.json();
    if (!foto.url || !/^\/uploads\/[a-z0-9_.-]+$/i.test(foto.url)) throw new Error('Ruta de foto inválida');
    return foto.url;
}
