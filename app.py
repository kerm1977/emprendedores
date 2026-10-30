"""app.py - Punto de entrada Flask: sirve la app www/ y registra los
blueprints de conectividad (data_routes) y autenticacion (auth_routes)."""
import os
from flask import Flask, render_template, send_from_directory, redirect

from db import close_db, ensure_db
from data_routes import data_bp
from auth_routes import auth_bp
from emergency_routes import emerg_bp
from uploads_routes import uploads_bp
from google_routes import google_bp
from promo_auth import proteger_usuarios, sesion_en_respuesta, error_seguridad
from werkzeug.exceptions import HTTPException
from promociones_manual import promociones_bp
from promociones_cobro import cobro_bp
from eventos_routes import eventos_bp
from actualizacion_routes import actualizacion_bp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WWW_DIR = os.path.join(BASE_DIR, "www")

app = Flask(__name__)


@app.after_request
def cors_app_movil(resp):
    # Las apps moviles instaladas llaman al API desde otro origen
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return resp


app.teardown_appcontext(close_db)
app.register_blueprint(data_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(emerg_bp)
app.register_blueprint(uploads_bp)
app.register_blueprint(google_bp)
app.register_blueprint(promociones_bp)
app.register_blueprint(cobro_bp)
app.register_blueprint(eventos_bp)
app.register_blueprint(actualizacion_bp)
app.before_request(proteger_usuarios)
app.after_request(sesion_en_respuesta)
app.register_error_handler(HTTPException, error_seguridad)


@app.route("/")
def index():
    ensure_db()
    return render_template("base.html")


@app.route("/inicio", strict_slashes=False)
def inicio():
    return redirect("/app/")


@app.route("/privacidad")
def privacidad():
    return render_template("privacidad.html")


# App Capacitor (www/): frontend puro, Flask solo sirve archivos + API
@app.route("/app/")
@app.route("/app/<path:filename>")
def capacitor_app(filename="index.html"):
    return send_from_directory(WWW_DIR, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
