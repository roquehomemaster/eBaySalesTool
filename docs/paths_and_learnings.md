# Paths and Learnings for `ListFlowHQ`

## Key Paths
1. **SQL Scripts**:
   - `database/migrations/01_init.sql`
   - `database/migrations/02_sampleData.sql`
   - `database/migrations/07_create_ownerships_table.sql`

2. **Docker Compose Files**:
   - `docker-compose.yml`
   - `docker-compose.minimal.yml`
   - `backend/docker-compose.yml`

3. **Scripts**:
   - `backend/scripts/debug_database_setup.bat`
   - `backend/scripts/apply_migrations.js`
   - `backend/scripts/run_build.bat`

4. **Logs**:
   - `backend/logs/backend_container.log`
   - `logs/ownerships_resolution_log.txt`

---

## Learnings

### PostgreSQL Container Issues
1. **Health Check**:
   - The health check command (`pg_isready -U postgres`) fails when the database is not fully initialized.

2. **Initialization Scripts**:
   - SQL scripts in `database/migrations` must be validated for syntax and execution errors.

3. **Volume Management**:
   - The `listflowhq_db_data` volume must be correctly initialized and have proper permissions.

4. **Logs**:
   - Container logs are often empty, making debugging difficult. Enabling verbose logging in PostgreSQL is recommended.

### Build Process
1. **Environment Variables**:
   - Standardized `POSTGRES_USER=postgres` and `POSTGRES_PASSWORD=securepassword` across all configurations.

2. **Rebuild Attempts**:
   - Rebuilding the Docker environment does not resolve the issue if the root cause is not addressed.

3. **Manual Debugging**:
   - Starting the PostgreSQL container interactively can help isolate issues.

### Recommendations
1. **Documentation**:
   - Maintain detailed documentation of changes and observations to avoid repeating steps.

2. **Collaboration**:
   - Engage a PostgreSQL expert for advanced debugging and configuration.

3. **Testing**:
   - Test SQL scripts and migrations in isolation before integrating them into the build process.

---

This document serves as a reference for paths and learnings in the `ListFlowHQ` project. It should be updated as new insights are gained.
