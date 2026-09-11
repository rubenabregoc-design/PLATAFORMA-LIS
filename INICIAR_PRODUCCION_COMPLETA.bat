@echo off
title AbregoTech LIS/HIS - Lanzador Unificado de Produccion On-Premises (HTTPS SSL Confiable)
color 0B
cd /d "%~dp0"

echo ============================================================
echo   AbregoTech LIS/HIS - Produccion Local HTTPS SSL (1-Clic)
echo ============================================================
echo   [1/4] Verificando e Instalando Certificado SSL Confiable en Windows...
powershell -ExecutionPolicy Bypass -File "%~dp0server\install-trusted-ssl.ps1"

echo.
echo   [2/4] Iniciando Servidor de Base de Datos PostgreSQL 15...
start "AbregoTech BD" /min cmd /k "cd /d "%~dp0" && iniciar-bd.bat"

echo   [3/4] Levantando Middleware ACE Daemon y Puertos de Equipos...
start "AbregoTech ACE" /min cmd /k "cd /d "%~dp0" && START_ACE_DAEMON.bat"

echo   [4/4] Activando Servidor LISCORE con Certificado SSL HTTPS...
start "AbregoTech LISCORE" cmd /k "cd /d "%~dp0" && npm run dev -- --host"

echo ============================================================
echo   ¡PRODUCCION LOCAL HTTPS SSL ACTIVA EN 1-CLIC!
echo   - URL Cifrada HTTPS:   https://192.168.0.8:3000
echo   - URL Cifrada Local:   https://localhost:3000
echo ============================================================
echo.
timeout /t 4 >nul
start https://localhost:3000
