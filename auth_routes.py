"""auth_routes.py - Autenticacion, CRUD de usuarios y acceso de emergencia."""
import bcrypt
import json
import re
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from db import get_db, ensure_db, user_dict, EMERGENCY_CODE

auth_bp = Blueprint("auth", __name__)


def _digitos(s):
    return re.sub(r"\D", "", s or "")


def _tel_local(s):
    """Ultimos 8 digitos (numero local CR, ignora el +506)."""
    return _digitos(s)[-8:]


def _vincular_emprendimientos(db, email, cedula, tel):
    """Antiduplicidad: los emprendimientos del telefono/cedula/email
    pasan a pertenecer a esta misma persona (merge, no overwrite)."""
    row = db.execute("SELECT json FROM app_data WHERE id = 1").fetchone()
    if not row:
        return
    try:
        datos = json.loads(row["json"])
    except Exception:
        return
    emps = datos.get("emprendimientos") or []
    cambio = False
    for emp in emps:
        match = False
        if tel:
            for campo in ("telefono", "whatsapp", "telefono2"):
                if _tel_local(emp.get(campo)) == tel:
                    match = True
        if not match and email and (emp.get("email") or "").lower() == email:
            match = True
        if not match and cedula and emp.get("cedula") == cedula:
            match = True
        if match and emp.get("owner") != email:
            emp["owner"] = email
            cambio = True
    if cambio:
        db.execute(
            "UPDATE app_data SET json = ?, updated_at = ? WHERE id = 1",
            (json.dumps(datos, ensure_ascii=False),
             datetime.now(timezone.utc).isoformat()),
        )
        db.commit()


def _merge_usuario(db, dup, body, pwd):
    """Antiduplicidad: nunca duplica; rellena lo que falte del mismo
    usuario (cedula/email son irrepetibles) y le da acceso con la
    contrasena nueva."""
    ahora = datetime.now(timezone.utc).isoformat()
    nombre = body.get("nombre", "").strip()
    apellido = body.get("apellido", "").strip()
    telefono = body.get("telefono", "").strip()
    cedula = body.get("cedula", "").strip()
    db.execute(
        """UPDATE usuarios SET
           nombre = CASE WHEN nombre = '' THEN ? ELSE nombre END,
           apellido = CASE WHEN apellido = '' THEN ? ELSE apellido END,
           telefono = CASE WHEN telefono = '' THEN ? ELSE telefono END,
           cedula = CASE WHEN cedula = '' THEN ? ELSE cedula END,
           pass_hash = ?, updated_at = ?
           WHERE id = ?""",
        (nombre, apellido, telefono, cedula,
         bcrypt.hashpw(pwd.encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
         ahora, dup["id"]),
    )
    db.commit()
    return db.execute("SELECT * FROM usuarios WHERE id = ?", (dup["id"],)).fetchone()


@auth_bp.route("/api/auth/login", methods=["POST"])


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
    cedula = (body.get("cedula") or "").strip()
    telefono = (body.get("telefono") or "").strip()
    tel = _tel_local(telefono)

    # ANTIDUPLICIDAD: busca la misma persona por email, cedula o telefono
    dup = None
    row_email = db.execute(
        "SELECT * FROM usuarios WHERE email = ?", (email,)
    ).fetchone()
    if row_email:
        ced_match = cedula and row_email["cedula"] == cedula
        tel_match = tel and _tel_local(row_email["telefono"]) == tel
        vacio = not row_email["cedula"] and not row_email["telefono"]
        if ced_match or tel_match or vacio:
            dup = row_email  # misma persona -> merge
        else:
            return jsonify(
                {"ok": False, "error": "Ese correo ya esta registrado"}
            ), 409
    if not dup and cedula:
        dup = db.execute(
            "SELECT * FROM usuarios WHERE cedula != '' AND cedula = ?",
            (cedula,)
        ).fetchone()
    if not dup and tel:
        for cand in db.execute(
            "SELECT * FROM usuarios WHERE telefono != ''"
        ).fetchall():
            if _tel_local(cand["telefono"]) == tel:
                dup = cand
                break
    if dup:
        row = _merge_usuario(db, dup, body, pwd)
        _vincular_emprendimientos(db, dup["email"], cedula, tel)
        return jsonify({"ok": True, "user": user_dict(row), "merged": True})

    ahora = datetime.now(timezone.utc).isoformat()
    h = bcrypt.hashpw(pwd.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    cur = db.execute(
        """INSERT INTO usuarios
           (nombre, apellido, email, telefono, cedula, rol, pass_hash, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'user', ?, ?, ?)""",
        (nombre, body.get("apellido", "").strip(), email,
         telefono, cedula, h, ahora, ahora),
    )
    db.commit()
    _vincular_emprendimientos(db, email, cedula, tel)
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
