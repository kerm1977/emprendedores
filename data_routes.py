"""data_routes.py - Endpoints de datos generales (Flask = conectividad)."""
import os
import json
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from db import get_db, ensure_db, DB_PATH

data_bp = Blueprint("data", __name__)


@data_bp.route("/api/data", methods=["GET"])
def get_data():
    ensure_db()
    db = get_db()
    row = db.execute("SELECT json FROM app_data WHERE id = 1").fetchone()
    if row is None:
        return jsonify({})
    return jsonify(json.loads(row["json"]))


@data_bp.route("/api/data", methods=["POST"])
def post_data():
    ensure_db()
    payload = request.get_json(force=True, silent=True) or {}
    db = get_db()
    db.execute(
        "INSERT OR REPLACE INTO app_data (id, json, updated_at) VALUES (1, ?, ?)",
        (json.dumps(payload), datetime.now(timezone.utc).isoformat()),
    )
    db.commit()
    return jsonify({"ok": True, "saved_at": datetime.now(timezone.utc).isoformat()})


@data_bp.route("/api/import", methods=["POST"])
def import_json():
    """Acepta un respaldo completo y lo guarda en SQLite."""
    ensure_db()
    payload = request.get_json(force=True, silent=True) or {}
    if not isinstance(payload.get("caminatas"), list) and not isinstance(payload.get("emprendimientos"), list):
        return jsonify({"ok": False, "error": "Formato invalido"}), 400
    db = get_db()
    db.execute(
        "INSERT OR REPLACE INTO app_data (id, json, updated_at) VALUES (1, ?, ?)",
        (json.dumps(payload), datetime.now(timezone.utc).isoformat()),
    )
    db.execute(
        "INSERT INTO sync_log (action, happened_at) VALUES (?, ?)",
        ("import", datetime.now(timezone.utc).isoformat()),
    )
    db.commit()
    return jsonify({"ok": True, "records": len(payload.get("emprendimientos", payload.get("caminatas", [])))})


@data_bp.route("/api/dbinfo")
def db_info():
    ensure_db()
    db = get_db()

    tables = [r[0] for r in db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    )]

    size = 0
    try:
        size = os.path.getsize(DB_PATH)
    except OSError:
        pass

    counts = {}
    row = db.execute("SELECT json FROM app_data WHERE id = 1").fetchone()
    if row and row["json"]:
        data = json.loads(row["json"])
        counts = {
            "emprendimientos": len(data.get("emprendimientos", [])),
            "emprendedores": len(data.get("emprendedores", [])),
            "notas": len(data.get("notas", [])),
        }

    usuarios = db.execute("SELECT COUNT(*) FROM usuarios").fetchone()[0]
    counts["usuarios"] = usuarios

    return jsonify({
        "db_name": os.path.basename(DB_PATH),
        "db_path": DB_PATH,
        "db_dir": os.path.dirname(DB_PATH),
        "size": f"{size / 1024:.1f} KB" if size else "0 KB",
        "tables": tables,
        "counts": counts,
    })


@data_bp.route("/api/deploy-config", methods=["GET"])
def get_deploy_config():
    ensure_db()
    db = get_db()
    row = db.execute("SELECT * FROM deploy_config WHERE id = 1").fetchone()
    if row is None:
        return jsonify({})
    return jsonify({
        "pa_db_path": row["pa_db_path"],
        "pa_project_dir": row["pa_project_dir"],
        "pa_username": row["pa_username"],
        "pa_domain": row["pa_domain"],
        "pa_dns": row["pa_dns"],
        "pa_wsgi_path": row["pa_wsgi_path"],
        "pa_python_version": row["pa_python_version"],
        "notes": row["notes"],
        "updated_at": row["updated_at"],
    })


@data_bp.route("/api/deploy-config", methods=["POST"])
def post_deploy_config():
    ensure_db()
    cfg = request.get_json(force=True, silent=True) or {}
    db = get_db()
    db.execute(
        """INSERT OR REPLACE INTO deploy_config
           (id, pa_db_path, pa_project_dir, pa_username, pa_domain, pa_dns,
            pa_wsgi_path, pa_python_version, notes, updated_at)
           VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            cfg.get("pa_db_path", ""),
            cfg.get("pa_project_dir", ""),
            cfg.get("pa_username", ""),
            cfg.get("pa_domain", ""),
            cfg.get("pa_dns", ""),
            cfg.get("pa_wsgi_path", ""),
            cfg.get("pa_python_version", ""),
            cfg.get("notes", ""),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    db.commit()
    return jsonify({"ok": True})


@data_bp.route("/api/github-config", methods=["GET"])
def get_github_config():
    ensure_db()
    db = get_db()
    row = db.execute("SELECT * FROM github_config WHERE id = 1").fetchone()
    if row is None:
        return jsonify({})
    return jsonify({
        "repo_name": row["repo_name"],
        "repo_url": row["repo_url"],
        "remote_origin": row["remote_origin"],
        "branch": row["branch"],
        "username": row["username"],
        "token": row["token"],
        "instructions": row["instructions"],
        "updated_at": row["updated_at"],
    })


@data_bp.route("/api/github-config", methods=["POST"])
def post_github_config():
    ensure_db()
    cfg = request.get_json(force=True, silent=True) or {}
    db = get_db()
    db.execute(
        """INSERT OR REPLACE INTO github_config
           (id, repo_name, repo_url, remote_origin, branch, username, token,
            instructions, updated_at)
           VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            cfg.get("repo_name", ""),
            cfg.get("repo_url", ""),
            cfg.get("remote_origin", ""),
            cfg.get("branch", ""),
            cfg.get("username", ""),
            cfg.get("token", ""),
            cfg.get("instructions", ""),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    db.commit()
    return jsonify({"ok": True})
