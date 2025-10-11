# Script to replace color: var(--color-primary) with color: var(--text-accent)
# Only replaces in text context, not backgrounds

$files = Get-ChildItem -Path "Components", "Pages", "src" -Filter "*.scss" -Recurse | 
         Where-Object { $_.FullName -notlike "*node_modules*" }

$count = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace color: var(--color-primary) with color: var(--text-accent)
    # This is specifically for text color, not backgrounds
    $content = $content -replace '(\s+)color:\s*var\(--color-primary\)', '$1color: var(--text-accent)'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName $content -NoNewline
        Write-Host "Updated: $($file.FullName.Replace($PWD, '.'))" -ForegroundColor Green
        $count++
    }
}

Write-Host "`nDone! Updated $count files with text-accent color." -ForegroundColor Cyan
