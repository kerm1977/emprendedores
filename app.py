"""app.py - Punto de entrada Flask: sirve la app www/ y registra los
blueprints de conectividad (data_routes) y autenticacion (auth_routes)."""
import os
from flask import Flask, render_template, send_from_directory, redirect

from db import close_db, ensure_db
from data_routes import data_bp
from auth_routes import auth_bp
from emergency_routes import emerg_bp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WWW_DIR = os.path.join(BASE_DIR, "www")

app = Flask(__name__)
app.teardown_appcontext(close_db)
app.register_blueprint(data_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(emerg_bp)


@app.route("/")
def index():
    ensure_db()
    return render_template("base.html")


@app.route("/inicio", strict_slashes=False)
def inicio():
    return redirect("/app/")


# App Capacitor (www/): frontend puro, Flask solo sirve archivos + API
@app.route("/app/")
@app.route("/app/<path:filename>")
def capacitor_app(filename="index.html"):
    return send_from_directory(WWW_DIR, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
