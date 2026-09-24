@echo off
chcp 65001 > nul
cls
echo ===============================================================================
echo     PLATAFORMA CLINICA LIS / HIS / BANCO DE SANGRE - ABREGOTECH PANAMA
echo ===============================================================================
echo.
echo [1/4] Verificando entorno de ejecucion...
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

echo [2/4] Verificando dependencias del sistema...
if not exist "node_modules\" (
    echo [INFO] Carpeta node_modules no encontrada. Instalando dependencias iniciales...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo la instalacion de dependencias.
        pause
        exit /b 1
    )
)

echo [3/4] Iniciando Middleware Analyzer Bridge (ASTM / HL7 / TCP / Serie)...
start "LIS Middleware Bridge (ASTM/HL7)" cmd /k "cd /d %~dp0 && node server/middleware-bridge.js"

echo.
echo [4/4] Levantando Servidor Web LIS / HIS / Banco de Sangre...
start "LIS Frontend Web Server" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ===============================================================================
echo   SISTEMA INICIADO EXITOSAMENTE
echo   - Middleware:   http://localhost:3001 (ASTM/HL7 TCP: 5000 / Serie: COM1)
echo   - Aplicacion:   http://localhost:3000
echo ===============================================================================
echo Abriendo navegador en http://localhost:3000...
timeout /t 3 > nul
start http://localhost:3000

echo.
echo Puede minimizar esta ventana. Para detener el sistema, cierre las consolas activas.
echo.
pause
