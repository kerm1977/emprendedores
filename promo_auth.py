import hashlib
import secrets
import time
from flask import request, jsonify, abort
from db import get_db, get_users_db


def tablas_sesion():
    db = get_db()
    db.execute('CREATE TABLE IF NOT EXISTS promo_sessions (digest TEXT PRIMARY KEY, uid INTEGER NOT NULL, expires REAL NOT NULL)')
    db.commit()
    return db


def actor_promocion(obligatorio=True):
    token = request.headers.get('Authorization', '').removeprefix('Bearer ')
    if not token:
        if obligatorio:
            abort(401, description='Ingresá nuevamente con conexión para autorizar esta operación')
        return None
    digest = hashlib.sha256(token.encode()).hexdigest()
    row = tablas_sesion().execute('SELECT uid FROM promo_sessions WHERE digest=? AND expires>?', (digest, time.time())).fetchone()
    actor = get_users_db().execute('SELECT * FROM usuarios WHERE id=?', (row['uid'],)).fetchone() if row else None
    if actor is None and obligatorio:
        abort(401, description='Sesión del servidor vencida; ingresá nuevamente')
    return actor


def super_promocion():
    actor = actor_promocion()
    if actor['rol'] != 'super':
        abort(403, description='Solo el superusuario puede realizar esta operación')
    return actor


def proteger_usuarios():
    if request.method not in ('PUT', 'DELETE') or request.endpoint not in ('auth.update_usuario', 'auth.delete_usuario'):
        return None
    actor = actor_promocion()
    uid = request.view_args['uid']
    objetivo = get_users_db().execute('SELECT * FROM usuarios WHERE id=?', (uid,)).fetchone()
    if objetivo is None:
        abort(404)
    rol = actor['rol']
    body = request.get_json(silent=True) or {}
    if request.method == 'DELETE':
        if not (rol == 'super' or (rol == 'admin1' and objetivo['rol'] != 'super')):
            abort(403)
    else:
        propio = actor['id'] == uid
        admin = rol == 'super' or (rol == 'admin1' and objetivo['rol'] != 'super')
        imagen = rol == 'admin2' and set(body).issubset({'foto'})
        if not (propio or admin or imagen):
            abort(403)
        if 'rol' in body and (not admin or (rol != 'super' and body['rol'] == 'super')):
            abort(403)
    return None


def sesion_en_respuesta(resp):
    if request.method != 'POST' or request.endpoint not in ('auth.auth_login', 'auth.auth_register', 'google_auth.google_auth') or resp.status_code != 200:
        return resp
    data = resp.get_json(silent=True)
    if not isinstance(data, dict) or not data.get('user', {}).get('id'):
        return resp
    token = secrets.token_urlsafe(40)
    db = tablas_sesion()
    db.execute('DELETE FROM promo_sessions WHERE expires<?', (time.time(),))
    db.execute('INSERT INTO promo_sessions VALUES (?,?,?)', (hashlib.sha256(token.encode()).hexdigest(), data['user']['id'], time.time() + 30 * 86400))
    db.commit()
    data['user']['promo_token'] = token
    resp.set_data(jsonify(data).get_data())
    resp.headers['Cache-Control'] = 'no-store'
    return resp


def error_seguridad(error):
    if request.path.startswith(('/api/promociones', '/api/usuarios')):
        return jsonify(error=error.description), error.code
    return error.get_response()
