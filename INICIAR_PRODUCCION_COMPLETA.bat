@echo off
title AbregoTech LIS/HIS - Lanzador Unificado de Produccion On-Premises
color 0B
echo ============================================================
echo   AbregoTech LIS/HIS - Lanzamiento de Produccion Local 1-Clic
echo ============================================================
echo   [1/3] Iniciando Servidor de Base de Datos PostgreSQL 15...
start "" /min cmd /c "iniciar-bd.bat"

echo   [2/3] Levantando Middleware ACE Daemon y Puertos de Equipos...
start "" /min cmd /c "START_ACE_DAEMON.bat"

echo   [3/3] Activando Servidor LISCORE y Proxy HTTPS SSL Cifrado...
start "" /min cmd /c "iniciar-https-local.bat"

echo ============================================================
echo   ¡PRODUCCION LOCAL COMPLETA ACTIVA EN 1-CLIC!
echo   - URL Cifrada HTTPS:  https://192.168.0.8:3000
echo ============================================================
echo.
timeout /t 2 >nul
start http://localhost:3000
