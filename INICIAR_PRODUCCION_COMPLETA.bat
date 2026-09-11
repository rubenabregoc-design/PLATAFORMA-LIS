@echo off
title AbregoTech LIS/HIS - Lanzador Unificado de Produccion On-Premises
color 0B
cd /d "%~dp0"

echo ============================================================
echo   AbregoTech LIS/HIS - Lanzamiento de Produccion Local 1-Clic
echo ============================================================
echo   [1/3] Iniciando Servidor de Base de Datos PostgreSQL 15...
start "AbregoTech BD" /min cmd /k "cd /d "%~dp0" && iniciar-bd.bat"

echo   [2/3] Levantando Middleware ACE Daemon y Puertos de Equipos...
start "AbregoTech ACE" /min cmd /k "cd /d "%~dp0" && START_ACE_DAEMON.bat"

echo   [3/3] Activando Servidor LISCORE en Red LAN...
start "AbregoTech LISCORE" cmd /k "cd /d "%~dp0" && npm run dev -- --host"

echo ============================================================
echo   ¡PRODUCCION LOCAL COMPLETA ACTIVA EN 1-CLIC!
echo   - Acceso Red LAN:     http://192.168.0.8:3000
echo   - Acceso Servidor:    http://localhost:3000
echo ============================================================
echo.
timeout /t 4 >nul
start http://192.168.0.8:3000
