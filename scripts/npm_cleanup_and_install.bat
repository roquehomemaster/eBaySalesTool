@echo off

:: Navigate to the root directory of the project
cd /d %~dp0..

:: Clear npm cache
echo Clearing npm cache...
call npm cache clean --force
if %ERRORLEVEL% neq 0 (
    echo Failed to clear npm cache. Exiting...
    exit /b %ERRORLEVEL%
)

:: Remove node_modules and package-lock.json in backend
echo Cleaning backend dependencies...
if exist backend\node_modules (
    echo Deleting backend\node_modules...
    rmdir /s /q backend\node_modules || (
        echo Failed to delete backend\node_modules. Retrying with elevated permissions...
        powershell -Command "Remove-Item -Recurse -Force backend\node_modules"
    )
    if exist backend\node_modules (
        echo Failed to delete backend\node_modules even with elevated permissions. Exiting...
        exit /b 1
    )
)
if exist backend\package-lock.json (
    echo Deleting backend\package-lock.json...
    del /q backend\package-lock.json
    if %ERRORLEVEL% neq 0 (
        echo Failed to delete backend\package-lock.json. Exiting...
        exit /b %ERRORLEVEL%
    )
)

:: Remove node_modules and package-lock.json in frontend
echo Cleaning frontend dependencies...
if exist frontend\node_modules (
    echo Deleting frontend\node_modules...
    rmdir /s /q frontend\node_modules || (
        echo Failed to delete frontend\node_modules. Retrying with elevated permissions...
        powershell -Command "Remove-Item -Recurse -Force frontend\node_modules"
    )
    if exist frontend\node_modules (
        echo Failed to delete frontend\node_modules even with elevated permissions. Exiting...
        exit /b 1
    )
)
if exist frontend\package-lock.json (
    echo Deleting frontend\package-lock.json...
    del /q frontend\package-lock.json
    if %ERRORLEVEL% neq 0 (
        echo Failed to delete frontend\package-lock.json. Exiting...
        exit /b %ERRORLEVEL%
    )
)

:: Install dependencies for backend
echo Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo Failed to install backend dependencies. Exiting...
    exit /b %ERRORLEVEL%
)
cd ..

:: Install dependencies for frontend
echo Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo Failed to install frontend dependencies. Exiting...
    exit /b %ERRORLEVEL%
)
cd ..

:: Set NODE_OPTIONS to use OpenSSL legacy provider
echo Setting NODE_OPTIONS for OpenSSL legacy provider...
set NODE_OPTIONS=--openssl-legacy-provider

:: Build backend (if applicable)
echo Building backend...
cd backend
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Failed to build backend. Exiting...
    exit /b %ERRORLEVEL%
)
cd ..

:: Build frontend
echo Building frontend...
cd frontend
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Failed to build frontend. Exiting...
    exit /b %ERRORLEVEL%
)
cd ..

:: Done
echo All tasks completed successfully.