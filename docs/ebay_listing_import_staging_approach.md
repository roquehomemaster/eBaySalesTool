# eBay Listing Raw Staging Import Approach

Status: APPROVED (initial execution)
Last Updated: 2025-08-18

## Summary
We will ingest all existing eBay listing detail payloads into a raw staging table first, without mutating core domain tables (`listing`, `catalog`, `ebay_listing`). A separate mapping pass will transform approved fields into the production schema. This isolates risk and captures full fidelity for future enrichment.

## Staging Table: `ebay_listing_import_raw`
| Column | Type | Notes |
|--------|------|-------|
| import_id | SERIAL PK | Identity |
| item_id | TEXT | eBay unique itemId (indexed) |
| sku | TEXT NULL | Fast filter, if provided in payload |
| source_api | TEXT | 'trading' | 'sell_summary' | future values |
| raw_json | JSONB | Entire remote response (as received) |
| content_hash | CHAR(64) | sha256 of canonical raw JSON (indexed) |
| fetched_at | TIMESTAMP | Insert timestamp |
| processed_at | TIMESTAMP NULL | Set when mapping completes |
| process_status | TEXT | pending | mapped | failed | skipped |
| process_error | TEXT NULL | Last error message if failed |
| attempt_count | INT | Mapping attempts |

Indexes:
- IX_ebay_listing_import_raw_item (item_id)
- IX_ebay_listing_import_raw_hash (content_hash)
- Optional composite future: (item_id, content_hash) UNIQUE to avoid duplicates.

## Flow
1. Ingest Script (Backfill / Incremental)
   - Enumerate itemIds (initial: direct list). For each: call Trading GetItem.
   - Compute hash; if an identical (item_id, content_hash) already exists, skip insert.
   - Otherwise insert row (process_status='pending').

2. Mapping Script (Controlled Execution)
   - Select N rows WHERE process_status='pending' ORDER BY fetched_at ASC.
   - Parse essential fields (itemId, title, price+currency, quantitySold, status, start/end time, watchers, primary image URL, description HTML).
   - Ensure catalog entry (stub if SKU missing).
   - Upsert listing & ebay_listing linkage; version description if new.
   - Update row: processed_at=NOW(), process_status='mapped'.
   - On error: process_status='failed', process_error set, increment attempt_count.

3. Reprocessing Changes
   - If listing changes on eBay, new raw payload → new hash → new pending row.
   - Mapping updates core tables idempotently.

## Advantages
- Zero risk to core entities during initial data capture.
- Full historical raw snapshots for audit & future field extraction.
- Idempotent: duplicate payloads skipped by hash presence check.
- Clear separation of concerns (ingestion vs business mapping).

## Not Implemented Yet (Future)
- Variation normalization tables.
- Policy linkage extraction.
- Bulk image table.
- Automated scheduler (manual trigger until stable).

## Environment Flags (to introduce later)
- EBAY_RAW_IMPORT_ENABLED
- EBAY_RAW_IMPORT_BATCH_SIZE (default 25)
- EBAY_RAW_IMPORT_DRY_RUN (default true initially)
- EBAY_RAW_MAP_BATCH_SIZE (default 25)

## Initial Deliverables (Phase 1 Execution)
1. Migration: create `ebay_listing_import_raw` with indexes.
2. Sequelize model for staging table.
3. Ingestion script (dry-run support): fetch sample items (placeholder function for API call until credentials added).
4. Mapping script skeleton (parses a sample raw row; dry-run mode).
5. Minimal tests: hash idempotency, mapping state transition pending→mapped.

## Rollback
Drop staging table (no other schema touched). Core tables unaffected until mapping script is run.

## Open Items (Will Decide Later)
- Source enumeration method (Sell summary vs pre-supplied list) once credentials available.
- Error retry strategy thresholds (tentative max attempts=3).
- Token acquisition implementation (OAuth refresh).

---
This document reflects the agreed staging-first import approach and is ready for implementation.
