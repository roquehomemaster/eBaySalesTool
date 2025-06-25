@echo off
REM EXPERIMENTAL SCRIPT: See EXPERIMENTAL.md for details.
REM Purpose: To rapidly test Docker build and restart behavior without the full migration/seeding/healthcheck process. This is needed to isolate and debug issues with container lifecycle and static file serving, which may be masked by the more complex official build process.
REM Logic: The script prunes or brings down all containers and volumes, then runs a fresh 'docker compose up -d --build'. It omits migrations and health checks to focus solely on image/container state and static file serving.
REM Intended Goals:
REM   - Determine if stale frontend code is due to Docker image/container caching or volume issues.
REM   - Provide a minimal, fast feedback loop for frontend build/deployment experiments.
REM Status: EXPERIMENTAL

:: Check if Docker is running
echo "Checking if Docker is running..."
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Docker is not running. Please start Docker and try again."
    exit /b 1
)

echo "Docker is running. Checking for running containers..."

:: Check if any containers are running
for /f "tokens=*" %%i in ('docker ps -q') do set CONTAINERS_RUNNING=1
if defined CONTAINERS_RUNNING (
    echo "Running containers found. Stopping and removing containers..."
    docker compose -f f:\Dev\eBaySalesTool\docker-compose.yml down -v
) else (
    echo "No running containers found. Pruning Docker system..."
    docker system prune -f --volumes
)

:: Build Docker images including backend
docker compose -f f:\Dev\eBaySalesTool\docker-compose.yml up -d --build

echo "Docker build process completed successfully."
exit /b 0