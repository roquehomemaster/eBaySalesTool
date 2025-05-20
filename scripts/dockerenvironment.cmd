@echo off
REM Docker Environment Configuration

REM Database Configuration
set PG_HOST=192.168.0.220
set PG_PORT=5432
set PG_USER=postgres
set PG_DATABASE=ebay_sales_tool

REM Network Configuration
set NETWORK_SUBNET=192.168.1.0/24
set POSTGRES_DB_IP=192.168.1.2
set BACKEND_IP=192.168.1.3
set FRONTEND_IP=192.168.1.4

REM Paths
set BACKEND_PATH=f:/Dev/eBaySalesTool/backend
set FRONTEND_PATH=f:/Dev/eBaySalesTool/frontend
set BUILD_SCRIPTS_PATH=f:/Dev/eBaySalesTool/build/scripts
set BUILD_JSON_PATH=f:/Dev/eBaySalesTool/backend/build.json

REM Docker Compose File
set DOCKER_COMPOSE_FILE=f:/Dev/eBaySalesTool/docker-compose.yml

REM Test Data Flag
set TEST_DATA_FLAG=true
