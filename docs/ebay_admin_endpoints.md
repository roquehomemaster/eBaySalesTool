# eBay Admin Endpoints

Documentation snapshot for recently added admin endpoints supporting raw ingestion and mapping.

## POST /api/admin/ebay/retrieve
Ingest (or simulate ingest of) raw eBay listing payloads.

Request JSON:
```
{
  "itemIds": "101,102,103",   // comma or whitespace separated IDs
  "dryRun": true               // default true; when true, no inserts occur
}
```
Response 200 JSON (example):
```
{
  "dryRun": true,
  "summary": {
    "requested": 3,
    "fetched": 3,
    "succeeded": 3,
    "inserted": 0,
    "duplicates": 0,
    "skipped": 0,
  "errors": 0,
  "invalidIds": 0,
  "transientErrors": 0,
  "permanentErrors": 0,
  "retries": 0,
  "avgAttempts": 1,
  "durationMs": 842
  }
}
```
Error 400 example (no IDs):
```
{ "error": "no_item_ids", "message": "At least one itemId is required" }
```

## POST /api/admin/ebay/map/run
Run mapping pipeline from raw staging rows to domain entities.

Request JSON (all optional):
```
{
  "dryRun": true,      // default true; when true nothing is persisted
  "maxItems": 500      // optional batch size cap (positive integer)
}
```
Response 200 JSON (example):
```
{
  "dryRun": false,
  "exitCode": 0,
  "summary": {
    "status": "success",
    "startedAt": "2025-08-20T12:34:56.000Z",
    "finishedAt": "2025-08-20T12:34:59.200Z",
    "durationMs": 3200,
    "processed": 450,
    "mapped": 450,
    "skipped": 0,
  "errors": 0,
  "selected": 450,
  "dryRun": false,
  "limit": 500
  },
  "logs": ["Starting mapping run...","Processed 450 items","Mapping run complete"]
}
```
Error 400 example (invalid maxItems):
```
{ "error": "invalid_maxItems", "message": "maxItems must be a positive integer" }
```
Timeout 504 example:
```
{ "error": "mapping_timeout", "message": "Mapping run exceeded timeout" }
```

## Notes
- Both endpoints honor `dryRun` to enable safe simulation.
- Mapping script output is truncated server-side if excessively large; logs array may not include every line.
- Swagger (`swagger.json`) is authoritative; this doc is a convenience snapshot.
- Ingestion summary now classifies retry behavior (`transientErrors`, `permanentErrors`, `retries`). A transient error may still yield a successful fetch on a later attempt.
- Metrics expose adapter latency histogram (`adapter.get_item_detail_ms`) and call counter (`adapter.get_item_detail.calls`).
- `avgAttempts` plus histogram `ingest.attempts_per_item` show distribution of adapter fetch attempts per item.
