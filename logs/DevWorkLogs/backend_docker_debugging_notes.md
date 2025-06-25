# eBaySalesTool Backend Docker Debugging Notes

## Summary of Issues and Resolutions (as of 2025-05-20)

### Issues Encountered
- Backend container failed to start due to:
  - `MODULE_NOT_FOUND` errors (e.g., missing winston)
  - `ReferenceError: Cannot access 'logger' before initialization`
  - Volume mount in `docker-compose.yml` overwriting container `node_modules`
  - Diagnostic and test log code left in production files

### Actions Taken
- Removed backend volume mount from `docker-compose.yml` to prevent overwriting dependencies
- Added missing dependencies (e.g., winston) to `backend/package.json`
- Deleted duplicate/misplaced `backend/backend/package.json`
- Refactored logger initialization and removed all diagnostic/test log code from `backend/src/app.js`
- Cleaned up all instrumentation and test scripts from backend and utils
- Created dedicated instrumentation helpers:
  - `backend/src/utils/backendInstrumentation.js` for backend/database diagnostics
  - `frontend/src/frontendInstrumentation.js` for frontend diagnostics
- Rebuilt Docker images with `--no-cache` and confirmed clean startup

### Best Practices Going Forward
- Place all future instrumentation, diagnostics, and test code in the respective helpers, not in production code
- Reference or import helpers only when needed for debugging
- Keep main codebase clean for production and maintainability

### Instrumentation Helpers
- See `backend/src/utils/backendInstrumentation.js` and `frontend/src/frontendInstrumentation.js` for reusable diagnostic code

---
_Last updated: 2025-05-20_
