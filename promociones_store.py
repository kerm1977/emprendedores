import calendar
import json
import math
import time
from datetime import datetime, timedelta, timezone
from flask import abort
from db import get_db

CR = timezone(timedelta(hours=-6))
PLANES = [('3d', '3 días', 'dias', 3), ('7d', '1 semana', 'dias', 7), ('15d', '15 días', 'dias', 15), ('22d', '22 días', 'dias', 22)] + [(str(n)+'m', ('1 año' if n == 12 else str(n)+' mes'+('es' if n > 1 else '')), 'meses', n) for n in (1, 2, 3, 4, 5, 6, 8, 12)]


def conexion():
    db = get_db()
    db.executescript('''
        CREATE TABLE IF NOT EXISTS promo_config (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS promo_requests (id TEXT PRIMARY KEY, emp TEXT NOT NULL, uid INTEGER NOT NULL, email TEXT NOT NULL, nombre TEXT NOT NULL, plan TEXT NOT NULL, precio INTEGER NOT NULL, estado TEXT NOT NULL, created REAL NOT NULL, aprobado_por INTEGER, aprobado REAL);
        CREATE TABLE IF NOT EXISTS promo_active (emp TEXT PRIMARY KEY, uid INTEGER NOT NULL, starts REAL NOT NULL, ends REAL NOT NULL, request_id TEXT NOT NULL);
    ''')
    inicial = dict(capacidad=10, mensaje='Elegí un plan. Informá tu pago para que el superusuario lo verifique. La promoción comienza al aprobar el pago.', recargo_personal=50, planes=[dict(id=i, nombre=n, unidad=u, cantidad=c, precio=None) for i,n,u,c in PLANES])
    db.execute('INSERT OR IGNORE INTO promo_config VALUES (1,?)', (json.dumps(inicial, ensure_ascii=False),))
    db.commit()
    return db


def config(db):
    return json.loads(db.execute('SELECT data FROM promo_config WHERE id=1').fetchone()['data'])


def entero(valor, minimo, maximo):
    if isinstance(valor, bool) or not isinstance(valor, int) or not minimo <= valor <= maximo:
        abort(400, description='Número fuera de rango')
    return valor


def validar_config(body):
    cfg = dict(capacidad=entero(body.get('capacidad'), 1, 1000), mensaje=str(body.get('mensaje', ''))[:3000], recargo_personal=entero(body.get('recargo_personal', 50), 0, 500))
    recibidos = body.get('planes')
    if not isinstance(recibidos, list) or len(recibidos) != len(PLANES) or any(not isinstance(p, dict) for p in recibidos):
        abort(400, description='Planes incompletos')
    cfg['planes'] = []
    for i,n,u,c in PLANES:
        p = next((x for x in recibidos if x.get('id') == i), None)
        if p is None:
            abort(400)
        precio = p.get('precio')
        if precio is not None:
            entero(precio, 1, 100000000)
        cfg['planes'].append(dict(id=i, nombre=n, unidad=u, cantidad=c, precio=precio))
    return cfg


def cotizar(cfg, body):
    if body.get('plan') == 'personal':
        dias = entero(body.get('dias'), 1, 365)
        base = next(p for p in cfg['planes'] if p['id'] == '3d')['precio']
        if not base:
            abort(409, description='El superusuario debe configurar la tarifa de tres días')
        factor = 1 + cfg['recargo_personal'] / 100 if dias < 3 else 1
        return dict(id='personal', nombre=str(dias)+' días personalizados', unidad='dias', cantidad=dias, precio=math.ceil(base * dias / 3 * factor))
    plan = next((p for p in cfg['planes'] if p['id'] == body.get('plan')), None)
    if not plan or not plan['precio']:
        abort(409, description='Plan sin tarifa; consultá al superusuario')
    return plan.copy()


def vencimiento(inicio, plan):
    fecha = datetime.fromtimestamp(inicio, CR)
    if plan['unidad'] == 'dias':
        return (fecha + timedelta(days=plan['cantidad'])).timestamp()
    mes = fecha.month - 1 + plan['cantidad']
    ano = fecha.year + mes // 12
    mes = mes % 12 + 1
    return fecha.replace(year=ano, month=mes, day=min(fecha.day, calendar.monthrange(ano, mes)[1])).timestamp()


def negocio(emp):
    row = get_db().execute('SELECT json FROM app_data WHERE id=1').fetchone()
    datos = json.loads(row['json']) if row else {}
    e = next((e for e in datos.get('emprendimientos', []) if str(e.get('id')) == str(emp)), None)
    if not e:
        abort(404, description='Negocio inexistente')
    return e


def es_creador(e, actor):
    return bool(e.get('owner')) and str(e['owner']).strip().lower() == actor['email'].strip().lower()


def publico(db):
    ahora = time.time()
    return dict(capacidad=config(db)['capacidad'], activos=[dict(r) for r in db.execute('SELECT emp, starts, ends FROM promo_active WHERE starts<=? AND ends>?', (ahora, ahora))], server_now=ahora)
