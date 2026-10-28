@echo off
REM server.bat - Arranca Flask y abre Emprende en el navegador.
cd /d "%~dp0"
start "" http://localhost:5000/app/
python app.py
pause
