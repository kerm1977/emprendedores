"""auth_routes.py - Autenticacion, CRUD de usuarios y acceso de emergencia."""
import bcrypt
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from db import get_db, ensure_db, user_dict, EMERGENCY_CODE

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/login", methods=["POST"])
def auth_login():
    ensure_db()
    body = request.get_json(force=True, silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    pwd = body.get("password") or ""
    row = get_db().execute(
        "SELECT * FROM usuarios WHERE email = ?", (email,)
    ).fetchone()
    if row is None or not bcrypt.checkpw(pwd.encode("utf-8"), row["pass_hash"].encode("utf-8")):
        return jsonify({"ok": False, "error": "Correo o contrasena incorrectos"}), 401
    return jsonify({"ok": True, "user": user_dict(row), "pass_hash": row["pass_hash"]})


@auth_bp.route("/api/auth/register", methods=["POST"])
def auth_register():
    ensure_db()
    body = request.get_json(force=True, silent=True) or {}
    nombre = (body.get("nombre") or "").strip()
    email = (body.get("email") or "").strip().lower()
    pwd = body.get("password") or ""
    if not nombre or not email or not pwd:
        return jsonify({"ok": False, "error": "Nombre, correo y contrasena son obligatorios"}), 400
    db = get_db()
    existe = db.execute("SELECT id FROM usuarios WHERE email = ?", (email,)).fetchone()
    if existe:
        return jsonify({"ok": False, "error": "Ese correo ya esta registrado"}), 409
    ahora = datetime.now(timezone.utc).isoformat()
    h = bcrypt.hashpw(pwd.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    cur = db.execute(
        """INSERT INTO usuarios
           (nombre, apellido, email, telefono, cedula, rol, pass_hash, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'user', ?, ?, ?)""",
        (nombre, body.get("apellido", "").strip(), email,
         body.get("telefono", "").strip(), body.get("cedula", "").strip(),
         h, ahora, ahora),
    )
    db.commit()
    row = db.execute("SELECT * FROM usuarios WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify({"ok": True, "user": user_dict(row)})


@auth_bp.route("/api/usuarios", methods=["GET"])
def list_usuarios():
    ensure_db()
    rows = get_db().execute(
        "SELECT * FROM usuarios ORDER BY rol = 'super' DESC, nombre"
    ).fetchall()
    return jsonify({"ok": True, "usuarios": [user_dict(r) for r in rows]})


@auth_bp.route("/api/usuarios/<int:uid>", methods=["PUT"])
def update_usuario(uid):
    ensure_db()
    body = request.get_json(force=True, silent=True) or {}
    db = get_db()
    row = db.execute("SELECT * FROM usuarios WHERE id = ?", (uid,)).fetchone()
    if row is None:
        return jsonify({"ok": False, "error": "Usuario no encontrado"}), 404
    ahora = datetime.now(timezone.utc).isoformat()
    db.execute(
        """UPDATE usuarios SET nombre=?, apellido=?, telefono=?, cedula=?, updated_at=?
           WHERE id=?""",
        (body.get("nombre", row["nombre"]), body.get("apellido", row["apellido"]),
         body.get("telefono", row["telefono"]), body.get("cedula", row["cedula"]),
         ahora, uid),
    )
    if body.get("password"):
        h = bcrypt.hashpw(body["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        db.execute("UPDATE usuarios SET pass_hash=? WHERE id=?", (h, uid))
    db.commit()
    row = db.execute("SELECT * FROM usuarios WHERE id = ?", (uid,)).fetchone()
    return jsonify({"ok": True, "user": user_dict(row)})


@auth_bp.route("/api/usuarios/<int:uid>", methods=["DELETE"])
def delete_usuario(uid):
    ensure_db()
    db = get_db()
    row = db.execute("SELECT rol FROM usuarios WHERE id = ?", (uid,)).fetchone()
    if row is None:
        return jsonify({"ok": False, "error": "Usuario no encontrado"}), 404
    if row["rol"] == "super":
        return jsonify({"ok": False, "error": "Los superusuarios solo se gestionan por emergencia"}), 403
    db.execute("DELETE FROM usuarios WHERE id = ?", (uid,))
    db.commit()
    return jsonify({"ok": True})


def _codigo_valido(body):
    return str(body.get("code") or "") == EMERGENCY_CODE


@auth_bp.route("/api/emergency/verify", methods=["POST"])
def emergency_verify():
    ensure_db()
    body = request.get_json(force=True, silent=True) or {}
    if not _codigo_valido(body):
        return jsonify({"ok": False, "error": "Codigo incorrecto"}), 403
    rows = get_db().execute(
        "SELECT id, nombre, email FROM usuarios WHERE rol = 'super'"
    ).fetchall()
    return jsonify({"ok": True, "superusers": [dict(r) for r in rows]})


@auth_bp.route("/api/emergency/reset", methods=["POST"])
def emergency_reset():
    ensure_db()
    body = request.get_json(force=True, silent=True) or {}
    if not _codigo_valido(body):
        return jsonify({"ok": False, "error": "Codigo incorrecto"}), 403
    email = (body.get("email") or "").strip().lower()
    pwd = body.get("password") or ""
    if not pwd:
        return jsonify({"ok": False, "error": "Nueva contrasena requerida"}), 400
    db = get_db()
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


@auth_bp.route("/api/emergency/delete", methods=["POST"])
def emergency_delete():
    ensure_db()
    body = request.get_json(force=True, silent=True) or {}
    if not _codigo_valido(body):
        return jsonify({"ok": False, "error": "Codigo incorrecto"}), 403
    email = (body.get("email") or "").strip().lower()
    db = get_db()
    row = db.execute(
        "SELECT id FROM usuarios WHERE email = ? AND rol = 'super'", (email,)
    ).fetchone()
    if row is None:
        return jsonify({"ok": False, "error": "Superusuario no encontrado"}), 404
    db.execute("DELETE FROM usuarios WHERE id = ?", (row["id"],))
    db.commit()
    return jsonify({"ok": True})
