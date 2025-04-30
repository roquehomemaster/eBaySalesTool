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

:: Add debugging output after each step to ensure visibility in the terminal
echo "Debug: Completed Step 1 - Checking for running Docker containers." >> %LOG_FILE%
echo "Debug: Completed Step 1 - Checking for running Docker containers."

:: Step 2: Verify npm cache
echo "Step 2 - NPM Cache Cleanup" >> %LOG_FILE%
echo "Step 2 - NPM Cache Cleanup"
Call npm cache verify >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Warning: NPM cache verification encountered an issue but continuing..." >> %LOG_FILE%
)

:: Add debugging output after each step to ensure visibility in the terminal
echo "Debug: Completed Step 2 - NPM Cache Cleanup." >> %LOG_FILE%
echo "Debug: Completed Step 2 - NPM Cache Cleanup."

:: Step 3: Check for outdated dependencies
echo "Step 3A - Checking for outdated backend dependencies..." >> %LOG_FILE%
echo "Step 3A - Checking for outdated backend dependencies..."
cd f:\Dev\eBaySalesTool\backend
Call npm outdated > f:\Dev\eBaySalesTool\scripts\npm_outdated_backend.log 2>> %LOG_FILE%
if %ERRORLEVEL% neq 0 (
    echo "Warning: NPM outdated check encountered an issue but continuing..." >> %LOG_FILE%
)
cd f:\Dev\eBaySalesTool\scripts

:: Add debugging output after each step to ensure visibility in the terminal
echo "Debug: Completed Step 3A - Checking for outdated backend dependencies." >> %LOG_FILE%
echo "Debug: Completed Step 3A - Checking for outdated backend dependencies."

echo "Step 3B - Checking for outdated frontend dependencies..." >> %LOG_FILE%
echo "Step 3B - Checking for outdated frontend dependencies..."
cd f:\Dev\eBaySalesTool\frontend
Call npm outdated > f:\Dev\eBaySalesTool\scripts\npm_outdated_frontend.log 2>> %LOG_FILE%
if %ERRORLEVEL% neq 0 (
    echo "Warning: NPM outdated check encountered an issue but continuing..." >> %LOG_FILE%
)
cd f:\Dev\eBaySalesTool\scripts

:: Add debugging output after each step to ensure visibility in the terminal
echo "Debug: Completed Step 3B - Checking for outdated frontend dependencies." >> %LOG_FILE%
echo "Debug: Completed Step 3B - Checking for outdated frontend dependencies."

:: Step 4: Log warnings about deprecated packages and vulnerabilities
echo "Step 4 - Logging warnings about deprecated packages and vulnerabilities..." >> %LOG_FILE%
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

:: Add debugging output after each step to ensure visibility in the terminal
echo "Debug: Completed Step 4 - Logging warnings about deprecated packages and vulnerabilities." >> %LOG_FILE%
echo "Debug: Completed Step 4 - Logging warnings about deprecated packages and vulnerabilities."

:: Add error checks to ensure the script does not exit silently
if %ERRORLEVEL% neq 0 (
    echo "Error encountered during Step 4. Exiting..." >> %LOG_FILE%
    echo "Error encountered during Step 4. Exiting..."
    exit /b %ERRORLEVEL%
)

:: Step 5: Install dependencies for backend and frontend
:: Add debugging output for Step 5 and beyond
echo "Debug: Starting Step 5 - Installing dependencies for backend and frontend." >> %LOG_FILE%
echo "Debug: Starting Step 5 - Installing dependencies for backend and frontend."

echo "Step 5 - Installing dependencies for backend and frontend..." >> %LOG_FILE%
cd f:\Dev\eBaySalesTool\backend
if not exist package.json (
    echo "Error: backend/package.json not found. Exiting..." >> %LOG_FILE%
    exit /b 1
)
call npm install >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Failed to install backend dependencies. Exiting..." >> %LOG_FILE%
    exit /b %ERRORLEVEL%
)
cd f:\Dev\eBaySalesTool\frontend
if not exist package.json (
    echo "Error: frontend/package.json not found. Exiting..." >> %LOG_FILE%
    exit /b 1
)
call npm install >> %LOG_FILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Failed to install frontend dependencies. Exiting..." >> %LOG_FILE%
    exit /b %ERRORLEVEL%
)
cd f:\Dev\eBaySalesTool\scripts

:: Step 6: Build backend
:: Add debugging output for Step 6
echo "Debug: Starting Step 6 - Building backend." >> %LOG_FILE%
echo "Debug: Starting Step 6 - Building backend."

echo "Step 6 - Building backend..." >> %LOG_FILE%
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
:: Add debugging output for Step 7
echo "Debug: Starting Step 7 - Building frontend." >> %LOG_FILE%
echo "Debug: Starting Step 7 - Building frontend."

echo "Step 7 - Building frontend..." >> %LOG_FILE%
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
:: Add debugging output for Step 8
echo "Debug: Starting Step 8 - Building Docker images and restarting containers." >> %LOG_FILE%
echo "Debug: Starting Step 8 - Building Docker images and restarting containers."

echo "Step 8 - Building Docker images and restarting containers..." >> %LOG_FILE%
cd f:\Dev\eBaySalesTool
if exist f:\Dev\eBaySalesTool\docker-compose.yml (
    call docker-compose down >> %LOG_FILE% 2>&1
    call docker-compose up --build -d >> %LOG_FILE% 2>&1
    if %ERRORLEVEL% neq 0 (
        echo "Failed to build Docker images and restart containers. Exiting..." >> %LOG_FILE%
        exit /b %ERRORLEVEL%
    )
) else (
    echo "Docker configuration file not found. Exiting..." >> %LOG_FILE%
    exit /b 1
)

echo "Build and deploy process completed successfully." >> %LOG_FILE%
exit /b 0