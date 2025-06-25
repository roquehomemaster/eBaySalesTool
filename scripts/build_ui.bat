@echo off
REM UI-ONLY BUILD SCRIPT: Rebuilds and restarts only the frontend Docker container.
REM Use this script for frontend (React UI) changes. Backend/database are untouched.

:: Check if Docker is running
echo "Checking if Docker is running..."
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Docker is not running. Please start Docker and try again."
    exit /b 1
)

echo "Rebuilding and restarting only the frontend container..."
docker compose -f f:\Dev\eBaySalesTool\docker-compose.yml build frontend
if %ERRORLEVEL% neq 0 (
    echo "Frontend build failed."
    exit /b 1
)
docker compose -f f:\Dev\eBaySalesTool\docker-compose.yml up -d frontend
if %ERRORLEVEL% neq 0 (
    echo "Failed to start frontend container."
    exit /b 1
)

echo "Frontend build and restart completed successfully."
exit /b 0
