async function descargarTarjeta(id) {
    var e = (App.data.emprendimientos || []).find(function (x) {
        return String(x.id) === String(id);
    });
    if (!e) return;
    var contacto = (App.data.emprendedores || []).find(function (c) {
        return String(c.empId) === String(e.id);
    });
    if (descargarTarjeta.ocupada) return;
    var html = htmlTarjeta(e, contacto);
    var nombre = 'tarjeta-' + (e.nombre || 'emprendimiento').toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-') + '.html';
    /* En Capacitor el blob no descarga -> visor interno */
    descargarTarjeta.ocupada = true;
    try {
        if (window.Capacitor && window.Capacitor.isNativePlatform &&
                window.Capacitor.isNativePlatform()) {
            var fs = window.Capacitor.Plugins.Filesystem;
            var share = window.Capacitor.Plugins.Share;
            if (!fs || !share) {
                showToast('Esta versión requiere actualizar la aplicación para guardar tarjetas');
                return;
            }
            var archivo = await fs.writeFile({
                path: 'tarjetas/' + nombre, data: html,
                directory: 'CACHE', encoding: 'utf8', recursive: true
            });
            await share.share({
                title: e.nombre + ' · Tarjeta digital',
                files: [archivo.uri], dialogTitle: 'Guardar o compartir tarjeta digital'
            });
            return;
        }
        var blob = new Blob([html], { type: 'text/html' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        showToast('Descarga de tarjeta iniciada');
    } catch (error) {
        showToast('No se completó el guardado o se canceló. Podés intentarlo de nuevo');
    } finally {
        descargarTarjeta.ocupada = false;
    }
}
