# AbregoTech LISCORE - Instalador de Certificado SSL/TLS Confiable en Windows
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AbregoTech LISCORE - Verificando Certificado SSL Confiable" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    # Verificar si el certificado ya existe en el Almacen de Confianza de Windows
    $existingCert = Get-ChildItem Cert:\CurrentUser\Root | Where-Object { $_.FriendlyName -eq "AbregoTech LISCORE Trusted SSL" }

    if ($existingCert) {
        Write-Host "OK: El Certificado SSL ya esta instalado y verificado en Windows." -ForegroundColor Green
        exit 0
    }

    # 1. Crear Certificado SSL Autofirmado para localhost y 192.168.0.8
    $cert = New-SelfSignedCertificate -DnsName "localhost", "127.0.0.1", "192.168.0.8", "lis.local" -CertStoreLocation "Cert:\CurrentUser\My" -FriendlyName "AbregoTech LISCORE Trusted SSL" -NotAfter (Get-Date).AddYears(5)

    # 2. Exportar e Importar al Almacen de Entidades Raiz de Confianza de Windows
    $rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
    $rootStore.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
    $rootStore.Add($cert)
    $rootStore.Close()

    Write-Host "OK: Certificado SSL instalado con exito en el Almacen de Confianza de Windows." -ForegroundColor Green
} catch {
    Write-Host "Error verificando el certificado: $_" -ForegroundColor Red
}
