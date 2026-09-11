# AbregoTech LISCORE - Senior PKI SSL/TLS Generator & Windows Root Store Installer
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AbregoTech LISCORE - Generando Certificado SSL Confiable" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    $cert = Get-ChildItem Cert:\CurrentUser\My | Where-Object { $_.FriendlyName -eq "AbregoTech LISCORE Trusted SSL" } | Select-Object -First 1

    if (-not $cert) {
        $cert = New-SelfSignedCertificate -DnsName "localhost", "127.0.0.1", "192.168.0.8", "lis.local" `
            -CertStoreLocation "Cert:\CurrentUser\My" `
            -FriendlyName "AbregoTech LISCORE Trusted SSL" `
            -KeyUsage DigitalSignature, KeyEncipherment, CertSign, CRLSign `
            -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1,1.3.6.1.5.5.7.3.2") `
            -NotAfter (Get-Date).AddYears(10)

        $rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
        $rootStore.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
        $rootStore.Add($cert)
        $rootStore.Close()
    }

    # Exportar Certificado PEM para Vite
    $certBase64 = [System.Convert]::ToBase64String($cert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
    $certPem = "-----BEGIN CERTIFICATE-----`n" + $certBase64 + "`n-----END CERTIFICATE-----"
    Set-Content -Path "server/cert.pem" -Value $certPem

    Write-Host "OK: Certificado X.509v3 SSL/TLS instalado y exportado a server/cert.pem" -ForegroundColor Green
} catch {
    Write-Host "Error registrando el certificado: $_" -ForegroundColor Red
}
