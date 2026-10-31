"""instrucciones_routes.py - Cola de instrucciones para "Programar desde
la nube". Solo superusuarios: envian texto, el listener lo toma y lo
entrega a `devin --cloud`. Modulo aislado: borrar este archivo y su
registro en app.py elimina todo el flujo."""
import time
import secrets
from flask import Blueprint, jsonify, request
from db import get_users_db
from promo_auth import actor_promocion

instrucciones_bp = Blueprint("instrucciones", __name__)

TABLA = """
CREATE TABLE IF NOT EXISTS instrucciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    texto TEXT NOT NULL,
    autor TEXT DEFAULT '',
    estado TEXT DEFAULT 'pendiente',
    ts REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS nube_config (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
);
"""


def _conectar():
    db = get_users_db()
    db.executescript(TABLA)
    cols = [r[1] for r in db.execute("PRAGMA table_info(instrucciones)").fetchall()]
    if "sesion" not in cols:
        db.execute("ALTER TABLE instrucciones ADD COLUMN sesion TEXT DEFAULT ''")
        db.commit()
    return db


def _solo_super():
    actor = actor_promocion()
    return actor if actor is not None and actor["rol"] == "super" else None


@instrucciones_bp.route("/api/instrucciones", methods=["GET", "POST"])
def instrucciones():
    actor = _solo_super()
    if not actor:
        return jsonify({"error": "Solo superusuarios"}), 403
    db = _conectar()
    if request.method == "POST":
        texto = ((request.get_json(silent=True) or {}).get("texto") or "").strip()
        if not texto:
            return jsonify({"error": "Falta la instruccion"}), 400
        cur = db.execute(
            "INSERT INTO instrucciones (texto, autor, ts) VALUES (?,?,?)",
            (texto[:4000], actor["email"] or "", time.time()))
        db.commit()
        return jsonify({"ok": True, "id": cur.lastrowid})
    rows = db.execute(
        "SELECT id, texto, autor, estado, ts, sesion FROM instrucciones ORDER BY id DESC LIMIT 50"
    ).fetchall()
    return jsonify({"ok": True, "instrucciones": [dict(r) for r in rows]})


@instrucciones_bp.route("/api/instrucciones/clave", methods=["POST", "GET"])
def clave():
    """El super genera (o lee) la clave que el listener usa en vez de sesion."""
    actor = _solo_super()
    if not actor:
        return jsonify({"error": "Solo superusuarios"}), 403
    db = _conectar()
    row = db.execute("SELECT valor FROM nube_config WHERE clave='listener_key'").fetchone()
    if request.method == "POST" or not row:
        valor = secrets.token_urlsafe(24)
        db.execute("INSERT OR REPLACE INTO nube_config VALUES ('listener_key', ?)", (valor,))
        db.commit()
        return jsonify({"ok": True, "clave": valor})
    return jsonify({"ok": True, "clave": row["valor"]})


@instrucciones_bp.route("/api/instrucciones/tomar", methods=["POST"])
def tomar():
    """El listener local consume la cola: sesion super o clave del listener."""
    db = _conectar()
    actor = actor_promocion(False)
    autorizado = actor is not None and actor["rol"] == "super"
    if not autorizado:
        enviada = request.headers.get("X-Nube-Key", "")
        row = db.execute("SELECT valor FROM nube_config WHERE clave='listener_key'").fetchone()
        autorizado = bool(row) and enviada == row["valor"]
    if not autorizado:
        return jsonify({"error": "Sin autorizacion"}), 403
    db = _conectar()
    rows = db.execute(
        "SELECT id, texto, autor, ts FROM instrucciones WHERE estado='pendiente' ORDER BY id"
    ).fetchall()
    for r in rows:
        db.execute("UPDATE instrucciones SET estado='tomada' WHERE id=?", (r["id"],))
    db.commit()
    return jsonify({"ok": True, "instrucciones": [dict(r) for r in rows]})


@instrucciones_bp.route("/api/instrucciones/sesion", methods=["POST"])
def sesion():
    """El listener reporta la URL de la sesion creada; la app la enlaza."""
    db = _conectar()
    actor = actor_promocion(False)
    autorizado = actor is not None and actor["rol"] == "super"
    if not autorizado:
        enviada = request.headers.get("X-Nube-Key", "")
        row = db.execute("SELECT valor FROM nube_config WHERE clave='listener_key'").fetchone()
        autorizado = bool(row) and enviada == row["valor"]
    if not autorizado:
        return jsonify({"error": "Sin autorizacion"}), 403
    body = request.get_json(silent=True) or {}
    db.execute("UPDATE instrucciones SET sesion=? WHERE id=?",
               ((body.get("url") or "")[:500], int(body.get("id") or 0)))
    db.commit()
    return jsonify({"ok": True})
