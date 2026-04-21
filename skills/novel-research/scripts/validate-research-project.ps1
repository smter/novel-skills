param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot
)

$requiredFiles = @(
    '00-project/project-brief.md',
    '00-project/success-criteria.md',
    '00-project/workflow-status.md',
    '10-research/topic-research.md',
    '10-research/setting-research.md',
    '10-research/style-research.md',
    '10-research/references.md',
    '20-story/characters.md',
    '20-story/plot-outline.md',
    '20-story/foreshadowing.md',
    '30-draft/chapter-plan.md'
)

$requiredHeadings = @{
    '00-project/project-brief.md' = @(
        '## Working Title',
        '## Genre/Type',
        '## Target Audience',
        '## Target Length',
        '## Core Premise',
        '## Central Conflict',
        '## Protagonist Goal',
        '## Forbidden Content'
    )
    '00-project/success-criteria.md' = @(
        '## Reader Promise',
        '## Length and Scope',
        '## Completion Gates',
        '## Review Expectations'
    )
    '10-research/references.md' = @(
        '## Source Entry',
        '## Open Question',
        '## Inference Note'
    )
    '30-draft/chapter-plan.md' = @(
        '## Overview',
        '## Chapter List'
    )
}

$errors = New-Object System.Collections.Generic.List[string]

foreach ($relativePath in $requiredFiles) {
    $fullPath = Join-Path $ProjectRoot $relativePath
    if (-not (Test-Path -LiteralPath $fullPath)) {
        $errors.Add("Missing required file: $relativePath")
        continue
    }

    $content = Get-Content -Raw -LiteralPath $fullPath
    if ([string]::IsNullOrWhiteSpace($content)) {
        $errors.Add("Empty required file: $relativePath")
        continue
    }

    if ($requiredHeadings.ContainsKey($relativePath)) {
        foreach ($heading in $requiredHeadings[$relativePath]) {
            if ($content -notmatch [regex]::Escape($heading)) {
                $errors.Add("Missing heading '$heading' in $relativePath")
            }
        }
    }
}

$workflowPath = Join-Path $ProjectRoot '00-project/workflow-status.md'
if (Test-Path -LiteralPath $workflowPath) {
    $workflow = Get-Content -Raw -LiteralPath $workflowPath
    foreach ($field in @('Status:', 'Current Stage:', 'Planned Chapters:', 'Completed Chapters:', 'Blocking Issues:', 'Next Allowed Skill:')) {
        if ($workflow -notmatch [regex]::Escape($field)) {
            $errors.Add("Workflow status is missing field '$field'")
        }
    }
}

if ($errors.Count -gt 0) {
    Write-Host 'Research validation failed:' -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "- $_" }
    exit 1
}

Write-Host 'Research validation passed.' -ForegroundColor Green
