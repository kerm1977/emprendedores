"""embeds_routes.py - Resuelve enlaces cortos de video (vt./vm. tiktok.com)
siguiendo la redireccion en el servidor para extraer el id del video y
armar el embed oficial /embed/v2/.

GET /api/embed/tiktok?u=<url-corta>  -> {embed: 'https://www.tiktok.com/embed/v2/ID'}"""
import re
import urllib.request
from flask import Blueprint, jsonify, request

embeds_bp = Blueprint('embeds', __name__)
_ID_VIDEO = re.compile(r'/video/(\d+)')
_URL_TT = re.compile(r'^https?://(www\.|vt\.|vm\.)?tiktok\.com/', re.I)


"""Presencia: cada sesion logueada pinge cada ~30s; el super ve cuantos
estan conectados (latido en los ultimos 90 segundos). En memoria del
worker, sin tocar bases de datos."""
import time

_presencia = {}
VENTANA = 90


@embeds_bp.post('/api/presencia')
def presencia_ping():
    p = request.get_json(force=True, silent=True) or {}
    email = str(p.get('email') or '').strip().lower()[:80]
    if email:
        _presencia[email] = time.time()
    ahora = time.time()
    for k in [k for k, v in _presencia.items() if ahora - v > VENTANA]:
        del _presencia[k]
    return jsonify(conectados=len(_presencia))


@embeds_bp.get('/api/presencia')
def presencia_total():
    ahora = time.time()
    for k in [k for k, v in _presencia.items() if ahora - v > VENTANA]:
        del _presencia[k]
    return jsonify(conectados=len(_presencia))


@embeds_bp.get('/api/embed/tiktok')
def resolver_tiktok():
    url = (request.args.get('u') or '').strip()
    if not _URL_TT.match(url):
        return jsonify(error='Enlace no permitido'), 400
    req = urllib.request.Request(
        url, headers={'User-Agent': 'Mozilla/5.0 (Linux; Android 12)'})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            final = r.geturl()
    except Exception:
        return jsonify(error='No se pudo resolver el enlace'), 502
    m = _ID_VIDEO.search(final)
    if not m:
        return jsonify(error='El enlace no contiene un video'), 404
    return jsonify(embed='https://www.tiktok.com/embed/v2/' + m.group(1))
