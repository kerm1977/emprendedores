"""db.py - Conexion SQLite, esquema, seed de superusuarios y helpers."""
import os
import sqlite3
import bcrypt
from datetime import datetime, timezone
from flask import g

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "tribu.sqlite")
DB_PATH = os.environ.get("DATABASE_PATH", DEFAULT_DB_PATH)
EMERGENCY_CODE = os.environ.get("EMERGENCY_CODE", "161177")

SUPERUSERS = [
    ("Kenth", "", "kenth1977@gmail.com", "CR129x7848n"),
    ("LT Hiking", "", "lthikingcr@gmail.com", "LaTribu1977"),
    ("J Ceciliano", "", "jceciliano69@gmail.com", "Ceciliano69"),
]


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    with sqlite3.connect(DB_PATH) as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS app_data (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS sync_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                happened_at TEXT NOT NULL
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS deploy_config (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                pa_db_path TEXT,
                pa_project_dir TEXT,
                pa_username TEXT,
                pa_domain TEXT,
                pa_dns TEXT,
                pa_wsgi_path TEXT,
                pa_python_version TEXT,
                notes TEXT,
                updated_at TEXT NOT NULL
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS github_config (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                repo_name TEXT,
                repo_url TEXT,
                remote_origin TEXT,
                branch TEXT,
                username TEXT,
                token TEXT,
                instructions TEXT,
                updated_at TEXT NOT NULL
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                apellido TEXT DEFAULT '',
                email TEXT NOT NULL UNIQUE,
                telefono TEXT DEFAULT '',
                cedula TEXT DEFAULT '',
                rol TEXT NOT NULL DEFAULT 'user',
                pass_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        seed_superusers(db)


def seed_superusers(db):
    count = db.execute(
        "SELECT COUNT(*) FROM usuarios WHERE rol = 'super'"
    ).fetchone()[0]
    if count:
        return
    ahora = datetime.now(timezone.utc).isoformat()
    for nombre, apellido, email, pwd in SUPERUSERS:
        h = bcrypt.hashpw(pwd.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        db.execute(
            """INSERT INTO usuarios
               (nombre, apellido, email, rol, pass_hash, created_at, updated_at)
               VALUES (?, ?, ?, 'super', ?, ?, ?)""",
            (nombre, apellido, email, h, ahora, ahora),
        )
    db.commit()


def ensure_db():
    init_db()


def user_dict(row):
    return {
        "id": row["id"],
        "nombre": row["nombre"],
        "apellido": row["apellido"],
        "email": row["email"],
        "telefono": row["telefono"],
        "cedula": row["cedula"],
        "rol": row["rol"],
    }
