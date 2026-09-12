@echo off
title AbregoTech LIS - Habilitar Acceso Wi-Fi Celulares (Firewall)
color 0A
cd /d "%~dp0"

echo ============================================================
echo   AbregoTech LISCORE - Habilitando Acceso Wi-Fi para Celulares
echo ============================================================
echo.
echo   [1/2] Abriendo Puerto 3000 en el Firewall de Windows...
netsh advfirewall firewall add rule name="AbregoTech_LISCORE_Port_3000" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1

echo   [2/2] Abriendo Puerto 5100 para Middleware ACE Daemon...
netsh advfirewall firewall add rule name="AbregoTech_ACE_Port_5100" dir=in action=allow protocol=TCP localport=5100 >nul 2>&1

echo.
echo ============================================================
echo   ¡ACCESO PARA CELULARES Y TABLETS ACTIVADO CON EXITO!
echo   - Desde tu celular en la misma red Wi-Fi ingresa a:
echo     http://192.168.0.8:3000
echo ============================================================
echo.
pause
