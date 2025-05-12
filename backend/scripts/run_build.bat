@echo off
REM Standard Operating Procedure (S.O.P.):
REM 1. Run this script to build the project.
REM 2. After the script completes, verify the build.log file for any errors or warnings.
REM 3. Ensure all containers are healthy and the database is seeded successfully.
REM 4. Test the application to confirm functionality.
docker-compose down -v
node f:\Dev\eBaySalesTool\backend\scripts\build.js

set PG_HOST=postgres_db
set PG_PORT=5432
set PG_USER=postgres
set PG_DATABASE=ebay_sales_tool

set BUILD_JSON_PATH=f:\Dev\eBaySalesTool\backend\build.json
if not exist "%BUILD_JSON_PATH%" (
    echo "Error: build.json file not found at %BUILD_JSON_PATH%"
    exit /b 1
)

REM Check if health check is configured before referencing it
if not exist "docker-compose.yml" goto skip_health_check

REM Increase wait time for PostgreSQL health check
set HEALTH_CHECK_RETRIES=30
set HEALTH_CHECK_DELAY=15

REM Updated health check logic
for /L %%i in (1,1,%HEALTH_CHECK_RETRIES%) do (
    docker inspect --format="{{json .State.Health.Status}}" postgres_db | findstr "healthy" >nul 2>&1
    if !errorlevel! equ 0 (
        echo "PostgreSQL container is healthy. Proceeding with the build."
        goto continue_build
    )
    echo "Attempt %%i: PostgreSQL container is not healthy. Retrying in %HEALTH_CHECK_DELAY% seconds..."
    timeout /t %HEALTH_CHECK_DELAY% >nul
)

echo "PostgreSQL container failed to become healthy after %HEALTH_CHECK_RETRIES% attempts. Exiting."
exit /b 1

:continue_build

:skip_health_check
REM Proceed with the rest of the script

:: Update the build.json path to reference the backend directory
node -e "const config = require('f:/Dev/eBaySalesTool/backend/build.json'); if (config.seedDatabase) { require('f:/Dev/eBaySalesTool/backend/scripts/seedDatabase.js'); }"

REM Call the API to populate the database
curl -X POST http://localhost:3000/api/populate-database