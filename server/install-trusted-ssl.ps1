# AbregoTech LISCORE - Senior PKI SSL/TLS Generator & Windows Root Store Installer
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AbregoTech LISCORE - Generando Certificado SSL Confiable" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    # 1. Crear Certificado X.509v3 con SAN (localhost, 127.0.0.1, 192.168.0.8, lis.local)
    # y ExtendedKeyUsage ServerAuthentication (1.3.6.1.5.5.7.3.1) exigidos por Chromium/Edge
    $cert = New-SelfSignedCertificate -DnsName "localhost", "127.0.0.1", "192.168.0.8", "lis.local" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -FriendlyName "AbregoTech LISCORE Trusted SSL" `
        -KeyUsage DigitalSignature, KeyEncipherment, CertSign, CRLSign `
        -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1,1.3.6.1.5.5.7.3.2") `
        -NotAfter (Get-Date).AddYears(10)

    # 2. Importar al Almacen de Entidades Raiz de Confianza del Sistema (Root Store)
    $rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
    $rootStore.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
    $rootStore.Add($cert)
    $rootStore.Close()

    Write-Host "OK: Certificado X.509v3 SSL/TLS instalado exitosamente con Extensiones SAN & ServerAuth." -ForegroundColor Green
    Write-Host "OK: Por favor reinicie Edge / Chrome para activar el Candado de Seguridad Cifrada." -ForegroundColor Green
} catch {
    Write-Host "Error registrando el certificado: $_" -ForegroundColor Red
}
