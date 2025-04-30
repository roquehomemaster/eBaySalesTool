@echo off

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