import json
import time
import uuid
from flask import Blueprint, request, jsonify, abort
from werkzeug.exceptions import HTTPException
from promo_auth import actor_promocion, super_promocion
from eventos_store import conexion_eventos, configuracion, validar_config, cotizacion, datos_evento, puede_editar, salida, historial, registro

eventos_bp = Blueprint('eventos', __name__)


@eventos_bp.errorhandler(HTTPException)
def error_evento(error):
    return jsonify(error=error.description), error.code


@eventos_bp.before_request
def cuerpo_evento():
    if request.method in ('POST', 'PUT') and not isinstance(request.get_json(silent=True), dict):
        abort(400, description='Se esperaba un objeto JSON')


@eventos_bp.after_request
def respuesta_evento(resp):
    resp.headers['Cache-Control'] = 'no-store'
    return resp


@eventos_bp.get('/api/eventos')
def listar_publicos():
    db = conexion_eventos()
    ahora = time.time()
    return jsonify(eventos=[salida(r) for r in db.execute("SELECT * FROM eventos WHERE estado='aprobado' AND paid_at IS NOT NULL AND expires>? ORDER BY expires,id", (ahora,))], server_now=ahora)


@eventos_bp.get('/api/eventos/opciones')
def opciones():
    actor_promocion()
    cfg = configuracion(conexion_eventos())
    cfg['etiquetas'] = [e for e in cfg['etiquetas'] if e['activo']]
    return jsonify(cfg)


@eventos_bp.get('/api/eventos/panel')
def panel_eventos():
    actor = actor_promocion()
    db = conexion_eventos()
    q = request.args.get('q', '')[:160]
    try:
        pagina = max(0, min(100000, int(request.args.get('pagina', '0'))))
    except ValueError:
        abort(400)
    filtros, parametros = ['(data LIKE ? OR owner LIKE ?)'], ['%'+q+'%', '%'+q+'%']
    if actor['rol'] != 'super':
        filtros.append('owner=?')
        parametros.append(actor['email'].strip().lower())
    where = ' WHERE ' + ' AND '.join(filtros)
    total = db.execute('SELECT count(*) FROM eventos'+where, parametros).fetchone()[0]
    filas = db.execute("SELECT * FROM eventos"+where+" ORDER BY estado='pendiente' DESC,updated DESC LIMIT 100 OFFSET ?", parametros+[pagina*100]).fetchall()
    return jsonify(eventos=[salida(r, True) for r in filas], superusuario=actor['rol'] == 'super', config=configuracion(db) if actor['rol'] == 'super' else None, pagina=pagina, paginas=max(1, (total+99)//100), total=total, q=q)


@eventos_bp.put('/api/eventos/config')
def configurar():
    super_promocion()
    db = conexion_eventos()
    db.execute('BEGIN IMMEDIATE')
    anterior = configuracion(db)
    body = request.get_json()
    if body.get('revision') != anterior['revision']:
        abort(409, description='Otra configuración fue guardada; recargá antes de continuar')
    cfg = validar_config(body, anterior)
    db.execute('UPDATE eventos_config SET data=?,revision=revision+1 WHERE id=1', (json.dumps(cfg, ensure_ascii=False),))
    db.commit()
    return jsonify(configuracion(db))


@eventos_bp.post('/api/eventos/cotizar')
def cotizar_evento():
    actor_promocion()
    cfg = configuracion(conexion_eventos())
    body = request.get_json()
    datos, expires = datos_evento(body, cfg)
    return jsonify(dict(cotizacion(cfg, body.get('etiqueta')), expires=expires))


def importe_validado(cfg, body):
    cuota = cotizacion(cfg, body.get('etiqueta'))
    if type(body.get('precio')) is not int or body['precio'] != cuota['precio'] or body.get('config_revision') != cuota['config_revision']:
        abort(409, description='Cambió el precio o la información de pago. Revisá la solicitud; si ya pagaste, consultá al superusuario antes de volver a pagar')
    return cuota


@eventos_bp.post('/api/eventos')
def crear_evento():
    actor = actor_promocion()
    body = request.get_json()
    try:
        identificador = uuid.UUID(str(body.get('solicitud'))).hex
    except ValueError:
        abort(400, description='Identificador de solicitud inválido')
    db = conexion_eventos()
    db.execute('BEGIN IMMEDIATE')
    anterior = db.execute('SELECT * FROM eventos WHERE id=?', (identificador,)).fetchone()
    if anterior:
        if anterior['owner'] != actor['email'].strip().lower():
            abort(409)
        return jsonify(salida(anterior, True))
    cfg = configuracion(db)
    datos, expires = datos_evento(body, cfg)
    cuota = importe_validado(cfg, body)
    ahora = time.time()
    db.execute('INSERT INTO eventos VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', (identificador, actor['email'].strip().lower(), actor['id'], json.dumps(datos, ensure_ascii=False), cuota['precio'], json.dumps(cuota['pago'], ensure_ascii=False), 'pendiente', 'Sin tarifa: pendiente de aprobación del superusuario' if cuota['precio'] == 0 else 'Pendiente de comprobar pago y aprobar publicación', None, 1, ahora, ahora, expires))
    fila = registro(db, identificador)
    historial(db, fila, actor, 'creado-pendiente')
    db.commit()
    return jsonify(salida(fila, True)), 201


@eventos_bp.get('/api/eventos/<identificador>')
def detalle_evento(identificador):
    actor = actor_promocion(False)
    db = conexion_eventos()
    fila = registro(db, identificador)
    privado = puede_editar(fila, actor)
    if not privado and (fila['estado'] != 'aprobado' or fila['paid_at'] is None or fila['expires'] <= time.time()):
        abort(403, description='Este evento no está publicado')
    datos = salida(fila, privado)
    datos['superusuario'] = bool(actor and actor['rol'] == 'super')
    if privado:
        datos['historial'] = [dict(r) for r in db.execute('SELECT accion,actor,ts,revision FROM eventos_historial WHERE evento=? ORDER BY id DESC LIMIT 50', (identificador,))]
    return jsonify(datos)


@eventos_bp.put('/api/eventos/<identificador>')
def editar_evento(identificador):
    actor = actor_promocion()
    db = conexion_eventos()
    db.execute('BEGIN IMMEDIATE')
    fila = registro(db, identificador)
    if not puede_editar(fila, actor):
        abort(403)
    body = request.get_json()
    if body.get('revision') != fila['revision']:
        abort(409, description='El evento cambió en otro dispositivo; abrilo de nuevo para editar')
    cfg = configuracion(db)
    datos, expires = datos_evento(body, cfg, json.loads(fila['data']))
    cuota = dict(precio=fila['precio'], pago=json.loads(fila['pago'])) if fila['paid_at'] is not None else importe_validado(cfg, body)
    db.execute('UPDATE eventos SET data=?,expires=?,precio=?,pago=?,revision=revision+1,updated=? WHERE id=?', (json.dumps(datos, ensure_ascii=False), expires, cuota['precio'], json.dumps(cuota['pago'], ensure_ascii=False), time.time(), identificador))
    nuevo = registro(db, identificador)
    historial(db, nuevo, actor, 'editado-sin-recobro' if fila['paid_at'] is not None else 'editado-pendiente')
    db.commit()
    return jsonify(salida(nuevo, True))


@eventos_bp.post('/api/eventos/<identificador>/acciones/<accion>')
def moderar_evento(identificador, accion):
    actor = actor_promocion()
    if accion not in ('aprobar', 'rechazar', 'revocar', 'cancelar'):
        abort(404)
    if accion != 'cancelar' and actor['rol'] != 'super':
        abort(403)
    db = conexion_eventos()
    db.execute('BEGIN IMMEDIATE')
    fila = registro(db, identificador)
    if not puede_editar(fila, actor):
        abort(403)
    if accion == 'aprobar' and fila['estado'] == 'aprobado':
        return jsonify(salida(fila, True))
    if request.get_json().get('revision') != fila['revision']:
        abort(409, description='El evento cambió; revisá sus datos antes de confirmar')
    if accion == 'aprobar' and (fila['precio'] is None or (fila['precio'] != 0 and not json.loads(fila['pago'])) or fila['expires'] <= time.time()):
        abort(409, description='Completá fecha, horario y tarifa del evento antes de aprobar')
    estado = 'aprobado' if accion == 'aprobar' else 'pendiente'
    motivos = dict(aprobar='Pago confirmado por superusuario', rechazar='No confirmado; pendiente y recuperable', revocar='Revocado; pendiente y recuperable', cancelar='Cancelado; pendiente y recuperable')
    pago = (fila['paid_at'] or time.time()) if accion == 'aprobar' else fila['paid_at']
    db.execute('UPDATE eventos SET estado=?,motivo=?,paid_at=?,revision=revision+1,updated=? WHERE id=?', (estado, motivos[accion], pago, time.time(), identificador))
    nuevo = registro(db, identificador)
    historial(db, nuevo, actor, accion)
    db.commit()
    return jsonify(salida(nuevo, True))
