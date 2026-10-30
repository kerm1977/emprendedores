"""actualizacion_routes.py - Manifiesto de version OTA + descargas + canal beta.

GET /api/version            -> version publica; si el Bearer es super, incluye "beta"
POST /api/version/publicar  -> solo super: promueve beta.json a version.json (al mundo)
GET /descargas/<nombre>     -> bundles www y APKs publicados por publicar.py."""
import json
import os
import re
from flask import Blueprint, jsonify, send_from_directory
from promo_auth import actor_promocion, super_promocion

actualizacion_bp = Blueprint('actualizacion', __name__)
DESCARGAS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'descargas')
NOMBRE_OK = re.compile(r'^[\w.\-]+$')


def _manifesto(nombre):
    ruta = os.path.join(DESCARGAS, nombre)
    try:
        with open(ruta, encoding='utf-8') as f:
            datos = json.load(f)
        cambios = datos.get('cambios')
        if not isinstance(cambios, list):
            cambios = []
        return dict(version=str(datos.get('version', '0')), url=str(datos.get('url', '')),
                    checksum=str(datos.get('checksum', '')), apk=str(datos.get('apk', '')),
                    cambios=[str(c)[:300] for c in cambios][:20])
    except (OSError, ValueError, TypeError):
        return dict(version='0', url='', checksum='', apk='', cambios=[])


@actualizacion_bp.get('/api/version')
def version_app():
    datos = _manifesto('version.json')
    actor = actor_promocion(obligatorio=False)
    if actor and actor['rol'] == 'super':
        beta = _manifesto('beta.json')
        if beta['version'] != '0':
            datos['beta'] = beta
    return jsonify(datos)


@actualizacion_bp.post('/api/version/publicar')
def publicar_version():
    super_promocion()
    origen = os.path.join(DESCARGAS, 'beta.json')
    try:
        with open(origen, 'rb') as f:
            contenido = f.read()
    except OSError:
        return jsonify(error='No hay una actualización de prueba pendiente'), 404
    temporal = origen + '.tmp'
    with open(temporal, 'wb') as f:
        f.write(contenido)
    os.replace(temporal, os.path.join(DESCARGAS, 'version.json'))
    return jsonify(_manifesto('version.json'))


@actualizacion_bp.get('/descargas/<nombre>')
def descargar(nombre):
    if not NOMBRE_OK.match(nombre):
        return jsonify(error='Nombre inválido'), 400
    return send_from_directory(DESCARGAS, nombre, as_attachment=True)
