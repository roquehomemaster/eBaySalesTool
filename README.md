# eBay Sales Tool

## Development Environment
This project is developed and tested on a Windows 11 machine using WSL2 to run Docker containers. All Docker-based services (backend, database, frontend) are built and executed within the WSL2 environment. This setup may affect file paths, volume mounts, and networking behavior compared to native Linux or macOS environments.

## Project Overview
The eBay Sales Tool is a full-stack web application designed to assist users in managing eBay sales, tracking eBay listings, and maintaining a growing product catalog. It includes a backend API, a frontend user interface, and a database for storing sales, catalog, and listing data.

## Data Model Overview


**Catalog**: The master list of all products ever tracked, regardless of whether they were ever listed on eBay. This table grows over time and serves as a historical record of all products.

**Listing**: Tracks all eBay listings, past or present, regardless of their status (active, sold, ended, etc.). Each entry corresponds to an eBay listing. Not every catalog item must have a corresponding Listing, but every Listing should reference a product in the Catalog.

**HistoryLogs**: Records all changes to tracked entities (such as Listing, Customer, etc.) for auditing purposes. Each log entry includes the entity name, entity ID, action performed, details of the change, the user (by Ownership ID) who made the change, and the timestamp. This ensures all changes are auditable and attributable to a specific user.

## Features
- **Backend**: Built with Node.js and Express, providing RESTful APIs for managing sales, catalog, listings, and ownership.
- **Frontend**: Developed with React, offering a user-friendly interface for catalog management, sales tracking, and product research.
- **Database**: Uses PostgreSQL for storing sales, catalog, and listing data.
- **Dockerized**: Fully containerized setup for easy deployment and development.
- **Swagger Documentation**: API documentation available at `/api-docs`.

## Project Structure
```
backend/
  Dockerfile
  package.json
  src/
    app.js
    controllers/
    models/
    routes/
    templates/
frontend/
  Dockerfile
  package.json
  src/
    App.js
    components/
    context/
    services/
database/
  migrations/
  seeds/
scripts/
  docker_build.bat
  build_ui.bat
  npm_cleanup_and_install.bat
```

## Prerequisites
- **Node.js**: v16 or higher
- **Docker**: Installed and running
- **MongoDB**: Running instance or Dockerized

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd eBaySalesTool
   ```

2. Install dependencies:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. Start the application using Docker:
   ```bash
   .\scripts\docker_build.bat
   ```

4. Access the application:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## Build Instructions

### Standard Operating Procedure (SOP)
To build the project, follow these steps:

#### Backend/Database Build (includes migrations, API tests, and seeding)
1. Navigate to the `backend/scripts` directory.
2. Run the `run_build.bat` script:
   ```
   backend\scripts\run_build.bat
   ```
3. After the script completes, verify the `build.log` file for any errors or warnings.
4. Ensure all containers are healthy and the database is seeded successfully (if enabled).
5. Test the application to confirm functionality.

**Note:**
- The backend/database build and the frontend build are now independent. Use the appropriate script for each (see below).
- API tests and database seeding are both controlled by configuration flags in `backend/build.json` (see below). The Node.js build script handles these steps and logs the results in `backend/scripts/build.log`.
- API test results are written to `logs/API-Test-Results.txt`.
- The build will fail if any test fails or if any test suite is empty.
- The `run_build.bat` script in `backend/scripts` is the official and only supported backend build script.
- Any other build scripts or folders (e.g., `build/scripts`) are deprecated and should not be used.

#### Frontend (UI) Build Only
To rebuild and restart the frontend (UI only), without affecting the backend or database:
1. Make your code changes in `frontend/src/` or `frontend/public/`.
2. Run the UI build script:
   ```
   scripts\build_ui.bat
   ```
   This will rebuild the frontend Docker image and restart only the frontend container. Backend and database are untouched.
3. Visit [http://localhost:3000](http://localhost:3000) to view the production build.

## Build Configuration Flags

The following flags in `backend/build.json` control build-time testing and seeding:

```
  "runApiTests": true,
  "testdata": true
```
- If `runApiTests` is `true`, API tests are executed automatically during the build and results are saved to `logs/API-Test-Results.txt`. If `false`, API tests are skipped.
- If `testdata` is `true`, the database is truncated and seeded with test data after API tests complete. If `false`, seeding is skipped.

**Important:**
- As of June 2025, database seeding now occurs *after* API tests. This ensures the database is always left in a known, seeded state for development after the build completes.
- You can change these flags to enable or disable API test execution and database seeding as needed. All actions and their results are logged in `backend/scripts/build.log`.

## API Test Configuration

The execution of backend API tests during the build is controlled by the `runApiTests` flag in `backend/build.json`:

```
  "runApiTests": true
```
- If `true`, API tests are executed automatically during the build and results are saved to `logs/API-Test-Results.txt`. If `false`, API tests are skipped.

You can change this flag to enable or disable API test execution as needed.

## Instrumentation and Diagnostics

As of May 2025, all backend, database, and frontend instrumentation, diagnostics, and test code should be placed in dedicated helpers:
- `backend/src/utils/backendInstrumentation.js` (backend/database)
- `frontend/src/frontendInstrumentation.js` (frontend)

This keeps the production codebase clean and makes it easy to enable/disable diagnostics as needed. See the helpers for usage examples.

For details on past issues and resolutions, see `logs/backend_docker_debugging_notes.md` and `logs/mount-issue.log`.

## Troubleshooting: Database Connection Issues (June 2025)

### Problem
After refactoring the build and separating frontend/backend processes, repeated database connection errors (`ETIMEDOUT` and `ENOTFOUND`) occurred during the official build process. The backend build script was unable to connect to the database, causing the build to fail.

### Root Cause
- The database host was set to a static IP (`192.168.0.220`) in `backend/build.json` and related configs. This worked only in a specific network setup.
- When the host was changed to `postgres_db` (the Docker Compose service name), the build script failed with `ENOTFOUND postgres_db` when run from the Windows host, because `postgres_db` is only resolvable inside Docker containers.
- The build script was not distinguishing between running on the host (should use `localhost`) and running in a container (should use `postgres_db`).

### Solution
- Set the database host in `backend/build.json` to `localhost` for host-based scripts.
- In Docker Compose, set `PG_HOST=postgres_db` for backend containers.
- In backend code, use the environment variable if set (`process.env.PG_HOST`), otherwise fall back to the config file value. This ensures the correct host is used in all environments.

### Prevention
- Always use `localhost` for host-based scripts and the Docker Compose service name for container-to-container communication.
- Avoid hardcoding static IPs for Docker services unless absolutely necessary.
- Document the expected environment for each config value and ensure scripts are environment-aware.

## Contributing
1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Description of changes"
   ```
4. Push to your branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

## License
This project is licensed under the MIT License.