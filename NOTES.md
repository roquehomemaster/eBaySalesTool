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