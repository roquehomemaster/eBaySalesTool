# Project Constraints and Guidelines

## Key Constraints
1. **Avoid Running `npm install` in the Root Directory**
   - Always navigate to the `backend` or `frontend` directories before running `npm install`.

2. **Avoid Using `&&` in Batch Scripts**
   - Use sequential commands instead to ensure compatibility with all systems.

3. **Validate Working Directory**
   - Ensure the current working directory is correct before executing commands.

4. **Centralize Dependency Management**
   - Use `npm install` only in the `backend` and `frontend` directories to avoid conflicts.

## Guidelines for AI Assistance
- Always reference this file before making changes.
- Break down tasks into smaller, verifiable steps.
- Test changes incrementally to ensure they work as expected.
- **Avoid Using `&&` in Batch Scripts or Commands**: Use sequential commands instead to ensure compatibility with all systems.

## Known Issues
- Node.js and `npm` must be properly configured in the system PATH.
- Docker build context must include all required files (e.g., `project-config.json`).

## Maintaining AI Context and State

To ensure effective collaboration and avoid repeated mistakes, the following practices will be followed:

1. **Document Key Constraints and Guidelines**:
   - All critical constraints, such as avoiding `npm install` in the root directory, will be documented here.

2. **Update Notes Dynamically**:
   - As new issues or constraints arise, they will be added to this file or other relevant documentation.

3. **Reference Notes Regularly**:
   - Before making changes, I will review this file to ensure compliance with documented constraints.

4. **Persist Critical Context**:
   - If specific preferences or constraints need to be retained across sessions, they will be explicitly documented here.

5. **Iterative Improvement**:
   - Feedback and corrections will be incorporated into this file to improve future interactions.

## Additional Guidelines for Scripts

- **Use Fully Qualified Paths**:
  - Always use fully qualified paths instead of relative paths (e.g., `cd f:\Dev\eBaySalesTool\backend` instead of `cd ../backend`).
  - This ensures clarity, avoids potential directory context issues, and improves script reliability across different environments.

## Guidelines for Code Changes

1. **Preserve Critical Functionality**:
   - Do not remove or alter critical parts of the codebase (e.g., Docker build steps, backend/frontend builds) without explicit approval.

2. **Follow Instructions**:
   - Only make changes that are explicitly requested or necessary to resolve issues.

3. **Provide Justification**:
   - Include a clear justification for all changes in commit messages or comments.

4. **Test Incrementally**:
   - Test changes incrementally to ensure they work as expected and do not introduce new issues.

5. **Communicate Clearly**:
   - Clearly explain all changes made to the codebase to ensure transparency.

## Critical Code Sections
- **Docker Build and Deployment**:
  - Ensure `docker-compose up --build -d` is included in the build and deploy process.
- **Backend and Frontend Builds**:
  - Ensure `npm run build` is executed for both backend and frontend during the build process.

## Build Configuration

- The `build.json` file is now consolidated and located at `backend/build.json`.
- All scripts and configurations must reference this file to ensure consistency.

### Important Note:
- Do not create duplicate files unless explicitly justified and approved. The complications and maintenance overhead can become too great. Ensure all configurations and scripts reference a single source of truth wherever possible.

### Note:
Ensure that no other `build.json` files are created or used in the project to avoid redundancy and confusion.

## Development Guidelines

1. **No Refactoring Without Request**:
   - Do not refactor code logic or the codebase unless explicitly requested.
   - Focus on fixing bugs and creating new pages as instructed.

2. **Preserve Existing Functionality**:
   - Ensure that all existing functionality remains intact when making changes.

3. **Follow Explicit Instructions**:
   - Only make changes that are explicitly requested.

4. **Document All Changes**:
   - Clearly document any changes made to the codebase, including bug fixes and new features.

5. **Test Thoroughly**:
   - Test all changes to ensure they work as expected and do not introduce new issues.

## Networking Information

- **Router**: 192.168.0.1
- **Database**: 192.168.0.220
- **Backend**: 192.168.0.221
- **Frontend**: 192.168.0.222

### Note:
This networking information is critical and must not be removed or altered without explicit approval.