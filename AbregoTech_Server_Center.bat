@echo off
title AbregoTech LISCORE - Centro de Control
cd /d "%~dp0"

:: 1. Verificar si los servicios están activos en el puerto 3000
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Iniciando cluster de servicios en segundo plano blindado...
    wscript.exe "%~dp0server\launch-silent.vbs"
    timeout /t 2 /nobreak >nul 2>&1
)

:: 2. Lanzar Microsoft Edge en Modo Aplicacion Nativa Ultra-HD (Sin pestañas, sin barras de URL)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:3000/?view=server_center" --window-size=1380,900
    exit
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:3000/?view=server_center" --window-size=1380,900
    exit
)

:: 3. Lanzar Google Chrome en Modo Aplicacion Nativa si Edge no esta presente
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="http://localhost:3000/?view=server_center" --window-size=1380,900
    exit
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="http://localhost:3000/?view=server_center" --window-size=1380,900
    exit
)

if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="http://localhost:3000/?view=server_center" --window-size=1380,900
    exit
)

:: 4. Respaldo directo en el navegador predeterminado
start "" "http://localhost:3000/?view=server_center"
exit
