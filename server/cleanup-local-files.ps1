# ============================================================
#  cleanup-local-files.ps1
#  Run from: server/
#
#  PURPOSE: Safely removes locally stored uploads, signatures,
#  and generated PDFs now that all files are served from Cloudinary.
#
#  USAGE:
#    1. DRY RUN (default -- shows what would be deleted, safe):
#         .\cleanup-local-files.ps1
#
#    2. ACTUALLY DELETE:
#         .\cleanup-local-files.ps1 -Confirm
# ============================================================

param(
    [switch]$Confirm   # Pass -Confirm to actually delete files
)

$root = $PSScriptRoot   # = the server/ directory

$targets = @(
    (Join-Path $root "uploads\attachments"),
    (Join-Path $root "uploads\signatures"),
    (Join-Path $root "uploads"),
    (Join-Path $root "pdfs"),
    (Join-Path $root "signatures")   # legacy standalone folder
)

Write-Host ""
Write-Host "========================================"
Write-Host "  E-Approval -- Cloudinary Migration    "
Write-Host "  Local file cleanup script             "
Write-Host "========================================"
Write-Host ""

# ── Scan and report ──────────────────────────────────────────
$allFiles = @()
foreach ($dir in $targets) {
    if (Test-Path $dir) {
        $files = Get-ChildItem -Recurse -File $dir -ErrorAction SilentlyContinue
        $allFiles += $files
        $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
        $sizeMB    = [math]::Round($totalSize / 1MB, 2)
        Write-Host "  [DIR] $dir"
        Write-Host "        $($files.Count) file(s)  /  $sizeMB MB"
    }
}

Write-Host ""
$grandTotal = ($allFiles | Measure-Object -Property Length -Sum).Sum
$grandMB    = [math]::Round($grandTotal / 1MB, 2)
Write-Host "  TOTAL: $($allFiles.Count) file(s)  |  $grandMB MB on disk"
Write-Host ""

if (-not $Confirm) {
    Write-Host "[DRY RUN] No files were deleted."
    Write-Host "Run with -Confirm to actually delete:"
    Write-Host "  .\cleanup-local-files.ps1 -Confirm"
    Write-Host ""
    exit 0
}

# ── Safety prompt ─────────────────────────────────────────────
Write-Host "WARNING: This will permanently delete all files listed above."
Write-Host "Make sure Cloudinary uploads are confirmed working first!"
Write-Host ""
$answer = Read-Host "Type YES to continue"
if ($answer -ne "YES") {
    Write-Host "Aborted -- no files deleted."
    exit 0
}

# ── Delete ───────────────────────────────────────────────────
$deleted = 0
$errors  = 0

foreach ($dir in $targets) {
    if (Test-Path $dir) {
        $files = Get-ChildItem -Recurse -File $dir -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            try {
                Remove-Item $file.FullName -Force
                Write-Host "  [OK] Deleted: $($file.Name)"
                $deleted++
            } catch {
                Write-Host "  [ERR] Failed: $($file.FullName) -- $_"
                $errors++
            }
        }

        # Remove directory if now empty
        try {
            $remaining = Get-ChildItem $dir -ErrorAction SilentlyContinue
            if (-not $remaining) {
                Remove-Item $dir -Force -ErrorAction SilentlyContinue
                Write-Host "  [DIR] Removed empty folder: $dir"
            }
        } catch { }
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Done: $deleted file(s) deleted, $errors error(s)"
Write-Host "========================================"
Write-Host ""
