Archived legacy or redundant migration files.

Policy:
- Keep only canonical base (01_init.sql) and forward-only incremental migrations in active migrations directory.
- Any superseded or noisy legacy scripts should be moved here (NOT mounted into docker-entrypoint-initdb.d) to guarantee deterministic schema on fresh rebuilds.

Current contents intentionally minimal. Add files here instead of deleting outright for traceability.
