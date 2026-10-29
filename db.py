"""db.py - Bases de datos dedicadas SQLite con rendimiento tipo MySQL.

   - tribu.sqlite        : sistema (app_data, sync_log, configs)
   - usuarios.sqlite     : solo usuarios (indexada: email/cedula/telefono)
   - emprendimientos.sqlite : solo emprendimientos (indexada por
     nombre, categoria, owner y telefono)

   Rendimiento: WAL + synchronous NORMAL + foreign_keys, asi las
   lecturas/escrituras concurrentes no se bloquean (simil a MySQL).
"""
import os
import sqlite3
import bcrypt
from datetime import datetime, timezone
from flask import g

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(BASE_DIR, "tribu.sqlite"))
USERS_DB_PATH = os.environ.get(
    "USERS_DB_PATH", os.path.join(BASE_DIR, "usuarios.sqlite"))
EMPR_DB_PATH = os.environ.get(
    "EMPR_DB_PATH", os.path.join(BASE_DIR, "emprendimientos.sqlite"))
EMERGENCY_CODE = os.environ.get("EMERGENCY_CODE", "161177")

SUPERUSERS = [
    ("Kenth", "", "kenth1977@gmail.com", "CR129x7848n"),
    ("LT Hiking", "", "lthikingcr@gmail.com", "LaTribu1977"),
    ("J Ceciliano", "", "jceciliano69@gmail.com", "Ceciliano69"),
]


def _conectar(path):
    """Conexion SQLite maxima seguridad + velocidad (detalle en TECNOLOGIAS.md)."""
    db = sqlite3.connect(path, check_same_thread=False)
    db.row_factory = sqlite3.Row
    # -- Velocidad / concurrencia --
    db.execute("PRAGMA journal_mode=WAL")      # lecturas y escrituras a la par
    db.execute("PRAGMA synchronous=NORMAL")    # fsync menos agresivo, igual seguro en WAL
    db.execute("PRAGMA cache_size=-64000")     # 64 MB de cache en RAM
    db.execute("PRAGMA temp_store=MEMORY")     # temporales en memoria
    db.execute("PRAGMA mmap_size=268435456")   # 256 MB mmap: lecturas directas
    db.execute("PRAGMA busy_timeout=5000")     # espera 5s ante bloqueos, no error
    # -- Seguridad / consistencia --
    db.execute("PRAGMA foreign_keys=ON")       # integridad referencial real
    db.execute("PRAGMA trusted_schema=OFF")    # cierra vectores de inyeccion por esquema
    db.execute("PRAGMA secure_delete=ON")      # borrado real de datos eliminados
    return db


def get_db():
    """Conexion a la base de sistema (tribu.sqlite)."""
    if "db_sistema" not in g:
        g.db_sistema = _conectar(DB_PATH)
    return g.db_sistema


def get_users_db():
    """Conexion a usuarios.sqlite (base dedicada e indexada)."""
    if "db_usuarios" not in g:
        g.db_usuarios = _conectar(USERS_DB_PATH)
    return g.db_usuarios


def get_empr_db():
    """Conexion a emprendimientos.sqlite (base dedicada e indexada)."""
    if "db_empr" not in g:
        g.db_empr = _conectar(EMPR_DB_PATH)
    return g.db_empr


def close_db(exception):
    for k in ("db_sistema", "db_usuarios", "db_empr"):
        db = g.pop(k, None)
        if db is not None:
            db.close()


def init_db():
    """Crea las tres bases y sus tablas/indexes si no existen."""
    with sqlite3.connect(DB_PATH) as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS app_data (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )""")
        db.execute("""
            CREATE TABLE IF NOT EXISTS sync_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                happened_at TEXT NOT NULL
            )""")
        db.execute("""
            CREATE TABLE IF NOT EXISTS deploy_config (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                pa_db_path TEXT, pa_project_dir TEXT, pa_username TEXT,
                pa_domain TEXT, pa_dns TEXT, pa_wsgi_path TEXT,
                pa_python_version TEXT, notes TEXT, updated_at TEXT NOT NULL
            )""")
        db.execute("""
            CREATE TABLE IF NOT EXISTS github_config (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                repo_name TEXT, repo_url TEXT, remote_origin TEXT,
                branch TEXT, username TEXT, token TEXT,
                instructions TEXT, updated_at TEXT NOT NULL
            )""")

    with sqlite3.connect(USERS_DB_PATH) as db:
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
            )""")
        db.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_u_email ON usuarios(email)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_u_cedula ON usuarios(cedula)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_u_telefono ON usuarios(telefono)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_u_rol ON usuarios(rol)")
        db.execute("PRAGMA journal_mode=WAL")
        seed_superusers(db)

    with sqlite3.connect(EMPR_DB_PATH) as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS emprendimientos (
                emp_id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL,
                categoria TEXT DEFAULT '',
                contacto TEXT DEFAULT '',
                telefono TEXT DEFAULT '',
                whatsapp TEXT DEFAULT '',
                email TEXT DEFAULT '',
                provincia TEXT DEFAULT '',
                canton TEXT DEFAULT '',
                distrito TEXT DEFAULT '',
                lat TEXT DEFAULT '',
                lng TEXT DEFAULT '',
                estado TEXT DEFAULT 'nuevo',
                clics INTEGER DEFAULT 0,
                qr TEXT DEFAULT '',
                owner TEXT DEFAULT '',
                json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )""")
        db.execute("CREATE INDEX IF NOT EXISTS idx_e_nombre ON emprendimientos(nombre)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_e_categoria ON emprendimientos(categoria)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_e_owner ON emprendimientos(owner)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_e_telefono ON emprendimientos(telefono)")
        db.execute("PRAGMA journal_mode=WAL")


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


def mirror_emprendimientos(datos):
    """Espeja App.data.emprendimientos -> emprendimientos.sqlite
    (indexada). Asi si el blob se daña, los registros sobreviven."""
    emps = (datos or {}).get("emprendimientos") or []
    ahora = datetime.now(timezone.utc).isoformat()
    try:
        db = get_empr_db()
        vivos = []
        for e in emps:
            if not e.get("id"):
                continue
            vivos.append(e["id"])
            db.execute(
                """INSERT OR REPLACE INTO emprendimientos
                   (emp_id, nombre, categoria, contacto, telefono,
                    whatsapp, email, provincia, canton, distrito,
                    lat, lng, estado, clics, qr, owner, json,
                    created_at, updated_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
                           COALESCE((SELECT created_at FROM emprendimientos
                                     WHERE emp_id = ?), ?), ?)""",
                (e["id"], e.get("nombre", ""), e.get("categoria", ""),
                 e.get("contacto", ""), e.get("telefono", ""),
                 e.get("whatsapp", ""), e.get("email", ""),
                 e.get("provincia", ""), e.get("canton", ""),
                 e.get("distrito", ""), str(e.get("lat", "")),
                 str(e.get("lng", "")), e.get("estado", "nuevo"),
                 e.get("clics", 0) or 0, e.get("qr", ""),
                 e.get("owner", ""),
                 __import__("json").dumps(e, ensure_ascii=False),
                 e["id"], ahora, ahora),
            )
        for vid in [r[0] for r in db.execute(
                "SELECT emp_id FROM emprendimientos").fetchall()]:
            if vid not in vivos:
                db.execute("DELETE FROM emprendimientos WHERE emp_id = ?",
                           (vid,))
        db.commit()
    except Exception:
        pass


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
