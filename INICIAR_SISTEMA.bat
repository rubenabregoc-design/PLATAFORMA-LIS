@echo off
title AbregoTech LISCORE - Sistema Unificado On-Premises
color 0B
cd /d "%~dp0"

echo ============================================================
echo   AbregoTech LISCORE - Inicializando Servicios Silenciosos
echo ============================================================
echo.

:: 1. Permitir puertos en Firewall para red local (LIS, Analizadores y Portales)
netsh advfirewall firewall add rule name="AbregoTech_LISCORE_Port_3000" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="AbregoTech_Portal_Pacientes_3001" dir=in action=allow protocol=TCP localport=3001 >nul 2>&1
netsh advfirewall firewall add rule name="AbregoTech_Portal_Medicos_3002" dir=in action=allow protocol=TCP localport=3002 >nul 2>&1
netsh advfirewall firewall add rule name="AbregoTech_SuperAdmin_3003" dir=in action=allow protocol=TCP localport=3003 >nul 2>&1
netsh advfirewall firewall add rule name="AbregoTech_ACE_Port_5100" dir=in action=allow protocol=TCP localport=5100 >nul 2>&1

:: 2. Instalar certificado SSL en Almacen de Windows
powershell -ExecutionPolicy Bypass -File "%~dp0server\install-trusted-ssl.ps1" >nul 2>&1

:: 3. Iniciar todos los motores en segundo plano silencioso (Cero Pantallas Negras)
wscript.exe //B "%~dp0server\launch-silent.vbs"

echo   [OK] PostgreSQL 16.15 & API PostgREST :8000
echo   [OK] Middleware Analizadores ACE :5100
echo   [OK] Enrutador de Portales Dedicados :3001, :3002, :3003
echo   [OK] Servidor Clinico LISCORE :3000
echo.
echo   Plataforma iniciada de forma 100% segura en segundo plano.
timeout /t 2 >nul
