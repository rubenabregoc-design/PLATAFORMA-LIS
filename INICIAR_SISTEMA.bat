@echo off
title AbregoTech LISCORE - Sistema Unificado On-Premises
color 0B
cd /d "%~dp0"

echo ============================================================
echo   AbregoTech LISCORE - Sistema Unificado 1-Clic
echo ============================================================
echo.

:: 1. Permitir puerto 3000 y 5100 en Firewall para celulares
netsh advfirewall firewall add rule name="AbregoTech_LISCORE_Port_3000" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="AbregoTech_ACE_Port_5100" dir=in action=allow protocol=TCP localport=5100 >nul 2>&1

:: 2. Instalar certificado SSL en Almacen de Windows
powershell -ExecutionPolicy Bypass -File "%~dp0server\install-trusted-ssl.ps1" >nul 2>&1

:: 3. Iniciar Base de Datos PostgreSQL 15
start "AbregoTech_BD" /min cmd /c "cd /d "%~dp0" && C:\Users\Usuario\pgsql\bin\postgrest.exe postgrest.conf"

:: 4. Iniciar Middleware ACE Daemon para Analizadores
start "AbregoTech_ACE" /min cmd /c "cd /d "%~dp0ace-daemon" && npm start"

:: 5. Iniciar Servidor LISCORE
start "AbregoTech_LISCORE" /min cmd /c "cd /d "%~dp0" && npm run dev -- --host"

timeout /t 3 >nul
start http://localhost:3000
