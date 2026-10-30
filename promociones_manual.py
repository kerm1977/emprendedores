import json
import time
import uuid
from flask import Blueprint, request, jsonify, abort
from promo_auth import actor_promocion, super_promocion
from promociones_store import conexion, config, validar_config, cotizar, vencimiento, negocio, es_creador, publico

promociones_bp = Blueprint('promociones', __name__)


@promociones_bp.before_request
def validar_cuerpo():
    if request.method in ('POST', 'PUT') and not isinstance(request.get_json(silent=True), dict):
        abort(400, description='Se esperaba un objeto JSON')


@promociones_bp.after_request
def sin_cache(resp):
    resp.headers['Cache-Control'] = 'no-store'
    return resp


@promociones_bp.delete('/api/promociones/sesion')
def revocar_sesion():
    import hashlib
    actor_promocion()
    from promo_auth import tablas_sesion
    token = request.headers.get('Authorization', '').removeprefix('Bearer ')
    db = tablas_sesion()
    db.execute('DELETE FROM promo_sessions WHERE digest=?', (hashlib.sha256(token.encode()).hexdigest(),))
    db.commit()
    return jsonify(ok=True)


@promociones_bp.get('/api/promociones')
def espacios_publicos():
    return jsonify(publico(conexion()))


@promociones_bp.get('/api/promociones/panel')
def panel():
    actor = actor_promocion()
    db = conexion()
    where = '' if actor['rol'] == 'super' else ' WHERE uid=?'
    args = () if not where else (actor['id'],)
    solicitudes = [dict(r) for r in db.execute('SELECT * FROM promo_requests'+where+' ORDER BY created DESC LIMIT 250', args)]
    activos = [dict(r) for r in db.execute('SELECT * FROM promo_active'+where, args)]
    return jsonify(config=config(db), solicitudes=solicitudes, activos=activos, superusuario=actor['rol'] == 'super', server_now=time.time())


@promociones_bp.put('/api/promociones/config')
def guardar_tarifas():
    super_promocion()
    cfg = validar_config(request.get_json(silent=True) or {})
    db = conexion()
    db.execute('BEGIN IMMEDIATE')
    usados = db.execute('SELECT count(*) FROM promo_active WHERE ends>?', (time.time(),)).fetchone()[0]
    if usados > cfg['capacidad']:
        db.rollback()
        abort(409, description='No se puede reducir la capacidad por debajo de promociones ya vigentes')
    db.execute('UPDATE promo_config SET data=? WHERE id=1', (json.dumps(cfg, ensure_ascii=False),))
    db.commit()
    return jsonify(ok=True, config=cfg)


@promociones_bp.post('/api/promociones/cotizar')
def cotizacion():
    actor_promocion()
    return jsonify(cotizar(config(conexion()), request.get_json(silent=True) or {}))


@promociones_bp.post('/api/promociones/solicitudes')
def solicitar():
    actor = actor_promocion()
    body = request.get_json(silent=True) or {}
    e = negocio(body.get('emp'))
    if not es_creador(e, actor):
        abort(403, description='Solo el creador del negocio puede solicitar publicidad')
    if e.get('pausa'):
        abort(409, description='Reactivá el negocio antes de promocionarlo')
    db = conexion()
    cfg = config(db)
    plan = cotizar(cfg, body)
    if body.get('precio') != plan['precio']:
        abort(409, description='La tarifa cambió; consultá y confirmá nuevamente el precio')
    db.execute('BEGIN IMMEDIATE')
    if db.execute("SELECT 1 FROM promo_requests WHERE emp=? AND estado='pendiente'", (str(e['id']),)).fetchone():
        db.rollback()
        abort(409, description='Este negocio ya tiene una solicitud pendiente')
    ahora = time.time()
    vigente = db.execute('SELECT 1 FROM promo_active WHERE emp=? AND ends>?', (str(e['id']), ahora)).fetchone()
    usados = db.execute('SELECT count(*) FROM promo_active WHERE ends>?', (ahora,)).fetchone()[0]
    if not vigente and usados >= cfg['capacidad']:
        db.rollback()
        abort(409, description='No hay cupos disponibles. No realicés el pago hasta consultar al superusuario')
    identificador = uuid.uuid4().hex
    db.execute('INSERT INTO promo_requests (id,emp,uid,email,nombre,plan,precio,estado,created) VALUES (?,?,?,?,?,?,?,?,?)', (identificador, str(e['id']), actor['id'], actor['email'], str(e.get('nombre', '')), json.dumps(plan, ensure_ascii=False), plan['precio'], 'pendiente', ahora))
    db.commit()
    return jsonify(ok=True, id=identificador, mensaje='Pago informado; pendiente de verificación del superusuario'), 201


@promociones_bp.post('/api/promociones/solicitudes/<identificador>/aprobar')
def aprobar(identificador):
    actor = super_promocion()
    db = conexion()
    db.execute('BEGIN IMMEDIATE')
    r = db.execute('SELECT * FROM promo_requests WHERE id=?', (identificador,)).fetchone()
    if not r:
        db.rollback()
        abort(404)
    if r['estado'] == 'aprobado':
        db.rollback()
        return jsonify(ok=True, mensaje='La aprobación ya se había aplicado')
    if r['estado'] != 'pendiente':
        db.rollback()
        abort(409, description='La solicitud ya fue atendida')
    e = negocio(r['emp'])
    if str(e.get('owner', '')).strip().lower() != r['email'].strip().lower() or e.get('pausa'):
        db.rollback()
        abort(409, description='Cambió el creador o el negocio está pausado; revisar antes de aprobar')
    ahora = time.time()
    anterior = db.execute('SELECT * FROM promo_active WHERE emp=?', (r['emp'],)).fetchone()
    vigente = anterior and anterior['ends'] > ahora
    usados = db.execute('SELECT count(*) FROM promo_active WHERE ends>?', (ahora,)).fetchone()[0]
    if not vigente and usados >= config(db)['capacidad']:
        db.rollback()
        abort(409, description='Capacidad completa; no se activó la promoción')
    inicio = anterior['starts'] if vigente else ahora
    fin = vencimiento(anterior['ends'] if vigente else ahora, json.loads(r['plan']))
    db.execute('INSERT OR REPLACE INTO promo_active VALUES (?,?,?,?,?)', (r['emp'], r['uid'], inicio, fin, identificador))
    db.execute("UPDATE promo_requests SET estado='aprobado', aprobado_por=?, aprobado=? WHERE id=?", (actor['id'], ahora, identificador))
    db.commit()
    return jsonify(ok=True, starts=inicio, ends=fin)


@promociones_bp.post('/api/promociones/solicitudes/<identificador>/rechazar')
def rechazar(identificador):
    actor = super_promocion()
    db = conexion()
    cursor = db.execute("UPDATE promo_requests SET estado='rechazado', aprobado_por=?, aprobado=? WHERE id=? AND estado='pendiente'", (actor['id'], time.time(), identificador))
    db.commit()
    if not cursor.rowcount:
        abort(409, description='La solicitud ya fue atendida o no existe')
    return jsonify(ok=True)
