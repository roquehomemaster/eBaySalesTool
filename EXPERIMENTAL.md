# Standard Operating Procedure (SOP) for Code Comments

## Code Commenting SOP

1. **All scripts, especially build, migration, and merge scripts, must include clear comments at the top explaining their purpose, usage, and any ordering or dependency requirements.**
2. **Any non-trivial logic, edge case handling, or error catching must be explained with inline comments.**
3. **If a script is part of a multi-step process (e.g., Swagger merge before backend start), this must be documented in the comments.**
4. **If a script uses synchronous or asynchronous file operations, the reason and any implications for build order must be commented.**
5. **Manual edits to generated files (like swagger.json) are discouraged and this should be stated in the comments.**
6. **All new scripts and major changes must be reviewed for adequate commenting before merging.**

> "Commenting code is not optional. It is a required part of our SOP to ensure maintainability, onboarding, and robust automation."

# Experimental Code and Scripts Policy

**Practice:**
- Any experimental code, scripts, or configuration changes must be clearly marked as `EXPERIMENTAL` in filenames, comments, and documentation.
- Experimental scripts should not be used in production workflows or referenced in official documentation/logs unless promoted to stable after review.
- All experimental work must be documented in this section, including:
  - **Purpose:** Why the experiment is needed and why it goes outside the normal process.
  - **Logic:** The approach, logic, or technical method being tested.
  - **Intended Goals:** What the experiment aims to prove, solve, or improve.
  - **Status:** Current status (active, deprecated, promoted, etc.).

---

## Example: `scripts/docker_build.bat`
- **Status:** EXPERIMENTAL
- **Purpose:** To rapidly test Docker build and restart behavior without the full migration/seeding/healthcheck process. This is needed to isolate and debug issues with container lifecycle and static file serving, which may be masked by the more complex official build process.
- **Logic:** The script prunes or brings down all containers and volumes, then runs a fresh `docker compose up -d --build`. It omits migrations and health checks to focus solely on image/container state and static file serving.
- **Intended Goals:**
  - Determine if stale frontend code is due to Docker image/container caching or volume issues.
  - Provide a minimal, fast feedback loop for frontend build/deployment experiments.
- **Official build process:** Use `backend/scripts/run_build.bat` for all production and standard development workflows.

_Last updated: June 25, 2025_
