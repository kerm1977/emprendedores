@echo off
chcp 65001 >nul
echo ============================================
echo   Cambiar API token de PythonAnywhere
echo ============================================
echo.
set /p TOKEN=Pegá el nuevo API token y presioná Enter:
if "%TOKEN%"=="" (
    echo Vacío. No se guardó nada.
    pause
    exit /b 1
)
echo PA_API_TOKEN=%TOKEN%>.env
echo.
echo Guardado en .env. Verificando el token contra PythonAnywhere...
curl -s -o nul -w "%%{http_code}" -H "Authorization: Token %TOKEN%" https://www.pythonanywhere.com/api/v0/user/kenth1977/cpu/ > %TEMP%\pa_code.txt
set /p CODE=<%TEMP%\pa_code.txt
del %TEMP%\pa_code.txt
if "%CODE%"=="200" (
    echo.
    echo TOKEN VÁLIDO. Ya quedó activo para el publicador.
    echo A partir de ahora: python herramientas/publicar.py
) else (
    echo.
    echo Respuesta %CODE% — el token no fue aceptado. Revisá que esté completo.
)
echo.
pause
