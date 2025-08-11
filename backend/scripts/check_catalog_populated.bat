@echo off
REM Check if the Catalog table is populated after seeding
REM This assumes psql is available in the backend container and the table is named "Catalog"
docker exec -i postgres_db psql -U postgres -d ebay_sales_tool -c "SELECT COUNT(*) FROM \"Catalog\";" > temp_catalog_count.txt
for /f "tokens=2 delims=|" %%a in ('findstr /c:"count" temp_catalog_count.txt') do set CATALOG_COUNT=%%a
set CATALOG_COUNT=%CATALOG_COUNT: =%
if "%CATALOG_COUNT%"=="0" (
    echo Error: Catalog table is empty after seeding!>> f:\Dev\eBaySalesTool\backend\scripts\build.log
    echo Error: Catalog table is empty after seeding!
    exit /b 1
) else (
    echo Catalog table contains %CATALOG_COUNT% records after seeding.>> f:\Dev\eBaySalesTool\backend\scripts\build.log
    echo Catalog table contains %CATALOG_COUNT% records after seeding.
)
del temp_catalog_count.txt
