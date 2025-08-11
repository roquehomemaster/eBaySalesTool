# eBayInfo Table

## Purpose
The `eBayInfo` table stores eBay account and performance data for reporting, auditing, and offline access. It is used by the eBayInfo API endpoints to provide account details, seller performance metrics, and API health/status. This table is updated via sync jobs or API calls to ensure the application has the latest eBay data, even when offline or for historical analysis.

## Schema
- `id`: Serial primary key.
- `accountId`: eBay account identifier (string, required).
- `storeName`: Name of the eBay store (string).
- `feedbackScore`: Seller feedback score (integer).
- `positiveFeedbackPercent`: Seller positive feedback percentage (numeric).
- `sellingLimits`: JSON object with selling limits.
- `sellerLevel`: Seller level (string).
- `defectRate`: Seller defect rate (numeric).
- `lateShipmentRate`: Seller late shipment rate (numeric).
- `transactionDefectRate`: Seller transaction defect rate (numeric).
- `policyComplianceStatus`: Policy compliance status (string).
- `apiStatus`: eBay API health status (string).
- `lastSync`: Timestamp of last sync with eBay.
- `createdAt`: Row creation timestamp.
- `updatedAt`: Row update timestamp.

## Seeding
A sample record is seeded in `03_seed_eBayInfo.sql` for development/testing. In production, this table should be updated by scheduled sync jobs or API calls.

## Usage
- Referenced by the eBayInfo API endpoints for account and performance data.
- Supports reporting, auditing, and offline access to eBay account information.
