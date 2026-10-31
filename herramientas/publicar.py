"""publicar.py - Despliegue automático a PythonAnywhere mediante su API oficial.

Uso:
  PA_API_TOKEN=xxx python herramientas/publicar.py --all --version 123
  python herramientas/publicar.py --backend          solo archivos Python
  python herramientas/publicar.py --bundle           solo bundle www OTA
  python herramientas/publicar.py --apk ruta.apk     además publica el APK

El token se lee de PA_API_TOKEN o del archivo .env (NUNCA se guarda en el repo).
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import urllib.request
import urllib.error
import uuid
import zipfile

USUARIO = 'kenth1977'
HOST = 'www.pythonanywhere.com'
DOMINIO_APP = 'kenth1977.pythonanywhere.com'
RAIZ_REMOTA = f'/home/{USUARIO}/syncapp'
BACKEND = ('app.py', 'auth_routes.py', 'google_routes.py', 'uploads_routes.py', 'promo_auth.py', 'promociones_store.py', 'promociones_manual.py', 'promociones_cobro.py', 'eventos_store.py', 'eventos_routes.py', 'eventos_legacy.py', 'actualizacion_routes.py', 'instrucciones_routes.py', 'embeds_routes.py')


def token():
    t = os.environ.get('PA_API_TOKEN', '').strip()
    if not t:
        env = Path(__file__).resolve().parents[1] / '.env'
        if env.is_file():
            for linea in env.read_text(encoding='utf-8').splitlines():
                if linea.startswith('PA_API_TOKEN='):
                    t = linea.split('=', 1)[1].strip()
    if not t:
        sys.exit('Falta PA_API_TOKEN: definilo como variable de entorno o en el archivo .env (Account > API token en PythonAnywhere).')
    return t


def api_post(ruta, contenido=None, json_body=None):
    url = f'https://{HOST}/api/v0/user/{USUARIO}{ruta}'
    cab = {'Authorization': 'Token ' + token()}
    if json_body is not None:
        data, cab['Content-Type'] = json.dumps(json_body).encode(), 'application/json'
    elif contenido is not None:
        borde = uuid.uuid4().hex
        data = (f'--{borde}\r\nContent-Disposition: form-data; name="content"; filename="archivo"\r\n\r\n'.encode() + contenido + f'\r\n--{borde}--\r\n'.encode())
        cab['Content-Type'] = f'multipart/form-data; boundary={borde}'
    else:
        data = b''
    req = urllib.request.Request(url, data=data, headers=cab, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'API {e.code} en {ruta}: {e.read()[:300]}')


def subir_archivo(remoto, contenido):
    status, _ = api_post(f'/files/path{RAIZ_REMOTA}/{remoto}', contenido=contenido)
    if status not in (200, 201):
        raise RuntimeError(f'Falló la subida de {remoto}: HTTP {status}')
    print(f'  subido {remoto} ({len(contenido)} bytes)')


def publicar_backend(root):
    print('Backend:')
    for nombre in BACKEND:
        subir_archivo(nombre, (root / nombre).read_bytes())


def publicar_bundle(root, version, apk, publico):
    print(f'Bundle web v{version}:')
    import io
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        for archivo in sorted((root / 'www').rglob('*')):
            if archivo.is_file() and 'node_modules' not in archivo.parts:
                z.write(archivo, archivo.relative_to(root / 'www'))
    datos = buf.getvalue()
    sha = hashlib.sha256(datos).hexdigest()
    subir_archivo(f'descargas/www-v{version}.zip', datos)
    notas = root / 'notas-version.txt'
    cambios = [l.strip() for l in notas.read_text(encoding='utf-8').splitlines() if l.strip()][:20] if notas.is_file() else []
    nombre = str(json.loads((root / 'www' / 'version.json').read_text(encoding='utf-8')).get('nombre', version))
    manifiesto = {'version': str(version), 'nombre': nombre, 'url': f'https://{DOMINIO_APP}/descargas/www-v{version}.zip', 'checksum': sha, 'cambios': cambios, 'bytes': len(datos)}
    if apk:
        ruta = Path(apk)
        subir_archivo('descargas/' + ruta.name, ruta.read_bytes())
        manifiesto['apk'] = f'https://{DOMINIO_APP}/descargas/{ruta.name}'
    else:
        manifiesto['apk'] = ''
    subir_archivo('descargas/beta.json', json.dumps(manifiesto).encode())
    if publico:
        subir_archivo('descargas/version.json', json.dumps(manifiesto).encode())
        print('  promovida AL PÚBLICO de inmediato')
    else:
        print('  queda como PRUEBA: solo la ve el superusuario hasta publicarla')


def recargar():
    status, cuerpo = api_post(f'/webapps/{DOMINIO_APP}/reload/')
    if status != 200:
        raise RuntimeError(f'Reload falló: HTTP {status} {cuerpo[:200]}')
    print('Webapp recargada. Listo: https://' + DOMINIO_APP)


def main():
    p = argparse.ArgumentParser(description='Publica backend y/o bundle OTA en PythonAnywhere.')
    p.add_argument('--backend', action='store_true')
    p.add_argument('--bundle', action='store_true')
    p.add_argument('--version', default='')
    p.add_argument('--apk', default='')
    p.add_argument('--publico', action='store_true', help='Publica el bundle al mundo de inmediato (salta la etapa de prueba del super)')
    p.add_argument('--sin-reload', action='store_true')
    args = p.parse_args()
    root = Path(__file__).resolve().parents[1]
    todo = not (args.backend or args.bundle or args.apk)
    if args.backend or todo:
        publicar_backend(root)
    if args.bundle or todo:
        version = args.version or json.loads((root / 'www' / 'version.json').read_text())['version']
        publicar_bundle(root, version, args.apk or None, args.publico)
    elif args.apk:
        ruta = Path(args.apk)
        subir_archivo('descargas/' + ruta.name, ruta.read_bytes())
    if not args.sin_reload:
        recargar()


if __name__ == '__main__':
    main()
