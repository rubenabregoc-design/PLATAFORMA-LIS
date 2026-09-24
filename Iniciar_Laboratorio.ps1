<#
===============================================================================
    PLATAFORMA CLINICA LIS / HIS / BANCO DE SANGRE - ABREGOTECH PANAMA
    Script de Lanzamiento para Windows PowerShell
===============================================================================
#>

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "   PLATAFORMA CLINICA LIS / HIS / BANCO DE SANGRE - ABREGOTECH PANAMA" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Comprobar Node.js
Write-Host "[1/4] Verificando instalacion de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js no esta instalado o no se encuentra en el PATH." -ForegroundColor Red
    Write-Host "Descargue e instale Node.js LTS desde https://nodejs.org/" -ForegroundColor White
    Read-Host "Presione Enter para salir..."
    exit 1
}

# 2. Comprobar dependencias node_modules
Write-Host ""
Write-Host "[2/4] Verificando dependencias..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not (Test-Path "$scriptDir\node_modules")) {
    Write-Host "[INFO] Instalando dependencias con npm install..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "[OK] Dependencias instaladas correctamente." -ForegroundColor Green
}

# 3. Lanzar Middleware Bridge (ASTM/HL7/TCP/Serie)
Write-Host ""
Write-Host "[3/4] Iniciando Middleware Analyzer Bridge (ASTM / HL7 / TCP / Serie)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; Write-Host 'LIS Middleware Bridge' -ForegroundColor Cyan; node server/middleware-bridge.js"

# 4. Lanzar Frontend Vite Server
Write-Host ""
Write-Host "[4/4] Levantando Servidor Web LIS / HIS / Banco de Sangre..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; Write-Host 'LIS Frontend Server' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  SISTEMA INICIADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "  - Middleware: http://localhost:3001 (ASTM/HL7 TCP: 5000 / Serie: COM1)" -ForegroundColor White
Write-Host "  - Servidor:   http://localhost:3000" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "Abriendo navegador predeterminado..." -ForegroundColor Yellow

Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Write-Host "Las consolas de fondo continuan en ejecucion." -ForegroundColor Gray
