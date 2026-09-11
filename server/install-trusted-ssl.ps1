# AbregoTech LISCORE - Senior PKI SSL/TLS Generator & Windows Root Store Installer
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AbregoTech LISCORE - Verificando Certificado SSL Confiable" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    $certPath = Join-Path $PSScriptRoot "cert.pem"

    if (Test-Path $certPath) {
        Import-Certificate -FilePath $certPath -CertStoreLocation "Cert:\CurrentUser\Root" | Out-Null
        Write-Host "OK: Certificado server/cert.pem registrado como Entidad Raiz de Confianza en Windows." -ForegroundColor Green
    } else {
        Write-Host "Iniciando generador de llaves cert.pem/key.pem..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Nota de instalacion: $_" -ForegroundColor Yellow
}
