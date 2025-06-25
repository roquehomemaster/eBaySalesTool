# eBay Sales Tool

## Development Environment
This project is developed and tested on a Windows 11 machine using WSL2 to run Docker containers. All Docker-based services (backend, database, frontend) are built and executed within the WSL2 environment. This setup may affect file paths, volume mounts, and networking behavior compared to native Linux or macOS environments.

## Project Overview
The eBay Sales Tool is a full-stack web application designed to assist users in managing eBay sales, tracking items, and conducting product research. It includes a backend API, a frontend user interface, and a database for storing sales and product data.

## Features
- **Backend**: Built with Node.js and Express, providing RESTful APIs for managing sales, items, and ownership.
- **Frontend**: Developed with React, offering a user-friendly interface for data entry, sales tracking, and product research.
- **Database**: Uses MongoDB for storing sales and item data.
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

1. Navigate to the `backend/scripts` directory.
2. Run the `run_build.bat` script:
   ```
   backend\scripts\run_build.bat
   ```
3. After the script completes, verify the `build.log` file for any errors or warnings.
4. Ensure all containers are healthy and the database is seeded successfully (if enabled).
5. Test the application to confirm functionality.

**Note:**
- API tests and database seeding are both controlled by configuration flags in `backend/build.json` (see below). The Node.js build script handles these steps and logs the results in `backend/scripts/build.log`.
- API test results are written to `logs/test-results.txt`.
- The build will fail if any test fails or if any test suite is empty.
- The `run_build.bat` script in `backend/scripts` is the official and only supported build script.
- Any other build scripts or folders (e.g., `build/scripts`) are deprecated and should not be used.

## Build Configuration Flags

The following flags in `backend/build.json` control build-time testing and seeding:

```
  "runApiTests": true,
  "testdata": true
```
- If `runApiTests` is `true`, API tests are executed automatically during the build and results are saved to `logs/test-results.txt`. If `false`, API tests are skipped.
- If `testdata` is `true`, the database is truncated and seeded with test data during the build. If `false`, seeding is skipped.

You can change these flags to enable or disable API test execution and database seeding as needed. All actions and their results are logged in `backend/scripts/build.log`.

## API Test Configuration

The execution of backend API tests during the build is controlled by the `runApiTests` flag in `backend/build.json`:

```
  "runApiTests": true
```
- If `true`, API tests are executed automatically during the build and results are saved to `logs/test-results.txt`.
- If `false`, API tests are skipped.

You can change this flag to enable or disable API test execution as needed.

## Instrumentation and Diagnostics

As of May 2025, all backend, database, and frontend instrumentation, diagnostics, and test code should be placed in dedicated helpers:
- `backend/src/utils/backendInstrumentation.js` (backend/database)
- `frontend/src/frontendInstrumentation.js` (frontend)

This keeps the production codebase clean and makes it easy to enable/disable diagnostics as needed. See the helpers for usage examples.

For details on past issues and resolutions, see `logs/backend_docker_debugging_notes.md` and `logs/mount-issue.log`.

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