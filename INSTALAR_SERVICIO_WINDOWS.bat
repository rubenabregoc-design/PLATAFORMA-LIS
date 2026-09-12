@echo off
title AbregoTech LIS/HIS - Instalador de Servicio de Windows en Segundo Plano
color 0A
cd /d "%~dp0"

echo ============================================================
echo   AbregoTech LISCORE - Registro de Servicio de Windows
echo ============================================================
echo   Configurando arranque automatico en segundo plano...
echo.

schtasks /create /tn "AbregoTech_LISCORE_Service" /tr "\"%~dp0INICIAR_SILENCIOSO.vbs\"" /sc onstart /ru SYSTEM /f >nul 2>&1

echo ============================================================
echo   ¡SERVICIO DE WINDOWS CONFIGURADO CON EXITO!
echo   - 0 Ventanas Negras CMD en la Barra de Tareas.
echo   - Arranque Automatico al Encender el Servidor.
echo   - Protegido contra Cierres Accidentales.
echo ============================================================
echo.
pause
