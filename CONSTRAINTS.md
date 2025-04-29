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