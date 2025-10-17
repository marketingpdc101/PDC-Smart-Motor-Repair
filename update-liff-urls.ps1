# Update LIFF Apps Deployment URL
# From @5 to @8

$oldUrl = "AKfycbzbmnu29mXdvX9bJlHJLSaNo7B78uEbuBgIfNOr_8S9TR3BSGuNLrDIgyw6YijvnmT0"
$newUrl = "AKfycbx2nmE9w5ea5qBGmfJfK8SCXn4pERD6WPhqoF1PIsxAU09KqdKFhKbTdlmiYh0m4Zpg"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Updating LIFF Apps Deployment URL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Old URL (Deployment @5):" -ForegroundColor Yellow
Write-Host "  $oldUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "New URL (Deployment @8):" -ForegroundColor Green
Write-Host "  $newUrl" -ForegroundColor Gray
Write-Host ""

# Get all HTML files in liff-apps
$files = Get-ChildItem -Path "liff-apps" -Recurse -Filter "*.html"

Write-Host "Files to update:" -ForegroundColor Yellow
$files | ForEach-Object { 
    $relativePath = $_.FullName.Replace($PWD.Path + "\", "")
    Write-Host "  - $relativePath" -ForegroundColor Gray 
}
Write-Host ""

$updatedCount = 0
$skippedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    if ($content -match [regex]::Escape($oldUrl)) {
        $newContent = $content -replace [regex]::Escape($oldUrl), $newUrl
        Set-Content -Path $file.FullName -Value $newContent -NoNewline -Encoding UTF8
        
        $relativePath = $file.FullName.Replace($PWD.Path + "\", "")
        Write-Host "✅ Updated: $relativePath" -ForegroundColor Green
        $updatedCount++
    }
    else {
        $relativePath = $file.FullName.Replace($PWD.Path + "\", "")
        Write-Host "⏭️  Skipped: $relativePath (no old URL found)" -ForegroundColor Gray
        $skippedCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Updated: $updatedCount files" -ForegroundColor Green
Write-Host "⏭️  Skipped: $skippedCount files" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. git add liff-apps/" -ForegroundColor White
Write-Host "  2. git commit -m 'Update LIFF Apps to deployment @8'" -ForegroundColor White
Write-Host "  3. git push" -ForegroundColor White
Write-Host ""
