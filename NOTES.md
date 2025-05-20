## Environment Setup Notes

### Operating System
- **Host OS**: Windows 11
- **WSL 2**: Ubuntu installed and configured as the backend for Docker Desktop.

### Docker Configuration
- Docker Desktop is configured to use the WSL 2 backend.
- Ensure that the `f:\` drive is accessible in WSL under `/mnt/f`.

### Key Points
- File sharing is handled via WSL 2, and paths like `f:\Dev\eBaySalesTool` are accessible as `/mnt/f/Dev/eBaySalesTool` in WSL.
- Volume mounts in `docker-compose.yml` should use WSL-compatible paths (e.g., `/mnt/f/...`).

### Troubleshooting
- If encountering mount path issues, verify WSL integration and ensure the `f:\` drive is mounted in WSL.
- Restart Docker Desktop if necessary to clear locked resources.

## Build Log Behavior

- The `build.log` file is erased at the start of each build execution.
- It only contains logs from the most recent execution of the build process.
- This ensures that the log file remains concise and relevant for debugging the latest build.

### Note:
If historical logs are required, consider archiving the `build.log` file before it is cleared.

---

# Key Takeaways from May 14, 2025 Conversation

## Issues Identified:
1. **Deviation from Documentation**:
   - Changes were made without fully aligning with the documented process or discussing deviations.

2. **Lack of Accountability**:
   - Documentation and logs were not consistently updated to reflect changes and decisions.

3. **Breaking Existing Functionality**:
   - Regressions were introduced by making changes without fully understanding their impact.

4. **Failure to Learn from Mistakes**:
   - Repeated errors occurred instead of addressing root causes and improving the approach.

---

## Commitments Moving Forward:
1. **Strict Adherence to Documentation**:
   - Follow the documented process and constraints without deviation.
   - Discuss any necessary deviations and update the documentation accordingly.

2. **Incremental Progress**:
   - Make small, verifiable changes and validate each step before proceeding.

3. **Accountability**:
   - Update the documentation and logs after every change to ensure transparency and alignment.

4. **Root Cause Analysis**:
   - Focus on identifying and addressing the root causes of issues to prevent repeated mistakes.

---

## Immediate Plan:
1. **Restore Functionality**:
   - Focus on restoring the last known working state where the `postgres_db` container was operational and the backend was failing due to connectivity issues.

2. **Validate Each Step**:
   - Verify the functionality of the database, backend, and frontend independently.

3. **Update Documentation**:
   - Document all changes and decisions to ensure alignment with expectations.

---

## Expectations:
1. **Documentation**:
   - Always update the documentation when changes are made or deviations occur.
   - Use the documentation as the single source of truth for the project.

2. **Communication**:
   - Discuss any deviations from the documented process before making changes.
   - Ensure all decisions are logged and communicated clearly.

3. **Accountability**:
   - Take responsibility for mistakes and focus on learning from them.
   - Avoid introducing regressions by thoroughly understanding the impact of changes.

---

This document serves as a reminder and guide to ensure alignment, accountability, and progress moving forward.