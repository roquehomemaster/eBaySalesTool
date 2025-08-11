Retaining appconfig and DB data across docker-compose down -v

Goal
- Keep Postgres data (including appconfig) persistent even when running docker compose down -v.

Changes
- The Postgres data volume in docker-compose.yml is now external:
  - Name: ebaysalestool-db
  - This prevents accidental deletion by down -v because external volumes are not removed.

Setup
1) Create the volume once (PowerShell):
   scripts/init_db_volume.ps1
2) Start the stack:
   docker compose up -d --build

Notes
- On a brand-new volume, Postgres initializes and runs any SQL in database/migrations via the /docker-entrypoint-initdb.d bind mount.
- Subsequent restarts will reuse the same data and skip re-running init scripts.
- If you truly need a fresh DB, delete the volume explicitly:
   docker volume rm ebaysalestool-db
