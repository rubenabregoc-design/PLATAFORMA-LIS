# AbregoTech LIS/HIS - Senior Local Domain & SSL PKI Installer
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AbregoTech LIS/HIS - Instalador SSL Confiable (his.local)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Registrar dominio his.local en hosts si es posible
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue

if ($hostsContent -notcontains "127.0.0.1 his.local") {
    try {
        Add-Content -Path $hostsPath -Value "`n127.0.0.1 his.local`n127.0.0.1 lis.local" -ErrorAction SilentlyContinue
        Write-Host "OK: Dominio https://his.local registrado en hosts de Windows." -ForegroundColor Green
    } catch {
        Write-Host "Nota: Modificacion de hosts omitida." -ForegroundColor Yellow
    }
}

# 2. Generar Certificado RSA 2048 con SAN (his.local, lis.local, localhost, 192.168.0.8)
try {
    $cert = New-SelfSignedCertificate -DnsName "his.local", "lis.local", "localhost", "127.0.0.1", "192.168.0.8" `
        -CertStoreLocation "Cert:\LocalMachine\My" `
        -FriendlyName "AbregoTech HIS Local CA" `
        -KeyUsage DigitalSignature, KeyEncipherment, CertSign, CRLSign `
        -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1,1.3.6.1.5.5.7.3.2") `
        -NotAfter (Get-Date).AddYears(10)

    # 3. Importar al Almacen de Confianza de la Maquina Local (System-Wide Trusted Root)
    $rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
    $rootStore.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
    $rootStore.Add($cert)
    $rootStore.Close()

    Write-Host "OK: Certificado SSL para https://his.local instalado en Almacen Raiz de Windows." -ForegroundColor Green
} catch {
    Write-Host "Nota SSL: $_" -ForegroundColor Yellow
}
