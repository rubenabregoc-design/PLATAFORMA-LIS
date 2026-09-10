@echo off
title AbregoTech LIS - Middleware Bridge (Analizadores Clinicos)
color 0A
echo ============================================================
echo   AbregoTech LIS - Servidor Middleware TCP / WebSocket
echo ============================================================
echo   - WebSocket Hub:       ws://localhost:8765
echo   - Analizadores TCP:    Puertos 5100 al 5106
echo ============================================================
echo.
cd /d "%~dp0"
node server/middleware-bridge.js
pause
