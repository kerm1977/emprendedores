import concurrent.futures
import json
import os
from pathlib import Path
import sys
import tempfile
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def verificar():
    with tempfile.TemporaryDirectory() as carpeta:
        os.environ['DATABASE_PATH'] = str(Path(carpeta, 'sistema.sqlite'))
        os.environ['USERS_DB_PATH'] = str(Path(carpeta, 'usuarios.sqlite'))
        os.environ['EMPR_DB_PATH'] = str(Path(carpeta, 'negocios.sqlite'))
        import bcrypt
        import db
        from app import app
        from promociones_store import CR, vencimiento
        app.config['TESTING'] = True
        with app.app_context():
            db.ensure_db()
            usuarios = db.get_users_db()
            for email, rol in [('admin@example.test', 'super'), ('dueno@example.test', 'user'), ('otro@example.test', 'user')]:
                usuarios.execute("INSERT INTO usuarios (nombre,apellido,email,telefono,cedula,rol,pass_hash,created_at,updated_at) VALUES (?,'',?,'','',?,?,?,?)", (email, email, rol, bcrypt.hashpw(b'clave-de-prueba', bcrypt.gensalt(rounds=4)).decode(), 'ahora', 'ahora'))
            usuarios.commit()
            datos = dict(emprendimientos=[dict(id=i, nombre='Negocio '+str(i), owner='dueno@example.test', email='otro@example.test') for i in (1, 2)])
            db.get_db().execute('INSERT OR REPLACE INTO app_data (id,json,updated_at) VALUES (1,?,?)', (json.dumps(datos), 'ahora'))
            db.get_db().commit()
        cliente = app.test_client()
        def login(email):
            res = cliente.post('/api/auth/login', json=dict(email=email, password='clave-de-prueba'))
            assert res.status_code == 200, res.json
            return {'Authorization': 'Bearer '+res.json['user']['promo_token']}
        admin = login('admin@example.test')
        dueno = login('dueno@example.test')
        otro = login('otro@example.test')
        assert cliente.get('/api/promociones/panel').status_code == 401
        assert cliente.get('/api/promociones/panel', headers={'Authorization': 'Bearer inventado'}).status_code == 401
        cfg = cliente.get('/api/promociones/panel', headers=admin).json['config']
        assert cfg['capacidad'] == 10 and all(p['precio'] is None for p in cfg['planes'])
        assert len(cfg['planes']) == 12
        cfg['capacidad'] = 1
        for p in cfg['planes']:
            p['precio'] = 7000 if p['id'] == '7d' else 1500
        assert cliente.put('/api/promociones/config', headers=dueno, json=cfg).status_code == 403
        assert cliente.put('/api/promociones/config', headers=admin, json=cfg).status_code == 200
        quote = cliente.post('/api/promociones/cotizar', headers=dueno, json=dict(plan='personal', dias=1))
        assert quote.json['precio'] == 750
        assert cliente.post('/api/promociones/solicitudes', headers=otro, json=dict(emp=1, plan='3d', precio=1500)).status_code == 403
        assert cliente.post('/api/promociones/solicitudes', headers=dueno, json=dict(emp=1, plan='3d', precio=1)).status_code == 409
        solicitudes = []
        for emp in (1, 2):
            res = cliente.post('/api/promociones/solicitudes', headers=dueno, json=dict(emp=emp, plan='3d', precio=1500))
            assert res.status_code == 201, res.json
            solicitudes.append(res.json['id'])
        assert cliente.post('/api/promociones/solicitudes', headers=dueno, json=dict(emp=1, plan='3d', precio=1500)).status_code == 409
        assert cliente.post('/api/promociones/solicitudes/'+solicitudes[0]+'/aprobar', headers=dueno, json={}).status_code == 403
        def aprobar(identificador):
            with app.test_client() as paralelo:
                r = paralelo.post('/api/promociones/solicitudes/'+identificador+'/aprobar', headers=admin, json={})
                return identificador, r.status_code, r.json
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ejecutor:
            resultados = list(ejecutor.map(aprobar, solicitudes))
        assert sorted(r[1] for r in resultados) == [200, 409], resultados
        ganador = next(r for r in resultados if r[1] == 200)
        emp = solicitudes.index(ganador[0]) + 1
        fin = ganador[2]['ends']
        assert aprobar(ganador[0])[1] == 200
        publico = cliente.get('/api/promociones').json
        assert len(publico['activos']) == 1 and publico['activos'][0]['ends'] == fin
        assert set(publico['activos'][0]) == {'emp', 'starts', 'ends'}
        nuevo = cliente.post('/api/promociones/solicitudes', headers=dueno, json=dict(emp=emp, plan='7d', precio=7000))
        assert nuevo.status_code == 201
        renovacion = aprobar(nuevo.json['id'])
        assert renovacion[1] == 200 and abs(renovacion[2]['ends'] - fin - 7*86400) < .001
        hora = datetime.fromtimestamp(fin, CR).hour
        assert datetime.fromtimestamp(renovacion[2]['ends'], CR).hour == hora
        enero = datetime(2028, 1, 31, 10, tzinfo=CR).timestamp()
        febrero = datetime.fromtimestamp(vencimiento(enero, dict(unidad='meses', cantidad=1)), CR)
        assert (febrero.month, febrero.day, febrero.hour) == (2, 29, 10)
        assert cliente.post('/api/promociones/cobro', headers=dueno, json={}).status_code == 501
        assert cliente.put('/api/usuarios/1', json=dict(password='intruso')).status_code == 401
        with app.app_context():
            uid_otro = db.get_users_db().execute('SELECT id FROM usuarios WHERE email=?', ('otro@example.test',)).fetchone()['id']
        assert cliente.put('/api/usuarios/'+str(uid_otro), headers=dueno, json=dict(password='intruso')).status_code == 403
        duplicado = cliente.post('/api/auth/register', json=dict(nombre='Intruso', email='admin@example.test', password='intruso'))
        assert duplicado.status_code == 409
        login('admin@example.test')
        assert cliente.get('/api/promociones/panel', headers=otro).json['solicitudes'] == []
        assert cliente.delete('/api/promociones/sesion', headers=dueno).status_code == 200
        assert cliente.get('/api/promociones/panel', headers=dueno).status_code == 401
        print('OK: tokens, permisos, privacidad, tarifas, cotización, cupo concurrente, aprobación idempotente, renovación, calendario CR, cobro deshabilitado y protección de cuentas; SQLite temporal aislado')
        import gc
        gc.collect()


if __name__ == '__main__':
    verificar()
