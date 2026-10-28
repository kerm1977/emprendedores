/* 16-mapas.js - Cuadritos de mapa con gotita. Si el link pegado trae
   coordenadas (q=, @ o ll=), arma la ruta desde la ubicacion actual de
   la persona hasta el destino; si no, abre el link tal cual (Maps/Waze
   ya proponen "como llegar" desde la posicion actual). */

function urlDireccion(link, tipo) {
    var m = (link || '').match(/[?&](?:q|query|ll)=(-?\d+\.?\d*)[,%]2?[Cc]?(-?\d+\.?\d*)/)
        || link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (m) {
        if (tipo === 'waze') {
            return 'https://waze.com/ul?ll=' + m[1] + ',' + m[2] + '&navigate=yes';
        }
        return 'https://www.google.com/maps/dir/?api=1&destination=' + m[1] + ',' + m[2];
    }
    return link;
}

/* Preview en el formulario: aparece el cuadrito cuando hay link */
function initPreviewsMapa() {
    [['emp-maps', 'prev-maps', 'prev-maps-a', 'maps'],
     ['emp-waze', 'prev-waze', 'prev-waze-a', 'waze']].forEach(function (cfg) {
        var input = document.getElementById(cfg[0]);
        var prev = document.getElementById(cfg[1]);
        var a = document.getElementById(cfg[2]);
        if (!input || !prev || !a) return;
        input.addEventListener('input', function () {
            var url = input.value.trim();
            prev.hidden = !url;
            if (url) a.href = urlDireccion(url, cfg[3]);
        });
    });
}
