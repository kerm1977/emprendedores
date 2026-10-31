"""escuchar_instrucciones.py - Listener de "Programar desde la nube".

Corre en la PC (programador de tareas cada X minutos). Revisa la cola
/api/instrucciones del servidor y, por cada instruccion pendiente,
arranca una sesion de Devin en la nube con ese texto como prompt.

Configurar en .env (o variables de entorno):
    INSTRUC_EMAIL   = correo de un superusuario
    INSTRUC_PASS    = su contrasena
    NUBE_API        = https://kenth1977.pythonanywhere.com (opcional)
    NUBE_INTERVALO  = 300  (segundos entre revisiones; 0 = una sola pasada)

Borrar este archivo elimina todo el flujo local del modulo de nube.
"""
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
API = os.environ.get("NUBE_API", "https://kenth1977.pythonanywhere.com")
KEY = os.environ.get("INSTRUC_KEY", "")
INTERVALO = int(os.environ.get("NUBE_INTERVALO", "1"))
PROMPT_EXTRA = (
    "\n\nContexto fijo: trabaja sobre el repositorio kerm1977/emprendedores "
    "Aplica la instruccion siguiendo AGENTS.md, verifica con "
    "herramientas/verificar_lineas.py, sube la version y publica el bundle "
    "con herramientas/publicar.py --bundle."
)

LOG = os.path.join(BASE, "nube-listener.log")
_DEVIN_LOCAL = os.path.join(
    os.environ.get("LOCALAPPDATA", ""), "Programs", "Devin", "resources",
    "app", "extensions", "windsurf", "devin", "bin", "devin.exe")
DEVIN = os.environ.get("DEVIN_EXE",
                       _DEVIN_LOCAL if os.path.exists(_DEVIN_LOCAL) else "devin")


def _log(msg):
    """Linea con hora al log del listener (y a stdout si hay consola)."""
    linea = time.strftime("[%Y-%m-%d %H:%M:%S] ") + str(msg)
    try:
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(linea + "\n")
    except Exception:
        pass
    print(linea)


def _env():
    """Carga pares CLAVE=valor del .env local sin mostrar secretos."""
    env = os.path.join(os.path.dirname(BASE), ".env")
    if os.path.exists(env):
        for linea in open(env, encoding="utf-8"):
            if "=" in linea and not linea.startswith("#"):
                k, v = linea.strip().split("=", 1)
                os.environ.setdefault(k, v)


def _peticion(ruta, datos=None, clave=""):
    cuerpo = json.dumps(datos).encode() if datos is not None else None
    req = urllib.request.Request(API + ruta, data=cuerpo,
                                 headers={"Content-Type": "application/json",
                                          "X-Nube-Key": clave},
                                 method="POST" if datos is not None else "GET")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def _tomar(clave):
    res = _peticion("/api/instrucciones/tomar", {}, clave)
    return res.get("instrucciones") or []


def _disparar(instruccion):
    texto = instruccion["texto"].strip()
    _log(f'Instruccion #{instruccion["id"]} tomada')
    # Un [ping] prueba el canal sin gastar sesion en la nube
    if texto.lower().startswith("[ping]"):
        _log("ping respondido")
        return
    # Disparo real: crea una sesion de Devin en la nube via API v1
    api_key = os.environ.get("DEVIN_API_KEY", "")
    if not api_key:
        _log("ERROR: falta DEVIN_API_KEY en .env")
        return
    try:
        body = json.dumps({"prompt": texto + PROMPT_EXTRA}).encode()
        req = urllib.request.Request(
            "https://api.devin.ai/v1/sessions", data=body,
            headers={"Authorization": "Bearer " + api_key,
                     "Content-Type": "application/json"}, method="POST")
        res = json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
        url = res.get('url') or ''
        _log(f"Sesion Devin creada: {url or res.get('session_id')}")
        # Reportar el enlace de vuelta: la app lo muestra en vivo
        try:
            body2 = json.dumps({"id": instruccion["id"], "url": url}).encode()
            req2 = urllib.request.Request(
                API + "/api/instrucciones/sesion", data=body2,
                headers={"Content-Type": "application/json",
                         "X-Nube-Key": os.environ.get("INSTRUC_KEY", "")},
                method="POST")
            urllib.request.urlopen(req2, timeout=30)
        except Exception as e2:
            _log(f"Aviso: no pude reportar la sesion: {e2}")
    except Exception as e:
        _log(f"ERROR API Devin: {e}")


def main():
    global KEY
    _env()
    KEY = os.environ.get("INSTRUC_KEY", "")
    print("Listener de instrucciones iniciado. API:", API)
    if not KEY:
        print("Falta INSTRUC_KEY en .env (general en la app: Programar desde la nube)")
        sys.exit(1)
    _log(f"Listener activo; devin={DEVIN}; intervalo={INTERVALO}s")
    while True:
        try:
            tomadas = _tomar(KEY)
            if tomadas:
                _log(f"Cola entrego {len(tomadas)} instruccion(es)")
            for ins in tomadas:
                _disparar(ins)
        except Exception as e:
            _log(f"Error de ciclo: {e}")
        if INTERVALO <= 0:
            break
        time.sleep(INTERVALO)


if __name__ == "__main__":
    main()
