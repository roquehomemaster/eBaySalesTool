## Build and Deployment Process

### Overview
The project uses a unified build and deployment script (`build_and_deploy.bat`) to streamline the development workflow. This script combines npm dependency management and Docker image builds into a single process, ensuring that all changes are incorporated into the running Docker containers for testing and review.

### Steps in the Build Process
1. **Clean Up and Install npm Dependencies**:
   - The script calls `npm_cleanup_and_install.bat` to:
     - Remove existing `node_modules` directories.
     - Reinstall npm dependencies for both the backend and frontend.

2. **Build Docker Images and Restart Containers**:
   - The script calls `docker_build.bat` to:
     - Build Docker images for the backend, frontend, and database.
     - Restart the Docker containers with the updated images.

3. **Confirm Deployment Success**:
   - The script outputs a success message if all tasks are completed without errors.

### How to Run the Build Script
1. Open a terminal in the `scripts` directory.
2. Run the following command:
   ```cmd
   .\build_and_deploy.bat
   ```

### Key Scripts
- **`build_and_deploy.bat`**:
  - Unified script for building and deploying the project.
- **`npm_cleanup_and_install.bat`**:
  - Handles npm dependency cleanup and installation.
- **`docker_build.bat`**:
  - Builds Docker images and restarts containers.

### Important Development Note

- **Windows Environment**: Always use `&` instead of `&&` for chaining commands in batch files or PowerShell scripts. This is critical for compatibility in Windows environments.
- **Docker Workflow**: Always run the `build_and_deploy.bat` script for building and deploying the application. This ensures consistency and avoids issues caused by manual steps.

### Notes
- Ensure Docker Desktop is running before executing the script.
- The `build_and_deploy.bat` script uses absolute paths to reference other scripts to avoid path-related issues.
- Any changes made to the frontend or backend code will be incorporated into the running containers after running this script.

### Troubleshooting
- If the script fails, check the following:
  1. Ensure Docker Desktop is running.
  2. Verify that the `npm_cleanup_and_install.bat` and `docker_build.bat` scripts exist in the `scripts` directory.
  3. Review the terminal output for specific error messages.

### Networking Debugging Steps

To verify and resolve networking issues in the Dockerized environment, follow these steps:

1. **Inspect the Custom Network**:
   - Check if the `app_network` exists and if all services (`frontend`, `backend`, and `database`) are connected:
     ```cmd
     docker network inspect app_network
     ```

2. **Test Backend Accessibility**:
   - From the `frontend` container, test the `/api/items` endpoint to ensure the `backend` service is reachable:
     ```cmd
     docker exec -it ebaysalestool-frontend-1 curl http://backend:5000/api/items
     ```

3. **Test Database Accessibility**:
   - From the `backend` container, test the connection to the `database` service:
     ```cmd
     docker exec -it ebaysalestool-backend-1 mongo --host database --eval "db.stats()"
     ```

4. **Restart the Containers**:
   - Restart all containers to ensure they are properly connected to the `app_network`:
     ```cmd
     docker-compose down
     docker-compose up --build
     ```

5. **Recreate the Network**:
   - If the `app_network` is missing, recreate it and reattach the services:
     ```cmd
     docker network create app_network
     docker network connect app_network ebaysalestool-frontend-1
     docker network connect app_network ebaysalestool-backend-1
     docker network connect app_network mongodb
     ```

### Development Ethos

As a developer, it is critical to:

1. **Verify Every Change**:
   - Ensure that every change is thoroughly tested and verified before implementation.
   - Double-check compatibility with the entire application to avoid introducing new issues.

2. **Think Holistically**:
   - Consider how each change impacts the entire system, including frontend, backend, database, and deployment workflows.
   - Avoid focusing solely on micro-details without understanding the broader context.

3. **Communicate Clearly**:
   - Provide clear, concise, and actionable explanations for every change or recommendation.
   - Ensure that all stakeholders understand the reasoning and implications of each decision.

4. **Test Holistically**:
   - Test changes across all relevant components to ensure seamless integration.
   - Simulate real-world scenarios to validate functionality and performance.

5. **Learn from Feedback**:
   - Actively listen to feedback and use it to improve processes and outcomes.
   - Strive for continuous improvement by addressing past mistakes and avoiding repeated errors.

This ethos should guide all development efforts to ensure high-quality, reliable, and maintainable software.