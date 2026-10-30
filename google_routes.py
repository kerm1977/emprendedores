"""BLINDADO: /api/auth/google verificado funcionando. No tocar.

google_routes.py - Login/registro con Google OAuth.
Verifica el idToken contra Google y aplica antiduplicidad
(merge por email) con las bases dedicadas."""
import urllib.request
import json as j2
from datetime import datetime, timezone

import bcrypt
from flask import Blueprint, jsonify, request

from db import get_users_db, ensure_db, user_dict

google_bp = Blueprint("google_auth", __name__)

@google_bp.route("/api/auth/google", methods=["POST"])
def google_auth():
    """Login/registro con Google: verifica idToken contra Google y
    luego aplica el sistema de antiduplicidad (merge por email)."""
    ensure_db()
    body = request.get_json(force=True, silent=True) or {}
    token = str(body.get("idToken") or "")
    if not token:
        return jsonify({"error": "token faltante"}), 400
    # Verificacion del idToken contra Google (tokeninfo)
    try:
        import urllib.request, json as j2
        url = ("https://oauth2.googleapis.com/tokeninfo?id_token=" + token)
        info = j2.loads(urllib.request.urlopen(url, timeout=8).read())
    except Exception:
        return jsonify({"error": "token Google invalido"}), 401
    email = (info.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "sin email de Google"}), 400
    nombre = info.get("given_name") or info.get("name") or email.split("@")[0]
    apellido = info.get("family_name") or ""
    foto = info.get("picture") or ""
    db = get_users_db()
    dup = db.execute("SELECT * FROM usuarios WHERE email = ?",
                     (email,)).fetchone()
    ahora = datetime.now(timezone.utc).isoformat()
    if dup:
        # Antiduplicidad: misma cuenta; refresca foto de Google
        try:
            db.execute("UPDATE usuarios SET foto = ? WHERE id = ?",
                       (foto, dup["id"]))
            db.commit()
            return jsonify({"ok": True, "linked": True,
                            "user": user_dict(db.execute(
                                "SELECT * FROM usuarios WHERE id = ?",
                                (dup["id"],)).fetchone())})
        except Exception:
            return jsonify({"ok": True, "linked": True,
                            "user": user_dict(dup)})
    h = bcrypt.hashpw(("google-" + token[:24]).encode("utf-8"),
                      bcrypt.gensalt()).decode("utf-8")
    cur = db.execute(
        """INSERT INTO usuarios
           (nombre, apellido, email, telefono, cedula, rol,
            pass_hash, created_at, updated_at)
           VALUES (?, ?, ?, '', '', 'user', ?, ?, ?)""",
        (nombre, apellido, email, h, ahora, ahora),
    )
    db.commit()
    row = db.execute("SELECT * FROM usuarios WHERE id = ?",
                     (cur.lastrowid,)).fetchone()
    return jsonify({"ok": True, "user": user_dict(row)})
