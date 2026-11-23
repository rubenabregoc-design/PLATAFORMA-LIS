@echo off
chcp 65001 > nul
set "PATH=%~dp0bin;C:\Users\Usuario\pgsql\bin;%PATH%"
cls
echo ===============================================================================
echo     PLATAFORMA CLINICA LIS / HIS / BANCO DE SANGRE - ABREGOTECH PANAMA
echo ===============================================================================
echo.
echo [1/5] Verificando entorno de ejecucion...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor instale Node.js LTS desde https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detectado:
node -v
echo.

echo [2/5] Verificando dependencias del sistema...
if not exist "node_modules\" (
    echo [INFO] Carpeta node_modules no encontrada. Instalando dependencias iniciales...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo la instalacion de dependencias.
        pause
        exit /b 1
    )
)

echo [3/5] Verificando Base de Datos PostgreSQL y API PostgREST...
:: Iniciar PostgreSQL si el servicio/proceso esta detenido
netstat -ano | findstr ":5432" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Iniciando motor PostgreSQL 16 local...
    if exist "C:\Users\Usuario\pgsql\bin\pg_ctl.exe" (
        "C:\Users\Usuario\pgsql\bin\pg_ctl.exe" start -D "C:\Users\Usuario\pgsql\data" -w >nul 2>&1
    )
)

:: Iniciar PostgREST con ejecutable local bin\postgrest.exe
netstat -ano | findstr ":8000" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Iniciando API REST PostgREST local (:8000)...
    if exist "%~dp0bin\postgrest.exe" (
        start "PostgREST Local API :8000" /min "%~dp0bin\postgrest.exe" postgrest.conf
    ) else if exist "C:\Users\Usuario\pgsql\bin\postgrest.exe" (
        start "PostgREST Local API :8000" /min "C:\Users\Usuario\pgsql\bin\postgrest.exe" postgrest.conf
    )
)

echo.
echo [4/5] Iniciando Middleware Analyzer Bridge (ASTM / HL7 / TCP / Serie)...
netstat -ano | findstr ":8765" >nul 2>&1
if %errorlevel% neq 0 (
    start "LIS Middleware Bridge (ASTM/HL7)" cmd /k "cd /d %~dp0 && node server/middleware-bridge.js"
) else (
    echo [OK] Middleware Bridge ya esta activo y escuchando en :8765
)

echo.
echo [5/5] Levantando Servidor Web LIS / HIS / Banco de Sangre...
start "LIS Frontend Web Server" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ===============================================================================
echo   SISTEMA INICIADO EXITOSAMENTE
echo   - Base de Datos:    http://localhost:8000 (PostgreSQL 16 + PostgREST)
echo   - Middleware:       ws://localhost:8765 (Sockets TCP :5101-:5109)
echo   - Aplicacion Web:   http://localhost:3000
echo ===============================================================================
echo Abriendo navegador en http://localhost:3000...
timeout /t 3 > nul
start http://localhost:3000

echo.
echo Puede minimizar esta ventana. Para detener el sistema use DETENER_SISTEMA.bat
echo.
pause
