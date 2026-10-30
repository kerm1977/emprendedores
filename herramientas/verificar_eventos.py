import concurrent.futures
import gc
import json
import os
from pathlib import Path
import sys
import tempfile
import uuid
from datetime import datetime
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


class BaseTemporal(tempfile.TemporaryDirectory):
    def cleanup(self):
        gc.collect()
        super().cleanup()


def verificar():
    with BaseTemporal() as carpeta:
        for variable, nombre in [('DATABASE_PATH', 'sistema'), ('USERS_DB_PATH', 'usuarios'), ('EMPR_DB_PATH', 'negocios')]:
            os.environ[variable] = str(Path(carpeta, nombre+'.sqlite'))
        import bcrypt
        import db
        from app import app
        from eventos_store import CR
        app.config['TESTING'] = True
        legado = dict(id='antigua', titulo='Feria anterior', fecha='2099-05-10', horaInicio='09:00', horaFin='18:00', lugar='Lugar anterior', contacto='Organizador', telefono='88881234', texto='Información conservada', email='organizador@example.test')
        original = json.dumps(dict(ferias=[legado, dict(legado, id='con-autor', owner=' ORGANIZADOR@example.test ')]), ensure_ascii=False)
        with app.app_context():
            db.ensure_db()
            usuarios = db.get_users_db()
            for email, rol in [('super@example.test', 'super'), ('organizador@example.test', 'user'), ('contacto@example.test', 'user'), ('admin@example.test', 'admin1')]:
                usuarios.execute("INSERT INTO usuarios (nombre,apellido,email,telefono,cedula,rol,pass_hash,created_at,updated_at) VALUES (?,'',?,'','',?,?,?,?)", (email, email, rol, bcrypt.hashpw(b'clave-pruebas', bcrypt.gensalt(rounds=4)).decode(), 'ahora', 'ahora'))
            usuarios.commit()
            db.get_db().execute('INSERT OR REPLACE INTO app_data (id,json,updated_at) VALUES (1,?,?)', (original, 'ahora'))
            db.get_db().commit()
        cliente = app.test_client()
        def login(email):
            r = cliente.post('/api/auth/login', json=dict(email=email, password='clave-pruebas'))
            assert r.status_code == 200, r.json
            return {'Authorization': 'Bearer '+r.json['user']['promo_token']}
        superusuario, creador, contacto, admin = [login(e+'@example.test') for e in ('super', 'organizador', 'contacto', 'admin')]
        def api(ruta, actor=None, datos=None, metodo=None):
            return cliente.open('/api/eventos'+ruta, method=metodo or ('POST' if datos is not None else 'GET'), headers=actor or {}, json=datos)
        assert api('').json['eventos'] == []
        panel = api('/panel', superusuario).json
        assert panel['total'] == 2 and all(e['estado'] == 'pendiente' for e in panel['eventos'])
        assert api('/panel', creador).json['total'] == 1
        sin_autor = next(e for e in panel['eventos'] if not e['owner'])
        assert api('/'+sin_autor['id'], creador).status_code == 403
        assert api('/'+sin_autor['id'], superusuario).json['editable']
        assert api('/panel', superusuario).json['total'] == 2
        with app.app_context():
            assert db.get_db().execute('SELECT json FROM app_data WHERE id=1').fetchone()['json'] == original
        cfg = panel['config']
        assert all(e['precio'] is None for e in cfg['etiquetas'])
        assert len(cfg['sinpes']) == 3 and len(cfg['cuentas']) == 5
        assert cfg['sinpes'][0]['telefono'] == '86529837' and cfg['cuentas'][0]['cuenta'] == 'CR66080402010100715103'
        datos = dict(titulo='Curso de prueba', etiqueta=cfg['etiquetas'][0]['id'], fecha='2099-05-10', horaInicio='09:00', horaFin='18:00', lugar='Lugar', contacto='Organizador', telefono='88881234', texto='Descripción completa')
        assert api('/cotizar', creador, datos).status_code == 409
        cfg['mensaje'] = 'Instrucciones de prueba'
        cfg['sinpes'][0].update(telefono='88881234', nombre='Cuenta de pruebas')
        cfg['seleccion_sinpe'] = cfg['sinpes'][0]['id']
        cfg['cuentas'][0].update(nombre='Prueba', banco='BCR', moneda='colones', cuenta='CUENTA-DE-PRUEBA-NO-REAL')
        cfg['seleccion_cuentas'] = [cfg['cuentas'][0]['id']]
        for i, etiqueta in enumerate(cfg['etiquetas']):
            etiqueta['precio'] = 1500 + i*1000
        cfg['etiquetas'].append(dict(nombre='Taller comunitario', precio=2500, activo=True))
        assert api('/config', None, cfg, 'PUT').status_code == 401
        assert api('/config', creador, cfg, 'PUT').status_code == 403
        assert api('/config', admin, cfg, 'PUT').status_code == 403
        guardada = api('/config', superusuario, cfg, 'PUT')
        assert guardada.status_code == 200, guardada.json
        assert api('/config', superusuario, cfg, 'PUT').status_code == 409
        cfg = guardada.json
        cuota = api('/cotizar', creador, datos).json
        assert cuota['precio'] == 1500
        vence = datetime.fromtimestamp(cuota['expires'], CR)
        assert (vence.year, vence.month, vence.day, vence.hour) == (2099, 5, 11, 18)
        noche = api('/cotizar', creador, dict(datos, horaInicio='23:00', horaFin='01:00')).json
        assert datetime.fromtimestamp(noche['expires'], CR).day == 12
        for malos in [dict(datos, fecha='2099-02-30'), dict(datos, horaFin='09:00'), dict(datos, telefono=''), dict(datos, fecha='9999-12-31')]:
            assert api('/cotizar', creador, malos).status_code == 400
        solicitud = dict(datos, solicitud=str(uuid.uuid4()), precio=cuota['precio'], config_revision=cuota['config_revision'], owner='super@example.test', estado='aprobado', paid_at=1)
        assert api('', None, solicitud).status_code == 401
        assert api('', creador, dict(solicitud, precio=1)).status_code == 409
        r = api('', creador, solicitud)
        assert r.status_code == 201, r.json
        evento = r.json
        assert evento['estado'] == 'pendiente' and evento['owner'] == 'organizador@example.test' and evento['paid_at'] is None
        assert api('', creador, solicitud).json['id'] == evento['id']
        assert api('').json['eventos'] == []
        assert api('/'+evento['id']).status_code == 403
        assert api('/'+evento['id'], contacto).status_code == 403
        assert api('/panel', contacto).json['total'] == 0
        assert api('/panel?q=organizador%40example.test', superusuario).json['total'] == 3
        def accion(actor, nombre, e):
            return api('/'+e['id']+'/acciones/'+nombre, actor, dict(revision=e['revision']))
        assert accion(creador, 'aprobar', evento).status_code == 403
        assert accion(admin, 'aprobar', evento).status_code == 403
        r = accion(superusuario, 'aprobar', evento)
        assert r.status_code == 200, r.json
        aprobado = r.json
        assert accion(superusuario, 'aprobar', evento).json['paid_at'] == aprobado['paid_at']
        publico = api('').json['eventos'][0]
        assert not {'owner', 'precio', 'pago', 'paid_at', 'revision', 'uid'} & publico.keys()
        assert not api('/'+evento['id'], contacto).json.get('editable')
        assert api('/'+evento['id'], creador).json['editable']
        assert api('/'+evento['id'], superusuario).json['superusuario']
        edicion = dict(datos, titulo='Curso actualizado', fecha='2099-05-12', etiqueta=cfg['etiquetas'][1]['id'], revision=aprobado['revision'], precio=1, owner='contacto@example.test')
        assert api('/'+evento['id'], contacto, edicion, 'PUT').status_code == 403
        editado = api('/'+evento['id'], creador, edicion, 'PUT').json
        assert editado['precio'] == 1500 and editado['paid_at'] == aprobado['paid_at'] and editado['estado'] == 'aprobado'
        assert editado['owner'] == 'organizador@example.test' and api('').json['eventos'][0]['titulo'] == 'Curso actualizado'
        assert api('/'+evento['id'], creador, edicion, 'PUT').status_code == 409
        assert accion(creador, 'revocar', editado).status_code == 403
        cancelado = accion(creador, 'cancelar', editado).json
        assert cancelado['estado'] == 'pendiente' and api('').json['eventos'] == []
        assert accion(superusuario, 'aprobar', editado).status_code == 409
        restaurado = accion(superusuario, 'aprobar', cancelado).json
        revocado = accion(superusuario, 'revocar', restaurado).json
        rechazado = accion(superusuario, 'rechazar', revocado).json
        assert rechazado['estado'] == 'pendiente'
        restaurado = accion(superusuario, 'aprobar', rechazado).json
        assert restaurado['paid_at'] == aprobado['paid_at'] and len(api('').json['eventos']) == 1
        assert len(api('/'+evento['id'], creador).json['historial']) >= 7
        cfg['etiquetas'][1]['gratis'] = True
        cfg['etiquetas'][1]['precio'] = None
        cfg = api('/config', superusuario, cfg, 'PUT').json
        libre = api('/cotizar', creador, dict(datos, etiqueta=cfg['etiquetas'][1]['id'])).json
        assert libre['gratuito'] and libre['precio'] == 0
        ev_libre = api('', creador, dict(datos, etiqueta=cfg['etiquetas'][1]['id'], solicitud=str(uuid.uuid4()), precio=libre['precio'], config_revision=libre['config_revision'])).json
        assert ev_libre['precio'] == 0 and ev_libre['estado'] == 'pendiente'
        aprob_libre = accion(superusuario, 'aprobar', ev_libre).json
        assert aprob_libre['estado'] == 'aprobado' and any(e['id'] == ev_libre['id'] for e in api('').json['eventos'])
        cfg['sinpes'][0]['telefono'] = '99990000'
        cfg['sinpes'].append(dict(nombre='SINPE agregado', telefono='61112233'))
        cfg['cuentas'].append(dict(nombre='Cuenta agregada', banco='BN', moneda='dólares', cuenta='CR10000000000000000001'))
        cfg['etiquetas'][1]['precio'] = 99000
        cfg = api('/config', superusuario, cfg, 'PUT').json
        assert len(cfg['sinpes']) == 4 and len(cfg['cuentas']) == 6
        cambio = api('/'+evento['id'], creador, dict(edicion, revision=restaurado['revision']), 'PUT').json
        assert cambio['precio'] == 1500 and cambio['pago']['sinpe']['telefono'] == '88881234' and cambio['pago']['cuentas'][0]['cuenta'] == 'CUENTA-DE-PRUEBA-NO-REAL'
        assert api('', creador, dict(solicitud, solicitud=str(uuid.uuid4()))).status_code == 409
        with patch('eventos_routes.time.time', return_value=cambio['expires'] - .001):
            assert len(api('').json['eventos']) == 1
        with patch('eventos_routes.time.time', return_value=cambio['expires']):
            assert api('').json['eventos'] == []
            assert api('/'+evento['id']).status_code == 403
        nueva_cuota = api('/cotizar', creador, datos).json
        otro = api('', creador, dict(datos, solicitud=str(uuid.uuid4()), precio=nueva_cuota['precio'], config_revision=nueva_cuota['config_revision'])).json
        def paralelo(_):
            with app.test_client() as c:
                return c.post('/api/eventos/'+otro['id']+'/acciones/aprobar', headers=superusuario, json=dict(revision=otro['revision'])).status_code
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ejecutor:
            assert list(ejecutor.map(paralelo, range(2))) == [200, 200]
        assert sum(h['accion'] == 'aprobar' for h in api('/'+otro['id'], creador).json['historial']) == 1
        with app.app_context():
            assert db.get_db().execute('SELECT json FROM app_data WHERE id=1').fetchone()['json'] == original
        print('OK: eventos aislados; migración sin borrar; etiquetas y tarifas; permisos; privacidad; publicación; edición sin recobro; cancelación/revocación recuperables; concurrencia; horarios CR y vencimiento exacto a las 24 horas')
        gc.collect()


if __name__ == '__main__':
    verificar()
