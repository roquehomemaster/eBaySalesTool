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
docker compose -f f:\Dev\ListFlowHQ\docker-compose.yml build frontend
if %ERRORLEVEL% neq 0 (
    echo "Frontend build failed."
    exit /b 1
)
docker compose -f f:\Dev\ListFlowHQ\docker-compose.yml up -d frontend
if %ERRORLEVEL% neq 0 (
    echo "Frontend container restart failed."
    exit /b 1
)
echo "Frontend container rebuilt and restarted successfully."
