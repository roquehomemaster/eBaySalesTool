@echo off
REM Docker Environment Configuration

REM Database Configuration
set PG_HOST=postgres_db
set PG_PORT=5432
set PG_USER=postgres
set PG_DATABASE=listflowhq

REM Network Configuration
set NETWORK_SUBNET=192.168.0.0/24
set POSTGRES_DB_IP=192.168.0.220
set BACKEND_IP=192.168.0.221
set FRONTEND_IP=192.168.0.222

REM Paths
set BACKEND_PATH=f:/Dev/ListFlowHQ/backend
set FRONTEND_PATH=f:/Dev/ListFlowHQ/frontend
set BUILD_SCRIPTS_PATH=f:/Dev/ListFlowHQ/build/scripts
set BUILD_JSON_PATH=f:/Dev/ListFlowHQ/backend/build.json

REM Docker Compose File
set DOCKER_COMPOSE_FILE=f:/Dev/ListFlowHQ/docker-compose.yml
REM (Paths unchanged; repository folder name stays until repo rename. Branding handled in containers/package names.)

REM Test Data Flag
set TEST_DATA_FLAG=true
