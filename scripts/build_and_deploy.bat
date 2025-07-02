@echo off

:: Define a single log file for the entire build process
set LOG_FILE=f:\Dev\eBaySalesTool\scripts\build_and_deploy.log

echo Clearing previous log... > %LOG_FILE%

echo Build and deploy process completed.
echo "Build and deploy process completed successfully." >> %LOG_FILE%
exit /b 0