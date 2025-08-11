# Initializes an external Docker volume for Postgres persistence
param(
  [string]$VolumeName = "ebaysalestool-db"
)

# Check if volume exists
$existing = docker volume ls --format '{{.Name}}' | Select-String -SimpleMatch $VolumeName
if (-not $existing) {
  Write-Host "Creating docker volume '$VolumeName'" -ForegroundColor Cyan
  docker volume create $VolumeName | Out-Null
} else {
  Write-Host "Docker volume '$VolumeName' already exists" -ForegroundColor Green
}
