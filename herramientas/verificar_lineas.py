"""verificar_lineas.py - REGLA SAGRADA: ningun archivo supera las 250 lineas.
Uso: python herramientas/verificar_lineas.py
Sale con codigo 1 y lista los infractores si los hay."""
import os
import sys

LIMITE = 250
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXCLUIR_DIRS = {".git", "node_modules", "__pycache__", "vendor", "webfonts",
                "build", ".gradle", ".idea"}  # build = artefactos generados
EXCLUIR_FILES = {
    os.path.join("templates", "base.html"),  # monolito congelado (ver AGENTS.md)
}
EXTENSIONES = {".js", ".css", ".html", ".py"}


def contar_lineas(ruta):
    try:
        with open(ruta, "r", encoding="utf-8", errors="ignore") as f:
            return sum(1 for _ in f)
    except OSError:
        return 0


def main():
    infractores = []
    revisados = 0
    for raiz, dirs, archivos in os.walk(BASE_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUIR_DIRS]
        for nombre in archivos:
            if os.path.splitext(nombre)[1] not in EXTENSIONES:
                continue
            ruta = os.path.join(raiz, nombre)
            rel = os.path.relpath(ruta, BASE_DIR)
            if rel in EXCLUIR_FILES:
                continue
            revisados += 1
            lineas = contar_lineas(ruta)
            if lineas > LIMITE:
                infractores.append((rel, lineas))

    print(f"Archivos revisados: {revisados} (limite: {LIMITE} lineas)")
    if infractores:
        print("\nINFRACTORES (superan el limite):")
        for rel, lineas in sorted(infractores, key=lambda x: -x[1]):
            print(f"  {lineas:>5}  {rel}")
        sys.exit(1)
    print("OK - Ningun archivo supera el limite. Regla sagrada cumplida.")


if __name__ == "__main__":
    main()
