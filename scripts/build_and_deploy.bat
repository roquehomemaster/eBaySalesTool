@echo off

:: Define a single log file for the entire build process
set LOG_FILE=f:\Dev\eBaySalesTool\scripts\build_and_deploy.log

:: Clear the log file at the start of the process
echo Clearing previous log... > %LOG_FILE%

:: Read build configuration
node scripts\readBuildConfig.js

:: Set environment variables
set ENVIRONMENT=%BUILD_ENVIRONMENT%
set TESTDATA=%BUILD_TESTDATA%
set BACKEND_BUILD=%BUILD_BACKEND%
set FRONTEND_BUILD=%BUILD_FRONTEND%
set DOCKER_USE_COMPOSE=%DOCKER_USE_COMPOSE%
set DOCKER_COMPOSE_FILE=%DOCKER_COMPOSE_FILE%

:: Step 1: Set testdata flag
if "%TESTDATA%"=="true" (
    echo Seeding database with test data...
    node scripts\seedDatabase.js
) else (
    echo Skipping database seeding.
)

:: Step 2: Build backend and frontend
if "%BACKEND_BUILD%"=="true" (
    echo Building backend...
    call npm_services_build.bat backend
)
if "%FRONTEND_BUILD%"=="true" (
    echo Building frontend...
    call npm_services_build.bat frontend
)

:: Step 3: Start Docker containers
if "%DOCKER_USE_COMPOSE%"=="true" (
    echo Starting Docker containers...
    docker-compose -f %DOCKER_COMPOSE_FILE% up --build -d
)

:: Step 4: Finalize deployment
echo Build and deploy process completed.

echo "Build and deploy process completed successfully." >> %LOG_FILE%
exit /b 0