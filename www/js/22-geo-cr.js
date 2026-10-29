/* 22-geo-cr.js - Provincia de Costa Rica por coordenadas, FUERZA
   BRUTA OFFLINE: poligonos simplificados + ray-casting + fallback
   al vertice mas cercano. La provincia SIEMPRE se resuelve, sin
   internet, sin APIs, sin errores. */

var POLIGONOS_PROV = {
    'San José': [[-83.62,9.45],[-83.85,9.97],[-84.40,10.05],
        [-84.75,9.90],[-84.70,9.40],[-84.50,9.10],[-83.95,8.85],
        [-83.60,9.15]],
    'Alajuela': [[-84.15,9.80],[-84.05,10.50],[-84.55,11.00],
        [-85.00,10.95],[-85.40,10.60],[-85.35,10.15],[-84.75,9.95],
        [-84.40,9.90]],
    'Heredia': [[-83.90,10.00],[-83.85,10.60],[-84.30,10.95],
        [-84.35,10.35],[-84.20,10.00]],
    'Cartago': [[-84.00,9.85],[-83.85,10.15],[-83.50,10.05],
        [-83.40,9.60],[-83.60,9.40],[-83.85,9.50]],
    'Guanacaste': [[-84.70,10.00],[-85.00,10.95],[-85.40,11.30],
        [-85.90,10.90],[-85.80,10.30],[-85.35,9.95]],
    'Puntarenas': [[-85.35,10.20],[-85.15,10.60],[-84.75,10.40],
        [-84.55,9.95],[-84.30,9.55],[-83.85,9.50],[-83.55,9.15],
        [-83.35,8.70],[-82.95,8.30],[-82.90,8.60],[-83.50,8.80],
        [-84.00,9.20],[-84.60,9.35],[-85.00,9.60],[-85.30,9.90]],
    'Limón': [[-83.75,10.05],[-83.40,10.15],[-82.95,10.70],
        [-82.55,11.20],[-82.60,10.40],[-83.00,9.80],[-83.40,9.35],
        [-83.70,9.60]]
};

function _puntoEnPoligono(lng, lat, poly) {
    var dentro = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var xi = poly[i][0], yi = poly[i][1];
        var xj = poly[j][0], yj = poly[j][1];
        if ((yi > lat) !== (yj > lat) &&
            lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) {
            dentro = !dentro;
        }
    }
    return dentro;
}

/* Fuerza bruta: devuelve la provincia mas cercana al punto. */
function provinciaDeCoord(lat, lng) {
    var mejor = null, mejorDist = Infinity;
    for (var prov in POLIGONOS_PROV) {
        var poly = POLIGONOS_PROV[prov];
        if (_puntoEnPoligono(lng, lat, poly)) return prov;
        /* Fuera del poligono: distancia minima a cualquier vertice */
        for (var i = 0; i < poly.length; i++) {
            var dx = poly[i][0] - lng, dy = poly[i][1] - lat;
            var d = dx * dx + dy * dy;
            if (d < mejorDist) { mejorDist = d; mejor = prov; }
        }
    }
    return mejor;
}
