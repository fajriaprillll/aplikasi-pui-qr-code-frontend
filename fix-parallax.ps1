$filePath = "node_modules\react-parallax\@types\index.ts"
$content = Get-Content $filePath -Raw

# Replace the problematic import with the fixed import
$fixedContent = $content -replace "import React, { ReactNode } from 'react';", "import React from 'react';`nimport type { ReactNode } from 'react';"

# Write the fixed content back to the file
Set-Content -Path $filePath -Value $fixedContent -NoNewline

Write-Host "Fixed ReactNode import in $filePath" 