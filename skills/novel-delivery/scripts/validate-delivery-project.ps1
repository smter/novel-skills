param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot,

    [ValidateSet('Preflight', 'Output')]
    [string]$Mode = 'Preflight'
)

$errors = New-Object System.Collections.Generic.List[string]

function Test-RequiredHeadings {
    param(
        [string]$Path,
        [string[]]$Headings
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        $errors.Add("Missing required file: $Path")
        return
    }

    $content = Get-Content -Raw -LiteralPath $Path
    if ([string]::IsNullOrWhiteSpace($content)) {
        $errors.Add("Empty required file: $Path")
        return
    }

    foreach ($heading in $Headings) {
        if ($content -notmatch [regex]::Escape($heading)) {
            $errors.Add("Missing heading '$heading' in $Path")
        }
    }
}

function Get-MetadataFlag {
    param(
        [string]$Content,
        [string]$Label
    )

    $pattern = "(?im)^-\s*" + [regex]::Escape($Label) + "\s*(.+)$"
    $match = [regex]::Match($Content, $pattern)
    if (-not $match.Success) {
        return $null
    }

    return $match.Groups[1].Value.Trim()
}

if ($Mode -eq 'Preflight') {
    foreach ($relativePath in @(
        '00-project/workflow-status.md',
        '30-draft/chapter-plan.md',
        '50-delivery/metadata.md',
        '50-delivery/frontmatter.md'
    )) {
        $fullPath = Join-Path $ProjectRoot $relativePath
        if (-not (Test-Path -LiteralPath $fullPath)) {
            $errors.Add("Missing required file: $relativePath")
        }
    }

    Test-RequiredHeadings -Path (Join-Path $ProjectRoot '50-delivery/metadata.md') -Headings @(
        '# Metadata',
        '## Bibliographic Data',
        '## Output Targets'
    )

    Test-RequiredHeadings -Path (Join-Path $ProjectRoot '50-delivery/frontmatter.md') -Headings @(
        '# Title Page',
        '## Book Title',
        '## Author',
        '## Rights',
        '## Summary'
    )

    $pandoc = Get-Command pandoc -ErrorAction SilentlyContinue
    if (-not $pandoc) {
        $errors.Add('Pandoc is not available on PATH.')
    }
}

if ($Mode -eq 'Output') {
    $metadataPath = Join-Path $ProjectRoot '50-delivery/metadata.md'
    $metadataContent = ''
    if (Test-Path -LiteralPath $metadataPath) {
        $metadataContent = Get-Content -Raw -LiteralPath $metadataPath
    }

    $needsPdf = (Get-MetadataFlag -Content $metadataContent -Label 'Produce PDF:') -match '^(yes|true|1|y)$'
    $needsEpub = (Get-MetadataFlag -Content $metadataContent -Label 'Produce EPUB:') -match '^(yes|true|1|y)$'
    if (-not $needsPdf -and -not $needsEpub) {
        $needsPdf = $true
        $needsEpub = $true
    }

    $bookPath = Join-Path $ProjectRoot '50-delivery/book.md'
    if (-not (Test-Path -LiteralPath $bookPath)) {
        $errors.Add('Missing generated manuscript: 50-delivery/book.md')
    } else {
        $bookContent = Get-Content -Raw -LiteralPath $bookPath
        if ($bookContent -notmatch [regex]::Escape('# Title Page')) {
            $errors.Add('book.md is missing frontmatter content.')
        }
        if ($bookContent -notmatch '(?m)^#\s+Chapter' -and $bookContent -notmatch '(?m)^##\s+Chapter') {
            $errors.Add('book.md does not appear to include chapter headings.')
        }
    }

    $outputDir = Join-Path $ProjectRoot '50-delivery/output'
    if (-not (Test-Path -LiteralPath $outputDir)) {
        $errors.Add('Missing output directory: 50-delivery/output')
    } else {
        $artifacts = Get-ChildItem -LiteralPath $outputDir -File -ErrorAction SilentlyContinue
        $pdf = $artifacts | Where-Object { $_.Extension -eq '.pdf' }
        $epub = $artifacts | Where-Object { $_.Extension -eq '.epub' }
        if ($needsPdf -and -not $pdf) {
            $errors.Add('No PDF artifact found in 50-delivery/output.')
        } elseif ($needsPdf -and (($pdf | Measure-Object Length -Sum).Sum -le 0)) {
            $errors.Add('PDF artifact is empty.')
        }
        if ($needsEpub -and -not $epub) {
            $errors.Add('No EPUB artifact found in 50-delivery/output.')
        } elseif ($needsEpub -and (($epub | Measure-Object Length -Sum).Sum -le 0)) {
            $errors.Add('EPUB artifact is empty.')
        }
    }
}

if ($errors.Count -gt 0) {
    Write-Host "Delivery validation failed for mode ${Mode}:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "- $_" }
    exit 1
}

Write-Host "Delivery validation passed for mode ${Mode}." -ForegroundColor Green
