@echo off
chcp 65001 > nul
title AbregoTech LIS - Middleware Bridge ASTM E1381 / HL7 v2.x
color 0B
cd /d "%~dp0"

echo ===============================================================================
echo     ABREGOTECH LIS - CONSOLA DE MIDDLEWARE ^& INGESTION DE ANALIZADORES
echo ===============================================================================
echo.
echo   Protocolos Soportados : ASTM E1381 / E1394 (Handshake ENQ/ACK) y HL7 v2.x MLLP
echo   Canal WebSocket       : ws://localhost:8765
echo   Puertos TCP Activos   :
echo     - 5109: Sysmex XN-1000
echo     - 5101: Ortho Vitros 4600
echo     - 5102: Roche Cobas 6000 (c501/e601)
echo     - 5103: Abbott Alinity ci-series
echo     - 5104: Mindray BC-6800Plus
echo     - 5105: Stago STA Compact Max
echo     - 5106: Bio-Rad D-10 HPLC
echo ===============================================================================
echo.

:: Si ya está activo en el puerto 8765, liberar el proceso anterior para evitar colisión EADDRINUSE
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8765" ^| findstr "LISTENING"') do (
    echo [INFO] Reiniciando instancia anterior en puerto 8765 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

node server/middleware-bridge.js
pause
