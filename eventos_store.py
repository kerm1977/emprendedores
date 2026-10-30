import json
import time
import uuid
from datetime import datetime, timedelta, timezone
from flask import abort
from db import get_db

CR = timezone(timedelta(hours=-6))
CAMPOS = {'titulo': 160, 'fecha': 10, 'horaInicio': 5, 'horaFin': 5, 'lugar': 240, 'contacto': 160, 'telefono': 64, 'texto': 5000}
SINPES_SEMILLA = [('86529837', 'Jenny Ceciliano Córdoba'), ('87984232', 'Jenny Ceciliano Córdoba'), ('86227500', 'Kenneth Ruiz Matamoros')]
CUENTAS_SEMILLA = [('Jenny Ceciliano Córdoba', 'MUCAP', 'colones', 'CR66080402010100715103'), ('Jenny Ceciliano Córdoba', 'BCR', 'colones', 'CR62015202001268129163'), ('Kenneth Ruiz Matamoros', 'MUCAP', 'colones', 'CR19080403012501524778'), ('Juan Carlos Ruiz', 'BCR', 'colones', 'CR61015202001292863793'), ('Juan Carlos Ruiz', 'BCR', 'dólares', 'CR50015202001410361158')]


def _opcion(identificador, campos):
    return dict(dict(id=identificador or uuid.uuid4().hex), **campos)


def config_inicial():
    sinpes = [_opcion(None, dict(nombre=n, telefono=t)) for t, n in SINPES_SEMILLA]
    cuentas = [_opcion(None, dict(nombre=n, banco=b, moneda=m, cuenta=c)) for n, b, m, c in CUENTAS_SEMILLA]
    return dict(mensaje='Cancelá el anuncio según su etiqueta. El superusuario debe comprobar el pago antes de publicar.',
                sinpes=sinpes, seleccion_sinpe=sinpes[0]['id'] if sinpes else None,
                cuentas=cuentas, seleccion_cuentas=[c['id'] for c in cuentas],
                etiquetas=[_opcion(None, dict(nombre=n, precio=None, activo=True)) for n in ['Feria', 'Curso', 'Charla', 'Noticia', 'Anuncio', 'Denuncia', 'Otro']])


def normalizar_pagos(cfg):
    """Migra el formato anterior (un SINPE y una cuenta de texto) a listas
    seleccionables. Si nunca se configuró nada, siembra los datos aprobados."""
    if 'sinpes' not in cfg:
        legado = (cfg.get('sinpe') or '').strip()
        cfg['sinpes'] = [_opcion(None, dict(nombre='', telefono=legado))] if legado else [_opcion(None, dict(nombre=n, telefono=t)) for t, n in SINPES_SEMILLA]
        cfg['seleccion_sinpe'] = cfg['sinpes'][0]['id'] if cfg['sinpes'] else None
    if 'cuentas' not in cfg:
        legado = (cfg.get('cuenta') or '').strip()
        cfg['cuentas'] = [_opcion(None, dict(nombre='', banco='', moneda='colones', cuenta=legado))] if legado else [_opcion(None, dict(nombre=n, banco=b, moneda=m, cuenta=c)) for n, b, m, c in CUENTAS_SEMILLA]
        cfg['seleccion_cuentas'] = [c['id'] for c in cfg['cuentas']]
    cfg['seleccion_cuentas'] = [i for i in cfg.get('seleccion_cuentas') or [] if any(c['id'] == i for c in cfg['cuentas'])]
    if cfg.get('seleccion_sinpe') is not None and not any(s['id'] == cfg['seleccion_sinpe'] for s in cfg['sinpes']):
        cfg['seleccion_sinpe'] = cfg['sinpes'][0]['id'] if cfg['sinpes'] else None
    cfg.pop('sinpe', None)
    cfg.pop('cuenta', None)
    return cfg


def destinos_pago(cfg):
    sinpe = next((s for s in cfg['sinpes'] if s['id'] == cfg.get('seleccion_sinpe')), None)
    cuentas = [c for c in cfg['cuentas'] if c['id'] in set(cfg.get('seleccion_cuentas') or [])]
    return sinpe, cuentas


def conexion_eventos():
    db = get_db()
    db.executescript('''
        CREATE TABLE IF NOT EXISTS eventos_config (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL, revision INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS eventos (id TEXT PRIMARY KEY, owner TEXT NOT NULL, uid INTEGER, data TEXT NOT NULL, precio INTEGER, pago TEXT NOT NULL, estado TEXT NOT NULL, motivo TEXT NOT NULL, paid_at REAL, revision INTEGER NOT NULL, created REAL NOT NULL, updated REAL NOT NULL, expires REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS eventos_historial (id INTEGER PRIMARY KEY AUTOINCREMENT, evento TEXT NOT NULL, actor TEXT NOT NULL, accion TEXT NOT NULL, ts REAL NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS eventos_meta (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS eventos_estado_fecha ON eventos(estado, expires);
    ''')
    cfg = config_inicial()
    db.execute('INSERT OR IGNORE INTO eventos_config VALUES (1,?,1)', (json.dumps(cfg, ensure_ascii=False),))
    db.commit()
    from eventos_legacy import importar_ferias
    importar_ferias(db)
    return db


def configuracion(db):
    row = db.execute('SELECT * FROM eventos_config WHERE id=1').fetchone()
    return normalizar_pagos(dict(json.loads(row['data']), revision=row['revision']))


def _titulo(nombre):
    return ' '.join(w[:1].upper()+w[1:] for w in nombre.split())


def entero(valor, minimo, maximo):
    if isinstance(valor, bool) or not isinstance(valor, int) or not minimo <= valor <= maximo:
        abort(400, description='Importe o revisión fuera de rango')
    return valor


def validar_config(body, anterior):
    etiquetas = body.get('etiquetas')
    if not isinstance(etiquetas, list) or not 1 <= len(etiquetas) <= 100:
        abort(400, description='Ingresá entre una y cien etiquetas')
    nuevas, nombres, ids = [], set(), set()
    conocidos = {e['id'] for e in anterior['etiquetas']}
    for e in etiquetas:
        if not isinstance(e, dict):
            abort(400)
        nombre = _titulo(str(e.get('nombre', '')).strip())
        identificador = str(e.get('id') or uuid.uuid4().hex)
        if not nombre or len(nombre) > 80 or nombre.casefold() in nombres or identificador in ids or (e.get('id') and identificador not in conocidos):
            abort(400, description='Las etiquetas deben tener nombres únicos y conservar su identificador')
        gratis = e.get('gratis', False)
        if not isinstance(gratis, bool):
            abort(400)
        precio = e.get('precio')
        if gratis:
            precio = None
        elif precio is not None:
            entero(precio, 1, 100000000)
        if not isinstance(e.get('activo', True), bool):
            abort(400)
        nuevas.append(dict(id=identificador, nombre=nombre, precio=precio, gratis=gratis, activo=e.get('activo', True)))
        nombres.add(nombre.casefold())
        ids.add(identificador)
    if not conocidos.issubset(ids):
        abort(409, description='Desactivá las etiquetas anteriores en lugar de borrarlas')
    cfg = dict(etiquetas=nuevas)
    valor = body.get('mensaje', '')
    if not isinstance(valor, str) or len(valor) > 3000:
        abort(400)
    cfg['mensaje'] = valor.strip()
    cfg['sinpes'] = _lista_pago(body.get('sinpes'), {'nombre': 160, 'telefono': 80})
    cfg['cuentas'] = _lista_pago(body.get('cuentas'), {'nombre': 160, 'banco': 160, 'moneda': 20, 'cuenta': 160})
    sel = body.get('seleccion_sinpe')
    if sel is not None and not any(s['id'] == sel for s in cfg['sinpes']):
        abort(400, description='El SINPE seleccionado no existe')
    selc = body.get('seleccion_cuentas')
    if not isinstance(selc, list) or any(not any(c['id'] == i for c in cfg['cuentas']) for i in selc):
        abort(400, description='Las cuentas seleccionadas no existen')
    cfg['seleccion_sinpe'] = sel
    cfg['seleccion_cuentas'] = selc
    return cfg


def _lista_pago(lista, campos):
    if not isinstance(lista, list) or len(lista) > 50:
        abort(400, description='Revisá los destinos de pago')
    salida, ids = [], set()
    for o in lista:
        if not isinstance(o, dict):
            abort(400)
        identificador = str(o.get('id') or uuid.uuid4().hex)
        if identificador in ids:
            abort(400)
        ids.add(identificador)
        fila = {'id': identificador}
        for campo, limite in campos.items():
            valor = o.get(campo, '')
            if not isinstance(valor, str) or len(valor) > limite:
                abort(400)
            fila[campo] = valor.strip()
            if not fila[campo]:
                abort(400, description='Completá todos los datos de los destinos de pago')
        salida.append(fila)
    return salida


def cotizacion(cfg, etiqueta):
    tag = next((e for e in cfg['etiquetas'] if e['id'] == etiqueta and e['activo']), None)
    if not tag:
        abort(400, description='Seleccioná una etiqueta habilitada')
    if tag.get('gratis'):
        return dict(etiqueta=tag['id'], etiquetaNombre=tag['nombre'], precio=0, gratuito=True, pago={'sinpe': None, 'cuentas': [], 'mensaje': cfg['mensaje']}, config_revision=cfg['revision'])
    if not tag['precio']:
        abort(409, description='Esta etiqueta todavía no tiene una tarifa habilitada')
    sinpe, cuentas = destinos_pago(cfg)
    if not sinpe and not cuentas:
        abort(409, description='El superusuario debe seleccionar un SINPE o al menos una cuenta de pago')
    pago = {'sinpe': ({'telefono': sinpe['telefono'], 'nombre': sinpe['nombre']} if sinpe else None), 'cuentas': cuentas, 'mensaje': cfg['mensaje']}
    return dict(etiqueta=tag['id'], etiquetaNombre=tag['nombre'], precio=tag['precio'], pago=pago, config_revision=cfg['revision'])


def datos_evento(body, cfg, anterior=None):
    datos = {}
    for campo, limite in CAMPOS.items():
        valor = body.get(campo, '')
        if not isinstance(valor, str) or len(valor) > limite:
            abort(400, description='Revisá los campos del evento')
        datos[campo] = valor.strip()
        if not datos[campo]:
            abort(400, description='Completá todos los campos del evento')
    etiqueta = next((e for e in cfg['etiquetas'] if e['id'] == body.get('etiqueta')), None)
    if not etiqueta or (not etiqueta['activo'] and (not anterior or anterior.get('etiqueta') != etiqueta['id'])):
        abort(400, description='Seleccioná una etiqueta habilitada')
    datos.update(etiqueta=etiqueta['id'], etiquetaNombre=etiqueta['nombre'])
    try:
        inicio = datetime.strptime(datos['fecha']+' '+datos['horaInicio'], '%Y-%m-%d %H:%M').replace(tzinfo=CR)
        fin = datetime.strptime(datos['fecha']+' '+datos['horaFin'], '%Y-%m-%d %H:%M').replace(tzinfo=CR)
        if fin == inicio:
            abort(400, description='Las horas de inicio y final deben ser diferentes')
        if fin < inicio:
            fin += timedelta(days=1)
        expires = (fin + timedelta(hours=24)).timestamp()
    except (ValueError, OverflowError, OSError):
        abort(400, description='Fecha u horario inválidos')
    datos.update(fecha=inicio.strftime('%Y-%m-%d'), horaInicio=inicio.strftime('%H:%M'), horaFin=fin.strftime('%H:%M'))
    if expires <= time.time():
        abort(400, description='El anuncio ya habría vencido; actualizá la fecha y el horario')
    datos.update(inicio=inicio.timestamp(), fin=fin.timestamp())
    return datos, expires


def puede_editar(row, actor):
    return bool(actor and (actor['rol'] == 'super' or (row['owner'] and row['owner'] == actor['email'].strip().lower())))


def salida(row, privado=False):
    datos = dict(json.loads(row['data']), id=row['id'], expires=row['expires'])
    if privado:
        datos.update(owner=row['owner'], precio=row['precio'], pago=json.loads(row['pago']), estado=row['estado'], motivo=row['motivo'], paid_at=row['paid_at'], revision=row['revision'], editable=True)
    return datos


def historial(db, row, actor, accion):
    db.execute('INSERT INTO eventos_historial (evento,actor,accion,ts,revision,data) VALUES (?,?,?,?,?,?)', (row['id'], actor['email'] if actor else '', accion, time.time(), row['revision'], json.dumps(dict(row), ensure_ascii=False)))


def registro(db, identificador):
    row = db.execute('SELECT * FROM eventos WHERE id=?', (identificador,)).fetchone()
    if not row:
        abort(404, description='Evento no encontrado')
    return row
