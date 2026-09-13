# ============================================================
# AbregoTech LIS/HIS - Script de Arranque Local (Sin Docker)
# Doble clic o: powershell -ExecutionPolicy Bypass -File start-local.ps1
# ============================================================

Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host "  AbregoTech LIS/HIS - Arranque del Stack Local (Postgres + API)" -ForegroundColor Cyan
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar / Iniciar Servicio PostgreSQL 16 Nativo
Write-Host "  [1/3] Verificando PostgreSQL 16 local..." -ForegroundColor Yellow
$pgService = Get-Service -Name "PostgreSQL-Local" -ErrorAction SilentlyContinue

if ($pgService) {
    if ($pgService.Status -ne 'Running') {
        Write-Host "  Iniciando servicio PostgreSQL-Local..." -ForegroundColor Yellow
        Start-Service -Name "PostgreSQL-Local"
    }
    Write-Host "  [OK] Servicio PostgreSQL-Local en ejecucion (puerto 5432)." -ForegroundColor Green
} else {
    # Fallback si no esta como servicio: iniciar con pg_ctl
    $pgctl = "C:\Users\Usuario\pgsql\bin\pg_ctl.exe"
    $dataDir = "C:\Users\Usuario\pgsql\data"
    $logFile = "C:\Users\Usuario\pgsql\logfile.log"
    if (Test-Path $pgctl) {
        Write-Host "  Iniciando PostgreSQL mediante pg_ctl..." -ForegroundColor Yellow
        & $pgctl -D $dataDir -l $logFile start
        Write-Host "  [OK] PostgreSQL iniciado." -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] No se encontro PostgreSQL en C:\Users\Usuario\pgsql." -ForegroundColor Red
        Pause
        exit 1
    }
}

# 2. Verificar / Iniciar PostgREST API (Puerto 8000)
Write-Host "`n  [2/3] Verificando API PostgREST en http://localhost:8000 ..." -ForegroundColor Yellow
$portOpen = Test-NetConnection -ComputerName 127.0.0.1 -Port 8000 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $portOpen) {
    Write-Host "  Levantando PostgREST en segundo plano..." -ForegroundColor Yellow
    $pgrExe = "C:\Users\Usuario\pgsql\bin\postgrest.exe"
    $confFile = Join-Path $PSScriptRoot "postgrest.conf"

    if (Test-Path $pgrExe) {
        Start-Process -FilePath $pgrExe -ArgumentList "`"$confFile`"" -WindowStyle Hidden
        Start-Sleep -Seconds 2
        Write-Host "  [OK] API PostgREST lista en http://localhost:8000." -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] No se encontro postgrest.exe." -ForegroundColor Red
        Pause
        exit 1
    }
} else {
    Write-Host "  [OK] API PostgREST ya esta activa en http://localhost:8000." -ForegroundColor Green
}

# 3. Verificar / Iniciar Middleware Bridge (Puerto 8765)
Write-Host "`n  [3/4] Verificando Middleware Bridge TCP/WebSocket ..." -ForegroundColor Yellow
$bridgePort = 8765
$bridgeRunning = Test-NetConnection -ComputerName 127.0.0.1 -Port $bridgePort -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $bridgeRunning) {
    Write-Host "  Levantando Middleware Bridge en segundo plano..." -ForegroundColor Yellow
    $bridgeScript = Join-Path $PSScriptRoot "server\middleware-bridge.js"

    if (Test-Path $bridgeScript) {
        Start-Process -FilePath "node" -ArgumentList "`"$bridgeScript`"" -WindowStyle Minimized
        Start-Sleep -Seconds 2
        Write-Host "  [OK] Middleware Bridge listo en ws://localhost:$bridgePort." -ForegroundColor Green
        Write-Host "       TCP puertos: 5100-5106 (Analizadores clinicos)" -ForegroundColor DarkGray
    } else {
        Write-Host "  [WARN] No se encontro server/middleware-bridge.js - Bridge omitido." -ForegroundColor Yellow
    }
} else {
    Write-Host "  [OK] Middleware Bridge ya esta activo en ws://localhost:$bridgePort." -ForegroundColor Green
}

# 4. Iniciar Enrutador de Portales Multi-Puerto (3001, 3002, 3003)
Write-Host "`n  [4/5] Levantando Portales Dedicados (Pacientes: 3001, Medicos: 3002, SuperAdmin: 3003) ..." -ForegroundColor Yellow
$portalScript = Join-Path $PSScriptRoot "server\portal-proxy.js"
if (Test-Path $portalScript) {
    Start-Process -FilePath "node" -ArgumentList "`"$portalScript`"" -WindowStyle Minimized
    Start-Sleep -Seconds 1
    Write-Host "  [OK] Enrutador multi-puerto activo." -ForegroundColor Green
}

# 5. Iniciar la app React
Write-Host "`n  [5/5] Iniciando aplicacion LIS/HIS en http://localhost:3000 ..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  -> Base de Datos Local:    localhost:5432 (lis_local)" -ForegroundColor Cyan
Write-Host "  -> API REST Local:         http://localhost:8000" -ForegroundColor Cyan
Write-Host "  -> Middleware Bridge:       ws://localhost:$bridgePort (TCP 5100-5106)" -ForegroundColor Cyan
Write-Host "  -> Aplicacion Web LIS:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "  -> Portal Pacientes:       http://localhost:3001" -ForegroundColor Cyan
Write-Host "  -> Portal Medicos:         http://localhost:3002" -ForegroundColor Cyan
Write-Host "  -> Consola SuperAdmin:     http://localhost:3003" -ForegroundColor Cyan
Write-Host ""

npm run dev
