# AbregoTech LISCORE - Registrar Arranque Automatico al Encender Windows
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AbregoTech LISCORE - Registrando Arranque Automatico" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    $startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
    $shortcutPath = Join-Path $startupFolder "AbregoTech_LISCORE.vbs"
    $projectDir = $PSScriptRoot | Split-Path -Parent

    $vbsLines = @(
        "' AbregoTech LISCORE AutoStart on Windows Boot",
        "Set WshShell = CreateObject(""WScript.Shell"")",
        "WshShell.Run ""cmd /c """"cd /d """ + $projectDir + """ && INICIAR_SISTEMA.bat"""", 0, False"
    )

    $vbsContent = $vbsLines -join "`r`n"
    Set-Content -Path $shortcutPath -Value $vbsContent

    Write-Host "OK: Registrado exitosamente en la carpeta de Inicio de Windows:" -ForegroundColor Green
    Write-Host "    $shortcutPath" -ForegroundColor Yellow
    Write-Host "OK: Cada vez que reinicies o enciendas tu laptop, LISCORE encendera solo." -ForegroundColor Green
} catch {
    Write-Host "Error registrando arranque automatico: $_" -ForegroundColor Red
}
