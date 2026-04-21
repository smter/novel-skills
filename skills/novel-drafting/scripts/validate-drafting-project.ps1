param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot
)

$errors = New-Object System.Collections.Generic.List[string]

$requiredFiles = @(
    '00-project/project-brief.md',
    '00-project/success-criteria.md',
    '00-project/workflow-status.md',
    '20-story/characters.md',
    '20-story/plot-outline.md',
    '20-story/foreshadowing.md',
    '30-draft/chapter-plan.md'
)

foreach ($relativePath in $requiredFiles) {
    $fullPath = Join-Path $ProjectRoot $relativePath
    if (-not (Test-Path -LiteralPath $fullPath)) {
        $errors.Add("Missing required file: $relativePath")
        continue
    }

    $content = Get-Content -Raw -LiteralPath $fullPath
    if ([string]::IsNullOrWhiteSpace($content)) {
        $errors.Add("Empty required file: $relativePath")
    }
}

$chapterDir = Join-Path $ProjectRoot '30-draft/chapters'
$reviewDir = Join-Path $ProjectRoot '40-review/chapter-reviews'

if (-not (Test-Path -LiteralPath $chapterDir)) {
    $errors.Add('Missing chapter directory: 30-draft/chapters')
}

if (-not (Test-Path -LiteralPath $reviewDir)) {
    $errors.Add('Missing review directory: 40-review/chapter-reviews')
}

$chapterPlanPath = Join-Path $ProjectRoot '30-draft/chapter-plan.md'
$plannedChapterNumbers = @()

if (Test-Path -LiteralPath $chapterPlanPath) {
    $chapterPlan = Get-Content -Raw -LiteralPath $chapterPlanPath
    $matches = [regex]::Matches($chapterPlan, '(?m)^###\s+Chapter\s+(\d+)')
    foreach ($match in $matches) {
        $plannedChapterNumbers += [int]$match.Groups[1].Value
    }

    if ($plannedChapterNumbers.Count -eq 0) {
        $errors.Add('No planned chapters were found in 30-draft/chapter-plan.md')
    }
}

foreach ($number in $plannedChapterNumbers) {
    $chapterFile = Join-Path $ProjectRoot ("30-draft/chapters/chapter-{0:D2}.md" -f $number)
    $reviewFile = Join-Path $ProjectRoot ("40-review/chapter-reviews/chapter-{0:D2}-review.md" -f $number)

    if (-not (Test-Path -LiteralPath $chapterFile)) {
        $errors.Add(("Missing chapter file for planned chapter {0}: 30-draft/chapters/chapter-{0:D2}.md" -f $number))
    } else {
        $chapterContent = Get-Content -Raw -LiteralPath $chapterFile
        foreach ($heading in @('## Metadata', '## Summary', '## Content', 'Draft Status')) {
            if ($chapterContent -notmatch [regex]::Escape($heading)) {
                $errors.Add(("Chapter {0} is missing section '{1}'." -f $number, $heading))
            }
        }
    }

    if (-not (Test-Path -LiteralPath $reviewFile)) {
        $errors.Add(("Missing review file for planned chapter {0}: 40-review/chapter-reviews/chapter-{0:D2}-review.md" -f $number))
    } else {
        $reviewContent = Get-Content -Raw -LiteralPath $reviewFile
        foreach ($heading in @('## Metadata', '## Checks', '## Findings', '## Required Revisions')) {
            if ($reviewContent -notmatch [regex]::Escape($heading)) {
                $errors.Add(("Review {0} is missing section '{1}'." -f $number, $heading))
            }
        }
        if ($reviewContent -notmatch 'Decision:\s*通过') {
            $errors.Add(("Review {0} does not contain a passing decision." -f $number))
        }
    }
}

$workflowPath = Join-Path $ProjectRoot '00-project/workflow-status.md'
if (Test-Path -LiteralPath $workflowPath) {
    $workflow = Get-Content -Raw -LiteralPath $workflowPath
    foreach ($field in @('Status:', 'Current Stage:', 'Completed Chapters:', 'Last Completed Chapter:', 'Blocking Issues:', 'Next Allowed Skill:')) {
        if ($workflow -notmatch [regex]::Escape($field)) {
            $errors.Add("Workflow status is missing field '$field'")
        }
    }
}

if ($errors.Count -gt 0) {
    Write-Host 'Drafting validation failed:' -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "- $_" }
    exit 1
}

Write-Host 'Drafting validation passed.' -ForegroundColor Green
