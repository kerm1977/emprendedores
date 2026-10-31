"""uploads_routes.py - Recepcion de imagenes (logos) en /uploads/.
Acepta base64, valida mime real y limite ~500KB (comprimido cliente)."""
import base64
import os
import re
from flask import Blueprint, jsonify, request, send_from_directory

uploads_bp = Blueprint("uploads", __name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
MIMES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
# Orden del usuario: imagenes comprimidas en el cliente a max 50 KB;
# el servidor rechaza cualquier carga por encima del tope
MAX_BYTES = 55 * 1024


@uploads_bp.route("/api/uploads", methods=["POST"])
def subir():
    p = request.get_json(force=True, silent=True) or {}
    data = str(p.get("data") or "")
    emp_id = re.sub(r"[^a-zA-Z0-9_-]", "", str(p.get("id") or "logo"))[:40]
    m = re.match(r"data:(image/\w+);base64,(.+)", data)
    if not m or m.group(1) not in MIMES:
        return jsonify({"error": "imagen invalida"}), 400
    try:
        raw = base64.b64decode(m.group(2), validate=True)
    except ValueError:
        return jsonify({"error": "imagen invalida"}), 400
    if len(raw) > MAX_BYTES:
        return jsonify({"error": "imagen muy pesada"}), 413
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    # Un solo archivo por id: al subir uno nuevo se borran las otras
    # extensiones del mismo id para no saturar uploads/ en el servidor
    for ext in MIMES.values():
        if ext == MIMES[m.group(1)]:
            continue
        viejo = os.path.join(UPLOAD_DIR, emp_id + ext)
        if os.path.exists(viejo):
            os.remove(viejo)
    nombre = emp_id + MIMES[m.group(1)]
    with open(os.path.join(UPLOAD_DIR, nombre), "wb") as f:
        f.write(raw)
    return jsonify({"ok": True, "url": "/uploads/" + nombre})


@uploads_bp.route("/api/uploads/eliminar", methods=["POST"])
def eliminar():
    """Borra todas las imagenes asociadas a un id (quitar logo/foto)."""
    p = request.get_json(force=True, silent=True) or {}
    emp_id = re.sub(r"[^a-zA-Z0-9_-]", "", str(p.get("id") or ""))[:40]
    if not emp_id:
        return jsonify({"error": "id invalido"}), 400
    borrados = 0
    for ext in MIMES.values():
        ruta = os.path.join(UPLOAD_DIR, emp_id + ext)
        if os.path.exists(ruta):
            os.remove(ruta)
            borrados += 1
    return jsonify({"ok": True, "borrados": borrados})


@uploads_bp.route("/uploads/<nombre>")
def servir(nombre):
    return send_from_directory(UPLOAD_DIR, nombre)
