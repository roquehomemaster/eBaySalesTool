const { sequelize } = require('../src/utils/database');
const EbayListingImportRaw = require('../src/models/ebayListingImportRawModel');
const { execSync } = require('child_process');

// Simple integration-style test (dry-run) ensuring ingestion logs and no DB writes unless toggled.

describe('Raw import pipeline (dry-run)', () => {
  test('ingest script dry-run does not create rows', async () => {
    // Ensure table exists (migration may not run in test bootstrap yet)
    await EbayListingImportRaw.sync();
    const before = await EbayListingImportRaw.count();
    execSync('node scripts/import/ingest_raw_listings.js', { cwd: __dirname + '/..', stdio: 'inherit' });
    const after = await EbayListingImportRaw.count();
    expect(after).toBe(before); // dry run should not change count
  });
});
