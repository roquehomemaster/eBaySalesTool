## eBay Listing Snapshot Strategy

### Goals
Provide immutable, deduplicated, and query-friendly historical records of what we intended to (and actually did) represent on eBay at each significant event, enabling forensic audits, dispute resolution, and compliance.

---
### Snapshot Triggers
| Trigger | Source Event Name | Rationale |
|---------|-------------------|-----------|
| Successful publish (create/update) | publish_success | Tie each outbound change to a stored immutable record |
| Listing end/remove/relist | lifecycle_change | Record terminal or branching transitions |
| External drift detected | external_drift | Preserve unexpected marketplace state |
| Policy cache change affecting projection | policy_dependency_change | Show indirect config influences |
| Manual admin force-snapshot | manual | Operator investigation & baselining |

---
### Data Captured
| Section | Description |
|---------|-------------|
| projection | Fully resolved internal → eBay canonical object (pre mapping). |
| ebay_payload | Exact payload body submitted (if any) with stable field ordering. |
| marketplace_echo (optional) | Normalized response or pulled live state (for create or reconcile). |
| policies | Shipping/return/fulfillment/payment identifiers used. |
| internal_sources | Version identifiers (row versions, config hashes). |
| meta | version number, generator build id, source_event, created_at. |

---
### Hash & Dedup
- Canonicalize (sorted keys) `projection` + `ebay_payload` (omit volatile timestamps) → SHA256.
- Store as `snapshot_hash`.
- If same as previous snapshot for listing → Write minimal row referencing previous via `dedup_of_snapshot_id`; store `{}` in diff.
- Guarantees constant-time equality check & compresses unchanged sequences.

---
### Diff Generation
Algorithm outline:
1. Deep compare previous vs current snapshot canonical objects.
2. Build JSON Patch-like delta (add/replace/remove operations) OR structured object retaining only changed branches.
3. Store human-friendly diff (structured) in `diff_from_prev_json`.
4. Omit large unchanged arrays by summarizing (e.g., `{"aspects":"UNCHANGED (17 items)"}`).

---
### Integrity & Verification
- Nightly job re-hashes N random snapshots to detect corruption.
- Optional `integrity_audit_log` table to record verification attempts.
- Potential extension: Merkle tree over snapshot hashes for tamper-evident chain.

---
### Access Patterns
Use Cases:
1. Show timeline of a listing with compact diff summaries.
2. Drill into full snapshot payload for a specific publish event.
3. Compare any two arbitrary snapshots (compute ad-hoc diff in service layer).
4. Filter snapshots by source_event or date range.
5. Forensic search by snapshot_hash (e.g., confirm identical projection reused across multiple listings—should not happen except for identical clones).

Indexes:
- (ebay_listing_id, created_at DESC)
- (snapshot_hash)
- (source_event, created_at DESC)

---
### Performance & Storage Considerations
- Average snapshot size expected small (<10 KB) but monitor; compress at rest if threshold exceeded.
- Dedup reduces churn during periods of frequent internal edits without external publish.
- Pruning: Never delete; if archival needed, move cold snapshots to cheaper storage tier; keep hash index local.

---
### API Surface (Planned)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/ebay/listings/:id/snapshots | GET | List snapshots (paged) |
| /api/ebay/snapshots/:snapshotId | GET | Get full snapshot |
| /api/ebay/snapshots/:snapshotId/diff/:otherId | GET | Compute diff on demand |
| /api/ebay/listings/:id/force-snapshot | POST | Manual snapshot trigger |

---
### Testing Strategy
- Unit: hash generator deterministic ordering; diff generator edge cases (added, removed, nested changes).
- Integration: create listing → modify fields → ensure snapshot count & diffs match expected sequence.
- Property-based (optional): random projection mutations produce stable hash invariants (same object → same hash; different object → different hash with extremely low collision probability).

---
### Edge Cases
| Case | Handling |
|------|----------|
| Large HTML description changes | Store full; diff may summarize unchanged unrelated branches. |
| Policy removed externally | Reconciliation marks drift; snapshot with missing policy id field. |
| Multiple rapid internal edits pre-publish | Queue collapse logic (only newest projection enqueued); snapshots only when publish occurs unless manual forced. |
| External partial failure (some aspects rejected) | Log failure; no publish_success snapshot until success; may store provisional snapshot with source_event=publish_attempt for diagnostics (optional). |

---
### Roadmap Enhancements
- Merkle chain for tamper evidence.
- Compression & encryption at column level.
- Snapshot reconstitution tool (generate full eBay payload from historical snapshot). 

---
### Summary
The strategy ensures every externally relevant state is immutably recorded with efficient storage, quick diffing, and strong integrity guarantees—supporting audits, debugging, and trust.
