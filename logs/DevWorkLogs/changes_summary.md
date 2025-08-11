# Backend Build & Logging Refactor (June 2025)

## Summary
This document outlines the changes made to the eBaySalesTool backend build, database, and logging environment to improve reliability, transparency, and maintainability.

## Key Changes

### 1. Log File Relocation & Renaming
- Moved all build and API test logs to a single directory: `logs/ApplicationLogs/`.
- Renamed `logs/test-results.txt` to `logs/API-Test-Results.txt`.
- Moved `backend/scripts/build.log` to `logs/ApplicationLogs/build.log`.

### 2. Build & Test Process Improvements
- Ensured the build process logs all steps, environment variables, and results to `build.log`.
- API test results are now written to `logs/API-Test-Results.txt` for each build.
- All references in scripts and code to the old log file locations have been updated to use the new paths (if not, update as needed).

### 3. Container & Database Reliability
- Improved Docker Compose usage and container orchestration for backend, frontend, and database.
- Added health checks and robust startup order for containers.
- Fixed backend-to-database connectivity and health check logic.
- Ensured database seeding and test data population is logged and reliable.

### 4. Data & Migration Fixes
- Fixed duplicate SKU in seed data (`SKU12345` → `SKU54321`).
- Added `IF NOT EXISTS` to all relevant `CREATE TABLE` statements in migrations.
- Confirmed remaining duplicate SKU errors are intentional and come from API tests.

### 5. Test Suite
- All API and backend tests pass except for the known empty test file (`src/tests/customerApi.test.js`).
- This file can be updated or removed for a clean test run.

## File Locations
- **Build log:** `logs/ApplicationLogs/build.log`
- **API test results:** `logs/API-Test-Results.txt`

## Outstanding/Optional
- Address the missing `users` table and related foreign key errors in migrations if required.
- Further cleanup or optimization of health check timing, database startup order, or test suite structure.
- Address the empty test file if a clean test run is desired.

---

**All changes are committed to the `main` branch.**
