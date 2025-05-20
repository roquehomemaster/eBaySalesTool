@echo off
setlocal enabledelayedexpansion

REM Standard Operating Procedure (S.O.P.):
REM 1. Run this script to build the project.
REM 2. After the script completes, verify the build.log file for any errors or warnings.
REM 3. Ensure all containers are healthy and the database is seeded successfully.
REM 4. Test the application to confirm functionality.

REM Clear the build.log file at the start of execution
echo. > f:\Dev\eBaySalesTool\backend\scripts\build.log

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if Docker containers are already running
for /f "tokens=1,2,3,4,5*" %%a in ('docker ps -a --format "{{.Names}} {{.Status}}"') do (
    if "%%a"=="postgres_db" (
        docker-compose down -v
        echo Existing Docker containers found. Bringing them down with -v.
        REM Do not jump to :continue_build here; always proceed to bring up containers and health check
    )
)

REM Bring up the Docker containers
docker-compose up --build -d
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to start Docker containers.
    exit /b 1
)

REM Run database migrations before health check and seeding
REM Wait for the database container to be healthy before running migrations
set HEALTH_CHECK_RETRIES=30
set HEALTH_CHECK_DELAY=10
for /L %%i in (1,1,%HEALTH_CHECK_RETRIES%) do (
    for /f "tokens=*" %%H in ('docker inspect --format="{{.State.Health.Status}}" postgres_db 2^>nul') do set "HEALTH_STATUS=%%H"
    echo Attempt %%i: PostgreSQL container status: !HEALTH_STATUS!
    if "!HEALTH_STATUS!"=="healthy" (
        echo PostgreSQL container is healthy.
        goto run_migrations
    )
    echo Attempt %%i: PostgreSQL container is not healthy. Retrying in %HEALTH_CHECK_DELAY% seconds...
    timeout /t %HEALTH_CHECK_DELAY% >nul
)

echo PostgreSQL container failed to become healthy after %HEALTH_CHECK_RETRIES% attempts.
exit /b 1

:run_migrations
REM Run migration SQL scripts to ensure schema exists before seeding
REM (Assumes psql is available in the backend container)
docker exec -i postgres_db psql -U postgres -d ebay_sales_tool < f:/Dev/eBaySalesTool/database/migrations/01_init.sql
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to run database migrations.
    exit /b 1
)

goto continue_build

:continue_build
REM Run the Node.js build script to handle all build logic, including conditional seeding
node f:\Dev\eBaySalesTool\backend\scripts\build.js
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js build script failed.
    exit /b 1
)

echo Build process completed successfully.