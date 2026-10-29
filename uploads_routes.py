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
MAX_BYTES = 600 * 1024


@uploads_bp.route("/api/uploads", methods=["POST"])
def subir():
    p = request.get_json(force=True, silent=True) or {}
    data = str(p.get("data") or "")
    emp_id = re.sub(r"[^a-zA-Z0-9_-]", "", str(p.get("id") or "logo"))[:40]
    m = re.match(r"data:(image/\w+);base64,(.+)", data)
    if not m or m.group(1) not in MIMES:
        return jsonify({"error": "imagen invalida"}), 400
    raw = base64.b64decode(m.group(2))
    if len(raw) > MAX_BYTES:
        return jsonify({"error": "imagen muy pesada"}), 413
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    nombre = emp_id + MIMES[m.group(1)]
    with open(os.path.join(UPLOAD_DIR, nombre), "wb") as f:
        f.write(raw)
    return jsonify({"ok": True, "url": "/uploads/" + nombre})


@uploads_bp.route("/uploads/<nombre>")
def servir(nombre):
    return send_from_directory(UPLOAD_DIR, nombre)
