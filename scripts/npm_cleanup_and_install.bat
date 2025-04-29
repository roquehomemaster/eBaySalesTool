@echo off

:: Navigate to the root directory of the project
cd /d %~dp0..

:: Step 1: Clear npm cache
echo Clearing npm cache...
call npm cache clean --force
if %ERRORLEVEL% neq 0 (
 v    echo Failed to clear npm cache. Logging error and continuing...
    echo "Failed to clear npm cache" >> ..\scripts\npm_cleanup.log
)

:: Step 2: Remove node_modules and package-lock.json in backend
echo Cleaning backend dependencies...
if exist backend\node_modules (
    echo Deleting backend\node_modules...
    rmdir /s /q backend\node_modules || (
        echo Failed to delete backend\node_modules. Retrying with elevated permissions...
        powershell -Command "Remove-Item -Recurse -Force backend\node_modules"
    )
    if exist backend\node_modules (
        echo Failed to delete backend\node_modules even with elevated permissions. Logging error and continuing...
        echo "Failed to delete backend\node_modules" >> ..\scripts\npm_cleanup.log
    )
)
if exist backend\package-lock.json (
    echo Deleting backend\package-lock.json...
    del /q backend\package-lock.json
    if %ERRORLEVEL% neq 0 (
        echo Failed to delete backend\package-lock.json. Logging error and continuing...
        echo "Failed to delete backend\package-lock.json" >> ..\scripts\npm_cleanup.log
    )
)

:: Step 3: Remove node_modules and package-lock.json in frontend
echo Cleaning frontend dependencies...
if exist frontend\node_modules (
    echo Deleting frontend\node_modules...
    rmdir /s /q frontend\node_modules || (
        echo Failed to delete frontend\node_modules. Retrying with elevated permissions...
        powershell -Command "Remove-Item -Recurse -Force frontend\node_modules"
    )
    if exist frontend\node_modules (
        echo Failed to delete frontend\node_modules even with elevated permissions. Logging error and continuing...
        echo "Failed to delete frontend\node_modules" >> ..\scripts\npm_cleanup.log
    )
)
if exist frontend\package-lock.json (
    echo Deleting frontend\package-lock.json...
    del /q frontend\package-lock.json
    if %ERRORLEVEL% neq 0 (
        echo Failed to delete frontend\package-lock.json. Logging error and continuing...
        echo "Failed to delete frontend\package-lock.json" >> ..\scripts\npm_cleanup.log
    )
)

:: Step 4: Install dependencies for backend
cd backend
echo Installing backend dependencies...
call npm install --force
if %ERRORLEVEL% neq 0 (
    echo "Failed to install backend dependencies. Logging error and continuing..."
    echo "Failed to install backend dependencies" >> ..\scripts\npm_cleanup.log
)

:: Step 5: Check outdated dependencies in backend
echo Checking outdated dependencies in backend...
call npm outdated > ..\scripts\npm_outdated_backend.log 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Failed to check outdated dependencies in backend. Logging error and continuing..."
    echo "Failed to check outdated dependencies in backend" >> ..\scripts\npm_cleanup.log
)
call npm update --force
if %ERRORLEVEL% neq 0 (
    echo "Failed to update dependencies in backend. Logging error and continuing..."
    echo "Failed to update dependencies in backend" >> ..\scripts\npm_cleanup.log
)
cd ..

:: Step 6: Install dependencies for frontend
cd frontend
echo Installing frontend dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo "Failed to install frontend dependencies. Logging error and continuing..."
    echo "Failed to install frontend dependencies" >> ..\scripts\npm_cleanup.log
)
cd ..

:: Step 7: Check outdated dependencies in frontend
echo Checking outdated dependencies in frontend...
call npm outdated > ..\scripts\npm_outdated_frontend.log 2>&1
if %ERRORLEVEL% neq 0 (
    echo "Failed to check outdated dependencies in frontend. Logging error and continuing..."
    echo "Failed to check outdated dependencies in frontend" >> ..\scripts\npm_cleanup.log
)
call npm update --force
if %ERRORLEVEL% neq 0 (
    echo "Failed to update dependencies in frontend. Logging error and continuing..."
    echo "Failed to update dependencies in frontend" >> ..\scripts\npm_cleanup.log
)
cd ..

:: Step 8: Build backend (if applicable)
echo Building backend...
cd backend
if exist package.json (
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo Failed to build backend. Logging error and continuing...
        echo "Failed to build backend" >> ..\scripts\npm_cleanup.log
    )
) else (
    echo "Backend package.json not found. Skipping backend build." >> ..\scripts\npm_cleanup.log
)
cd ..

:: Step 9: Build frontend
echo Building frontend...
cd frontend
if exist package.json (
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo Failed to build frontend. Logging error and continuing...
        echo "Failed to build frontend" >> ..\scripts\npm_cleanup.log
    )
) else (
    echo "Frontend package.json not found. Skipping frontend build." >> ..\scripts\npm_cleanup.log
)
cd ..

:: Step 10: Build Docker images and restart containers
echo "Step 6 - Building Docker images and restarting containers..."
if exist docker-compose.yml (
    call docker-compose down
    call docker-compose up --build -d
    if %ERRORLEVEL% neq 0 (
        echo "Failed to build Docker images and restart containers. Logging error and continuing..."
        echo "Failed to build Docker images and restart containers" >> ..\scripts\npm_cleanup.log
    )
) else (
    echo "Docker configuration file not found. Skipping Docker build." >> ..\scripts\npm_cleanup.log
)

:: Done
echo All tasks completed. Check npm_cleanup.log for any errors.