@echo off

:: Define a single log file for the entire build process
set LOG_FILE=f:\Dev\eBaySalesTool\scripts\build_and_deploy.log

:: Ensure log file is only cleared at the start of the script
echo Clearing previous log... > %LOG_FILE%
echo Starting new build and deploy process on %DATE% at %TIME% >> %LOG_FILE%

:: Ensure step numbers are consistent and accurate in both terminal and log output
:: Step 1: Check if Docker containers are running
echo "--- START STEP 1: Checking for running Docker containers ---" >> %LOG_FILE%
echo "Step 1 - Checking for running Docker containers..."
for /f "tokens=*" %%i in ('docker ps -q') do set CONTAINERS_RUNNING=1
if defined CONTAINERS_RUNNING (
    echo "Stopping running Docker containers..." >> %LOG_FILE%
    docker-compose down >> %LOG_FILE% 2>&1
) else (
    echo "No running Docker containers found." >> %LOG_FILE%
)
echo "--- END STEP 1 ---" >> %LOG_FILE%

:: Step 2: Verify npm cache
echo "--- START STEP 2: NPM Cache Cleanup ---" >> %LOG_FILE%
echo "Step 2 - NPM Cache Cleanup"
Call npm cache verify >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Warning: NPM cache verification encountered an issue but continuing..." >> %LOG_FILE%
)
echo "--- END STEP 2 ---" >> %LOG_FILE%

:: Ensure script continues execution
echo "Proceeding to Step 3..." >> %LOG_FILE%
echo "Proceeding to Step 3..."

:: Step 3: Check for outdated dependencies
echo "--- START STEP 3A: Checking for outdated backend dependencies ---" >> %LOG_FILE%
echo "Step 3A - Checking for outdated backend dependencies..."
cd f:\Dev\eBaySalesTool\backend
Call npm outdated > f:\Dev\eBaySalesTool\scripts\npm_outdated_backend.log 2>> %LOG_FILE%
if %ERRORLEVEL% neq 0 (
    echo "Warning: NPM outdated check encountered an issue but continuing..." >> %LOG_FILE%
)
cd f:\Dev\eBaySalesTool\scripts
echo "--- END STEP 3A ---" >> %LOG_FILE%

echo "--- START STEP 3B: Checking for outdated frontend dependencies ---" >> %LOG_FILE%
echo "Step 3B - Checking for outdated frontend dependencies..."
cd f:\Dev\eBaySalesTool\frontend
Call npm outdated > f:\Dev\eBaySalesTool\scripts\npm_outdated_frontend.log 2>> %LOG_FILE%
if %ERRORLEVEL% neq 0 (
    echo "Warning: NPM outdated check encountered an issue but continuing..." >> %LOG_FILE%
)
cd f:\Dev\eBaySalesTool\scripts
echo "--- END STEP 3B ---" >> %LOG_FILE%

:: Step 4: Log warnings about deprecated packages and vulnerabilities
echo "--- START STEP 4: Logging warnings about deprecated packages and vulnerabilities ---" >> %LOG_FILE%
echo "Step 4 - Logging warnings about deprecated packages and vulnerabilities..."
cd f:\Dev\eBaySalesTool\backend
Call npm audit >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Warning: Vulnerabilities detected in backend. Review the log for details." >> %LOG_FILE%
)
cd f:\Dev\eBaySalesTool\frontend
Call npm audit >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Warning: Vulnerabilities detected in frontend. Review the log for details." >> %LOG_FILE%
)
cd f:\Dev\eBaySalesTool\scripts
echo "--- END STEP 4 ---" >> %LOG_FILE%

:: Ensure the script explicitly continues after Step 4
if %ERRORLEVEL% neq 0 (
    echo "Warning: Issues detected during Step 4, but continuing..." >> %LOG_FILE%
    echo "Warning: Issues detected during Step 4, but continuing..."
)

:: Step 5: Clean up and install dependencies
echo "--- START STEP 5: Cleaning up and installing dependencies ---" >> %LOG_FILE%
echo "Step 5 - Cleaning up and installing dependencies..."

:: Navigate to backend and install dependencies
echo "Navigating to backend directory..." >> %LOG_FILE%
cd f:\Dev\eBaySalesTool\backend
if exist package.json (
    call npm install >> %LOG_FILE% 2>&1
    if %ERRORLEVEL% neq 0 (
        echo "Failed to install backend dependencies. Exiting..." >> %LOG_FILE%
        goto :error
    )
) else (
    echo "Error: backend/package.json not found. Exiting..." >> %LOG_FILE%
    goto :error
)

:: Navigate to frontend and install dependencies
echo "Navigating to frontend directory..." >> %LOG_FILE%
cd f:\Dev\eBaySalesTool\frontend
if exist package.json (
    call npm install >> %LOG_FILE% 2>&1
    if %ERRORLEVEL% neq 0 (
        echo "Failed to install frontend dependencies. Exiting..." >> %LOG_FILE%
        goto :error
    )
) else (
    echo "Error: frontend/package.json not found. Exiting..." >> %LOG_FILE%
    goto :error
)

:: Return to scripts directory
echo "Returning to scripts directory..." >> %LOG_FILE%
cd f:\Dev\eBaySalesTool\scripts
if not exist build_and_deploy.bat (
    echo "Error: scripts/build_and_deploy.bat not found. Exiting..." >> %LOG_FILE%
    goto :error
)
echo "--- END STEP 5 ---" >> %LOG_FILE%
goto :step6

:step6
:: Step 6: Continue with the build process
echo "--- START STEP 6: Cleaning up and installing dependencies ---" >> %LOG_FILE%
echo "Step 6 - Cleaning up and installing dependencies..."
cd f:\Dev\eBaySalesTool\scripts
call npm_cleanup_and_install.bat >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Failed to clean up and install npm dependencies. Exiting..." >> %LOG_FILE%
    goto :error
)
cd f:\Dev\eBaySalesTool
echo "--- END STEP 6 ---" >> %LOG_FILE%

:: Step 7: Build backend
echo "--- START STEP 7: Building backend ---" >> %LOG_FILE%
echo "Step 7 - Building backend..."
cd f:\Dev\eBaySalesTool\backend
if exist package.json (
    call npm run build >> %LOG_FILE% 2>&1
    if %ERRORLEVEL% neq 0 (
        echo "Failed to build backend. Exiting..." >> %LOG_FILE%
        goto :error
    )
) else (
    echo "Backend package.json not found. Exiting..." >> %LOG_FILE%
    goto :error
)
cd f:\Dev\eBaySalesTool
echo "--- END STEP 7 ---" >> %LOG_FILE%

:: Step 8: Build frontend
echo "--- START STEP 8: Building frontend ---" >> %LOG_FILE%
echo "Step 8 - Building frontend..."
cd f:\Dev\eBaySalesTool\frontend
if exist package.json (
    call npm install >> %LOG_FILE% 2>&1
    call npm run build >> %LOG_FILE% 2>&1
    if %ERRORLEVEL% neq 0 (
        echo "Failed to build frontend. Exiting..." >> %LOG_FILE%
        goto :error
    )
) else (
    echo "Frontend package.json not found. Exiting..." >> %LOG_FILE%
    goto :error
)
cd f:\Dev\eBaySalesTool
echo "--- END STEP 8 ---" >> %LOG_FILE%

:: Step 9: Build Docker images and restart containers
echo "--- START STEP 9: Building Docker images and restarting containers ---" >> %LOG_FILE%
echo "Step 9 - Building Docker images and restarting containers..."
if exist f:\Dev\eBaySalesTool\docker-compose.yml (
    call docker-compose down >> %LOG_FILE% 2>&1
    call docker-compose up --build -d >> %LOG_FILE% 2>&1
    if %ERRORLEVEL% neq 0 (
        echo "Failed to build Docker images and restart containers. Exiting..." >> %LOG_FILE%
        goto :error
    )
) else (
    echo "Docker configuration file not found in f:\Dev\eBaySalesTool. Exiting..." >> %LOG_FILE%
    goto :error
)
echo "--- END STEP 9 ---" >> %LOG_FILE%
goto :eof

:error
echo "An error occurred. Please check the log file for details." >> %LOG_FILE%
exit /b 1