@echo off

:: Define a single log file for the entire build process
set LOG_FILE=f:\Dev\eBaySalesTool\scripts\build_and_deploy.log

:: Clear the log file at the start of execution
echo Clearing previous log... > %LOG_FILE%
echo Starting new build and deploy process on %DATE% at %TIME% >> %LOG_FILE%

:: Step 1: Check if Docker is running
echo "Step 1 - Checking for running Docker containers..." >> %LOG_FILE%
echo "Step 1 - Checking for running Docker containers..."
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Error: Docker is not running or not accessible. Please start Docker Desktop and try again." >> %LOG_FILE%
    echo "Error: Docker is not running or not accessible. Please start Docker Desktop and try again."
    exit /b 1
)

:: Check for running containers
for /f "tokens=*" %%i in ('docker ps -q') do set CONTAINERS_RUNNING=1
if defined CONTAINERS_RUNNING (
    echo "Stopping running Docker containers..." >> %LOG_FILE%
    docker-compose down >> %LOG_FILE% 2>&1
) else (
    echo "No running Docker containers found." >> %LOG_FILE%
)

:: Proceed with the rest of the script
:: Step 2: Verify npm cache
echo "Step 2 - NPM Cache Cleanup" >> %LOG_FILE%
echo "Step 2 - NPM Cache Cleanup"
cd f:\Dev\eBaySalesTool\backend
Call npm cache verify >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Warning: NPM cache verification encountered an issue but continuing..." >> %LOG_FILE%
)
cd f:\Dev\eBaySalesTool\scripts

:: Step 3: Check for outdated dependencies
echo "Step 3A - Checking for outdated backend dependencies..." >> %LOG_FILE%
echo "Step 3A - Checking for outdated backend dependencies..."
cd f:\Dev\eBaySalesTool\backend
Call npm outdated > f:\Dev\eBaySalesTool\scripts\npm_outdated_backend.log 2>> %LOG_FILE%
if %ERRORLEVEL% neq 0 (
    echo "Warning: NPM outdated check encountered an issue but continuing..." >> %LOG_FILE%
)
cd f:\Dev\eBaySalesTool\scripts

echo "Step 3B - Checking for outdated frontend dependencies..." >> %LOG_FILE%
echo "Step 3B - Checking for outdated frontend dependencies..."
cd f:\Dev\eBaySalesTool\frontend
Call npm outdated > f:\Dev\eBaySalesTool\scripts\npm_outdated_frontend.log 2>> %LOG_FILE%
if %ERRORLEVEL% neq 0 (
    echo "Warning: NPM outdated check encountered an issue but continuing..." >> %LOG_FILE%
)
cd f:\Dev\eBaySalesTool\scripts

:: Step 4: Log warnings about deprecated packages and vulnerabilities
echo "Step 4 - Logging warnings about deprecated packages and vulnerabilities..." >> %LOG_FILE%
echo "Step 4 - Logging warnings about deprecated packages and vulnerabilities..."
Call npm audit --prefix ../backend >> %LOG_FILE% 2>&1
Call npm audit --prefix ../frontend >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Warning: Vulnerabilities detected. Review the log for details." >> %LOG_FILE%
    echo "Please address deprecated packages and vulnerabilities manually." >> %LOG_FILE%
)

:: Step 5: Clean up and install dependencies using the dedicated script
echo "Step 5 - Cleaning up and installing dependencies..." >> %LOG_FILE%
echo "Step 5 - Cleaning up and installing dependencies..."
call npm_cleanup_and_install.bat >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Failed to clean up and install npm dependencies. Exiting..." >> %LOG_FILE%
    exit /b %ERRORLEVEL%
)

:: Step 6: Build backend
echo "Building backend..." >> %LOG_FILE%
echo "Building backend..."
cd f:\Dev\eBaySalesTool\backend
if exist package.json (
    call npm run build >> %LOG_FILE% 2>&1
    if %ERRORLEVEL% neq 0 (
        echo "Failed to build backend. Exiting..." >> %LOG_FILE%
        exit /b %ERRORLEVEL%
    )
) else (
    echo "Backend package.json not found. Exiting..." >> %LOG_FILE%
    exit /b 1
)
cd f:\Dev\eBaySalesTool

:: Step 7: Build frontend
echo "Building frontend..." >> %LOG_FILE%
echo "Building frontend..."
cd f:\Dev\eBaySalesTool\frontend
if exist package.json (
    call npm run build >> %LOG_FILE% 2>&1
    if %ERRORLEVEL% neq 0 (
        echo "Failed to build frontend. Exiting..." >> %LOG_FILE%
        exit /b %ERRORLEVEL%
    )
) else (
    echo "Frontend package.json not found. Exiting..." >> %LOG_FILE%
    exit /b 1
)
cd f:\Dev\eBaySalesTool

:: Step 8: Build Docker images and restart containers
echo "Step 8 - Building Docker images and restarting containers..." >> %LOG_FILE%
echo "Step 8 - Building Docker images and restarting containers..."
if exist f:\Dev\eBaySalesTool\docker-compose.yml (
    call docker-compose down >> %LOG_FILE% 2>&1
    call docker-compose up --build -d >> %LOG_FILE% 2>&1
    if %ERRORLEVEL% neq 0 (
        echo "Failed to build Docker images and restart containers. Exiting..." >> %LOG_FILE%
        exit /b %ERRORLEVEL%
    )
) else (
    echo "Docker configuration file not found in f:\Dev\eBaySalesTool. Exiting..." >> %LOG_FILE%
    exit /b 1
)

:: Final Step: Trigger AI review
echo "Triggering AI to review the log file for issues..." >> %LOG_FILE%
powershell -Command "Write-Output 'Reviewing log file...'" >> %LOG_FILE%
exit /b 0