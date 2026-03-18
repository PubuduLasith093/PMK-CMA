# Enable Long Paths on Windows
# Run this script as Administrator

Write-Host "Enabling Long Path Support in Windows Registry..." -ForegroundColor Yellow

# Enable long paths in registry
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
                 -Name "LongPathsEnabled" `
                 -Value 1 `
                 -PropertyType DWORD `
                 -Force | Out-Null

Write-Host "Long Path Support Enabled Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: You MUST restart your computer for this change to take effect." -ForegroundColor Red
Write-Host ""
Write-Host "After restart, run: npx expo run:android" -ForegroundColor Cyan
