"""emergency_routes.py - Acceso de emergencia para superusuarios."""
import bcrypt
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from db import get_users_db, ensure_db, EMERGENCY_CODE

emerg_bp = Blueprint("emerg", __name__)

def _codigo_valido(body):
    return str(body.get("code") or "") == EMERGENCY_CODE


@emerg_bp.route("/api/emergency/verify", methods=["POST"])
def emergency_verify():
    ensure_db()
    body = request.get_json(force=True, silent=True) or {}
    if not _codigo_valido(body):
        return jsonify({"ok": False, "error": "Codigo incorrecto"}), 403
    rows = get_users_db().execute(
        "SELECT id, nombre, email FROM usuarios WHERE rol = 'super'"
    ).fetchall()
    return jsonify({"ok": True, "superusers": [dict(r) for r in rows]})


@emerg_bp.route("/api/emergency/reset", methods=["POST"])
def emergency_reset():
    ensure_db()
    body = request.get_json(force=True, silent=True) or {}
    if not _codigo_valido(body):
        return jsonify({"ok": False, "error": "Codigo incorrecto"}), 403
    email = (body.get("email") or "").strip().lower()
    pwd = body.get("password") or ""
    if not pwd:
        return jsonify({"ok": False, "error": "Nueva contrasena requerida"}), 400
    db = get_users_db()
    row = db.execute(
        "SELECT id FROM usuarios WHERE email = ? AND rol = 'super'", (email,)
    ).fetchone()
    if row is None:
        return jsonify({"ok": False, "error": "Superusuario no encontrado"}), 404
    h = bcrypt.hashpw(pwd.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    db.execute(
        "UPDATE usuarios SET pass_hash = ?, updated_at = ? WHERE id = ?",
        (h, datetime.now(timezone.utc).isoformat(), row["id"]),
    )
    db.commit()
    return jsonify({"ok": True})


@emerg_bp.route("/api/emergency/delete", methods=["POST"])
def emergency_delete():
    ensure_db()
    body = request.get_json(force=True, silent=True) or {}
    if not _codigo_valido(body):
        return jsonify({"ok": False, "error": "Codigo incorrecto"}), 403
    email = (body.get("email") or "").strip().lower()
    db = get_users_db()
    row = db.execute(
        "SELECT id FROM usuarios WHERE email = ? AND rol = 'super'", (email,)
    ).fetchone()
    if row is None:
        return jsonify({"ok": False, "error": "Superusuario no encontrado"}), 404
    db.execute("DELETE FROM usuarios WHERE id = ?", (row["id"],))
    db.commit()
    return jsonify({"ok": True})
