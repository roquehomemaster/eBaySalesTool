@echo off
REM build_ui.bat - Official SOP script to rebuild ONLY the frontend (UI) Docker image and restart its container.
REM Do NOT use this script for backend or database changes. Use backend\scripts\run_build.bat for backend.

setlocal ENABLEDELAYEDEXPANSION
SET SCRIPT_DIR=%~dp0
PUSHD %SCRIPT_DIR%..\

ECHO [UI BUILD] Starting frontend rebuild at %DATE% %TIME%...

REM Basic sanity check: docker compose file exists
IF NOT EXIST docker-compose.yml (
  ECHO [UI BUILD][ERROR] docker-compose.yml not found in repo root.
  EXIT /B 1
)

REM Build only the frontend service image
echo [UI BUILD] Building frontend service image...
docker compose build frontend
IF ERRORLEVEL 1 (
  ECHO [UI BUILD][ERROR] Frontend image build failed.
  EXIT /B 1
)

REM Restart only the frontend container
echo [UI BUILD] Restarting frontend container...
docker compose up -d frontend
IF ERRORLEVEL 1 (
  ECHO [UI BUILD][ERROR] Failed to start frontend container.
  EXIT /B 1
)

REM (Optional) Show status of running containers (filtered)
echo [UI BUILD] Container status:
docker compose ps --status=running

echo [UI BUILD] Completed successfully at %DATE% %TIME%.
POPD
EXIT /B 0
