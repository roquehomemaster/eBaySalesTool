# eBay Listing Import & Description Capture Design

Status: DRAFT (planning)  
Owner: Integration / Backend  
Last Updated: 2025-08-18

## 1. Purpose
Introduce a safe, incremental import pipeline that ingests existing live eBay listings into our internal data model, creates catalog stubs for unknown SKUs, and versions the original listing HTML description for historical/reference/audit usage.

## 2. Out of Scope (FOR NOW)
- Real-time publish/update backflow to eBay (already separately designed).
- Variation (multi-SKU) handling beyond basic identification.
- Image gallery persistence (will rely on snapshot JSON initially).
- Policy (shipping/return/payment) linkage resolution.
- OAuth token refresh implementation details (placeholder only here).

## 3. High-Level Phases
| Phase | Goal | Writes | External Calls |
|-------|------|-------|----------------|
| 0 (Dry Run) | Validate parsing & mapping | None | Sell summary (page 1) + optional one Trading item |
| 1 (Initial Backfill) | Import all active listings + HTML | listing / ebay_listing / description history | Sell summary (paged) + Trading GetItem per listing |
| 1.1 (Stability) | Retry failures / metrics | Same as Phase 1 | Replays failed detail fetches |
| 2 (Incremental Sync) | Periodic diff & update | Update mutable fields, add new description revisions | Sell summary (all active) + selective Trading for suspected changes |
| 3 (Enhance) | Variations, images table, policies | New tables/cols | Additional endpoints |

## 4. Data Model Changes (Planned)
### New Columns on `listing` (Phase 1 Minimal)
- sku (STRING, index)
- currency (STRING(3))
- external_status (STRING) // eBay listingStatus
- quantity_sold (INTEGER DEFAULT 0)
- last_synced_at (TIMESTAMP)

### Deferred Columns (Phase 2+)
- quantity_available (INTEGER)
- listing_format (STRING)  // FIXED_PRICE | AUCTION
- condition_code (INTEGER)
- category_id (TEXT or BIGINT)
- start_time / end_time (TIMESTAMP)
- primary_image_url (TEXT)
- remote_last_modified (TIMESTAMP)
- variation_flag (BOOLEAN)

### New Table: `listing_description_history`
| Column | Type | Notes |
|--------|------|-------|
| id | PK | SERIAL/BIGINT |
| listing_id | FK listing | required |
| ebay_listing_id | FK ebay_listing | nullable (link helper) |
| revision_hash | CHAR(64) | sha256(normalized HTML) unique per listing |
| raw_html | TEXT | original unmodified HTML |
| captured_at | TIMESTAMP | default now |
| source | TEXT | 'import' | 'sync' | 'manual' |
| is_current | BOOLEAN | optional convenience flag |

Indexes:
- (listing_id, captured_at DESC)
- UNIQUE(listing_id, revision_hash)

### No Change Yet:
`ebay_listing` structure is sufficient (external_item_id used).

## 5. Field Mapping Summary
| eBay Field | Source API | Internal Target | Notes |
|------------|-----------|-----------------|-------|
| itemId | Sell Item Summary | ebay_listing.external_item_id | Upsert key |
| sku | Sell | listing.sku | If missing, may derive later |
| title | Sell | listing.title | Overwrite policy TBD |
| price.value | Sell | listing.listing_price | Decimal |
| price.currency | Sell | listing.currency | Add column |
| listingStatus | Sell | listing.external_status | ACTIVE/ENDED/COMPLETED |
| quantitySold | Sell | listing.quantity_sold | |
| availableQuantity | Sell | listing.quantity_available (Phase 2) | |
| conditionId | Trading GetItem | listing.condition_code | Phase 2 |
| CategoryID | Trading | listing.category_id | Phase 2 |
| StartTime/EndTime | Trading | start_time/end_time | Phase 2 |
| PictureURL[0] | Trading | primary_image_url | Phase 2 |
| WatchCount | Trading | listing.watchers | Already exists |
| Description | Trading | listing_description_history.raw_html | Versioning |

## 6. Catalog Fallback Strategy
When SKU absent or unmatched:  
1. Parse title: simple heuristic (split by '-' / ','; token[0] candidate manufacturer, token[1] model if length < 25).  
2. Insert catalog stub: manufacturer = parsed || 'UNKNOWN'; model = parsed || truncated title; description NULL.  
3. Link new `catalog.item_id` to `listing.item_id`.  
4. Leave improvement hooks (flag uncertain parse for later refinement).

## 7. Import Workflow (Phase 1)
1. Page through Sell Item Summary API (limit=200).  
2. For each summary item: collect itemIds.  
3. For each itemId, call Trading GetItem (concurrency window N=3) to fetch full detail & HTML description.  
4. Normalize & build projection object.  
5. Start transaction (batch of ~50 items):
   - Upsert catalog (if needed) based on SKU or stub creation.
   - Upsert listing record; update only mutable fields (price, external_status, quantity_sold, watchers, currency, last_synced_at).
   - Upsert ebay_listing (external_item_id mapping) linking listing.
   - Insert description revision if new (hash check).  
6. Commit batch; log metrics & any failures.
7. Retry failed detail fetches (max 3 attempts) into a simple dead-letter log.

## 8. Idempotency & Hashing
Description hash: sha256(lowercase(trim(collapseWhitespace(HTML)))).  
Listing snapshot hash (future drift use): sha256(sorted JSON projection subset).  
Unique constraints prevent duplicate description rows.

## 9. Incremental Sync (Phase 2)
- Re-pull active listings; for each: compare hash (or lastModified) → update diffs.  
- Detect ended listings (status change) and update `external_status`.  
- If description changed (new hash) fetch Trading detail again (or proactively always for changed revision IDs if exposed).

## 10. Error Handling & Observability
Logging (ebay_transaction_log): operation values:
- fetchListingSummaryPage(pageN)
- fetchListingDetail(itemId)

Metrics (counters):
- import.listings.created / updated / failed
- import.catalog.stubs_created
- import.description.new_revisions
- import.detail.retry_attempts

Retry Policy: exponential backoff for HTTP 429 (start 2s → cap 30s).  
Stop condition: after 3 failed detail attempts; write dead-letter entry.

## 11. Environment Flags (Planned)
| Variable | Purpose | Default |
|----------|---------|---------|
| EBAY_IMPORT_ENABLED | Enable scheduled import/sync | false |
| EBAY_IMPORT_PAGE_SIZE | Sell summary page size | 100 |
| EBAY_IMPORT_DETAIL_CONCURRENCY | Parallel GetItem calls | 3 |
| EBAY_IMPORT_DRY_RUN | Log only, no DB writes | true (initial) |
| EBAY_IMPORT_ALLOW_TITLE_OVERWRITE | Permit eBay title to overwrite local | false |

## 12. Open Decisions (Awaiting Sign-Off)
1. Overwrite existing `listing.title`? (Proposed: only when status='draft' OR flag true.)
2. Accept listings with no SKU? (Proposed: yes, create catalog stub.)
3. Incremental sync frequency (Proposed: every 15 min; configurable.)
4. Concurrency limit (Proposed: 3 now, raise after stability.)
5. Description normalization strictness (Proposed: collapse whitespace only.)
6. Watchers retrieval mandatory? (Implicit if Trading call always used.)

## 13. Rollback Plan
All changes are additive. Disable via EBAY_IMPORT_ENABLED=false. Description history table can remain dormant. No destructive updates performed during import.

## 14. Future Enhancements
- Variation matrix storage (table: listing_variation + variation_attribute).
- Image table (listing_image) with rank & checksum.
- Policy linkage (return/shipping/payment references + caching).
- Partial sync using updatedSince filters if/when reliable.
- Differential snapshot hashing for drift classification.

## 15. Security Considerations
- OAuth refresh tokens stored only in secure environment variables (not DB).  
- Access tokens cached in memory with expiry awareness.  
- Trading API legacy credentials isolated under distinct env prefix if required.

## 16. Implementation Order (Once Approved)
1. Migrations (new columns + description history table).  
2. Model updates (Listing + DescriptionHistory model).  
3. Import service module (pure functions + adapters).  
4. Dry-run script (node scripts/import/dryRun.js).  
5. Enable real writes behind EBAY_IMPORT_DRY_RUN flag.  
6. Add metrics & logging integration.  
7. Schedule incremental sync (feature flag).  
8. Tests: unit (mapping + normalization) & integration (dry-run harness with mocked eBay responses).

---
Pending: Decision responses for section 12 before migrations are authored.
