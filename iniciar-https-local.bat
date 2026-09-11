@echo off
title AbregoTech LIS - Servidor Local Node.js
color 0B
echo ============================================================
echo   AbregoTech LIS - Servidor Local On-Premises
echo ============================================================
echo   - Acceso Red LAN: http://192.168.0.8:3000
echo ============================================================
echo.
node server/local-https-proxy.js
pause
