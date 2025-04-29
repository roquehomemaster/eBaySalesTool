@echo off

:: Define a single log file for the entire build process
set LOG_FILE=f:\Dev\eBaySalesTool\scripts\build_and_deploy.log

:: Clear the log file at the start of the process
echo Clearing previous log... > %LOG_FILE%

:: Step 1: Check if Docker containers are running
echo "Step 1 - Checking for running Docker containers..." >> %LOG_FILE%
echo "Step 1 - Checking for running Docker containers..."
for /f "tokens=*" %%i in ('docker ps -q') do set CONTAINERS_RUNNING=1
if defined CONTAINERS_RUNNING (
    echo "Stopping running Docker containers..." >> %LOG_FILE%
    docker-compose down >> %LOG_FILE% 2>&1
) else (
    echo "No running Docker containers found." >> %LOG_FILE%
)
:: Step 2: Verify npm cache
echo "Step 2 - NPM Cache Cleanup" >> %LOG_FILE%
echo "Step 2 - NPM Cache Cleanup"
Call npm cache verify >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Warning: NPM cache verification encountered an issue but continuing..." >> %LOG_FILE%
)

:: Ensure script continues execution
echo "Proceeding to Step 3..." >> %LOG_FILE%
echo "Proceeding to Step 3..."

:: Step 3: Check for outdated dependencies
echo "Step 3A - Checking for outdated backend dependencies..." >> %LOG_FILE%
echo "Step 3A - Checking for outdated backend dependencies..."
Call npm outdated --prefix ../backend > ..\scripts\npm_outdated_backend.log 2>> %LOG_FILE%
echo "Step 3B - Checking for outdated frontend dependencies..." >> %LOG_FILE%
echo "Step 3B - Checking for outdated frontend dependencies..."
Call npm outdated --prefix ../frontend > ..\scripts\npm_outdated_frontend.log 2>> %LOG_FILE%
if %ERRORLEVEL% neq 0 (
    echo "Warning: NPM outdated check encountered an issue but continuing..." >> %LOG_FILE%
)

:: Step 4: Log warnings about deprecated packages and vulnerabilities
:: Focus on logging issues for manual review, not automatic fixes
echo "Step 4 - Logging warnings about deprecated packages and vulnerabilities..." >> %LOG_FILE%
echo "Step 4 - Logging warnings about deprecated packages and vulnerabilities..."
Call npm audit --prefix ../backend >> %LOG_FILE% 2>&1
Call npm audit --prefix ../frontend >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Warning: Vulnerabilities detected. Review the log for details." >> %LOG_FILE%
    echo "Please address deprecated packages and vulnerabilities manually." >> %LOG_FILE%
)

:: Ensure the script explicitly continues after Step 4
if %ERRORLEVEL% neq 0 (
    echo "Warning: Issues detected during Step 4, but continuing..." >> %LOG_FILE%
    echo "Warning: Issues detected during Step 4, but continuing..."
)

:: Proceed to Step 5
call :step5

:step5
:: Step 5: Install dependencies for backend and frontend
:: Navigate to backend and install dependencies
echo "Navigating to backend directory..." >> %LOG_FILE%
echo "Current directory: %CD%" >> %LOG_FILE%
call cd ../backend
if not exist package.json (
    echo "Error: backend/package.json not found. Exiting..." >> %LOG_FILE%
    exit /b 1
)
call npm install >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Failed to install backend dependencies. Exiting..." >> %LOG_FILE%
    exit /b %ERRORLEVEL%
)

:: Navigate to frontend and install dependencies
echo "Navigating to frontend directory..." >> %LOG_FILE%
echo "Current directory: %CD%" >> %LOG_FILE%
call cd ../frontend
if not exist package.json (
    echo "Error: frontend/package.json not found. Exiting..." >> %LOG_FILE%
    exit /b 1
)
call npm install >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Failed to install frontend dependencies. Exiting..." >> %LOG_FILE%
    exit /b %ERRORLEVEL%
)

:: Return to scripts directory
echo "Returning to scripts directory..." >> %LOG_FILE%
echo "Current directory: %CD%" >> %LOG_FILE%
call cd ../scripts
if not exist build_and_deploy.bat (
    echo "Error: scripts/build_and_deploy.bat not found. Exiting..." >> %LOG_FILE%
    exit /b 1
)

:: Step 6: Continue with the build process
echo "Step 6 - Cleaning up and installing dependencies..." >> %LOG_FILE%
echo "Step 6 - Cleaning up and installing dependencies..."
cd f:\Dev\eBaySalesTool\scripts
call npm_cleanup_and_install.bat >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Failed to clean up and install npm dependencies. Exiting..." >> %LOG_FILE%
    exit /b %ERRORLEVEL%
)
cd f:\Dev\eBaySalesTool

:: Step 7: Build backend
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

:: Step 8: Build frontend
echo "Building frontend..." >> %LOG_FILE%
echo "Building frontend..."
cd f:\Dev\eBaySalesTool\frontend
if exist package.json (
    call npm install >> %LOG_FILE% 2>&1
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

:: Step 9: Build Docker images and restart containers
echo "Step 9 - Building Docker images and restarting containers..." >> %LOG_FILE%
echo "Step 9 - Building Docker images and restarting containers..."
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

:: Ensure the script continues execution after each step
if %ERRORLEVEL% neq 0 (
    echo "Warning: Issues detected, but continuing..." >> %LOG_FILE%
    echo "Warning: Issues detected, but continuing..."
)

:: Ensure the log review is triggered at the very end
:: Trigger AI review after the entire script execution
echo "AI_REVIEW_TRIGGER" >> %LOG_FILE%
call :trigger_ai_review
exit /b 0

:trigger_ai_review
    echo.
    echo Triggering AI to review the log file for issues...
    :: Notify AI to review the log file
    powershell -Command "Write-Output 'Reviewing log file...'" > %LOG_FILE%
    exit /b 0