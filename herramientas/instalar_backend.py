import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import uuid

ARCHIVOS = ('app.py', 'auth_routes.py', 'google_routes.py', 'uploads_routes.py', 'promo_auth.py', 'promociones_store.py', 'promociones_manual.py', 'promociones_cobro.py', 'eventos_store.py', 'eventos_routes.py', 'eventos_legacy.py', 'actualizacion_routes.py')


def validar_paquete(origen):
    manifest = json.loads((origen / 'backend-manifest.json').read_text(encoding='utf-8'))
    if set(manifest) != set(ARCHIVOS):
        raise ValueError('El manifiesto no corresponde al backend permitido')
    for nombre in ARCHIVOS:
        archivo = origen / nombre
        if archivo.is_symlink() or not archivo.is_file() or archivo.resolve().parent != origen:
            raise ValueError('Archivo de paquete inválido: '+nombre)
        contenido = archivo.read_bytes()
        if hashlib.sha256(contenido).hexdigest() != manifest[nombre]:
            raise ValueError('Integridad incorrecta: '+nombre)
        compile(contenido, nombre, 'exec')


def validar_importacion(origen, destino):
    prueba = '''
import sqlite3
import sys

def prohibir_sqlite(*args, **kwargs):
    raise RuntimeError('La validación no permite abrir bases de datos')

sqlite3.connect = prohibir_sqlite
sys.path[:0] = sys.argv[1:3]
import app
rutas = {r.rule for r in app.app.url_map.iter_rules()}
requeridas = {'/api/promociones', '/api/promociones/panel', '/api/eventos', '/api/eventos/opciones', '/api/auth/login', '/api/auth/google'}
assert requeridas.issubset(rutas), 'Faltan rutas en la aplicación importada'
app.app.config['TESTING'] = True
respuesta = app.app.test_client().options('/api/eventos/opciones')
assert respuesta.status_code == 200, 'Falló OPTIONS del API'
assert 'Authorization' in respuesta.headers.get('Access-Control-Allow-Headers', ''), 'Falta autorización en CORS'
print('OK: importación, rutas y CORS. No se abrió ninguna base SQLite.')
'''
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE='1')
    subprocess.run([sys.executable, '-c', prueba, str(origen), str(destino)], cwd=str(origen), env=env, check=True, timeout=60)


def aplicar(origen, destino):
    etiqueta = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+uuid.uuid4().hex[:8]
    respaldo = destino / 'respaldos_backend' / etiqueta
    for nombre in ARCHIVOS:
        archivo = destino / nombre
        if archivo.is_symlink() or (archivo.exists() and not archivo.is_file()):
            raise ValueError('Destino inválido: '+nombre)
    respaldo.mkdir(parents=True, exist_ok=False)
    existentes = set()
    for nombre in ARCHIVOS:
        archivo = destino / nombre
        if archivo.exists():
            shutil.copy2(archivo, respaldo / nombre)
            existentes.add(nombre)
    aplicados, temporales = [], []
    try:
        for nombre in [n for n in ARCHIVOS if n != 'app.py'] + ['app.py']:
            temporal = destino / ('.'+nombre+'.'+uuid.uuid4().hex+'.tmp')
            temporales.append(temporal)
            shutil.copy2(origen / nombre, temporal)
            os.replace(temporal, destino / nombre)
            aplicados.append(nombre)
    except Exception:
        errores = []
        for nombre in reversed(aplicados):
            try:
                if nombre in existentes:
                    temporal = destino / ('.restaurar-'+uuid.uuid4().hex+'.tmp')
                    temporales.append(temporal)
                    shutil.copy2(respaldo / nombre, temporal)
                    os.replace(temporal, destino / nombre)
                else:
                    (destino / nombre).unlink()
            except OSError:
                errores.append(nombre)
        if errores:
            raise RuntimeError('Restauración incompleta; recuperar desde '+str(respaldo)+': '+', '.join(errores))
        raise
    finally:
        for temporal in temporales:
            if temporal.exists():
                temporal.unlink()
    print('Código actualizado. Respaldo anterior: '+str(respaldo))
    print('Google: se incluye google_routes.py sin modificar su contenido aprobado.')
    print('No se copiaron ni reemplazaron SQLite, fotos, credenciales ni plugin Google, db.py ni WSGI.')
    print('Pendiente: Web > Reload en PythonAnywhere. Después volver a iniciar sesión en la app.')


def main():
    parser = argparse.ArgumentParser(description='Valida e instala únicamente el backend de promociones y eventos, sin abrir bases SQLite.')
    parser.add_argument('--destino', required=True, type=Path, help='Carpeta existente del proyecto Flask en PythonAnywhere')
    parser.add_argument('--aplicar', action='store_true', help='Respaldar y sustituir solo los archivos Python permitidos; sin esta opción solo valida')
    args = parser.parse_args()
    origen = Path(__file__).resolve().parent
    destino = args.destino.resolve()
    if origen == destino or not destino.is_dir() or not (destino / 'db.py').is_file():
        parser.error('Extraé el paquete en una carpeta aparte y elegí como destino el proyecto existente con db.py')
    validar_paquete(origen)
    validar_importacion(origen, destino)
    if args.aplicar:
        aplicar(origen, destino)
    else:
        print('Solo validación: no se sustituyó ningún archivo. Usá --aplicar únicamente para instalar el código respaldado.')


if __name__ == '__main__':
    main()
