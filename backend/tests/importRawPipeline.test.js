const { sequelize } = require('../src/utils/database');
const EbayListingImportRaw = require('../src/models/ebayListingImportRawModel');
const { execSync } = require('child_process');
const path = require('path');

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

  test('mapping script dry-run outputs summary object', () => {
    const script = path.join(__dirname, '..', 'scripts', 'import', 'map_pending_listings.js');
    const output = execSync(`node ${script}`, { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    const line = output.split(/\r?\n/).reverse().find(l => l.startsWith('Mapping pass complete '));
    expect(line).toBeTruthy();
    const jsonPart = line.slice('Mapping pass complete '.length);
    const parsed = JSON.parse(jsonPart);
    ['status','processed','mapped','skipped','errors','startedAt','finishedAt','durationMs','selected'].forEach(k => expect(parsed).toHaveProperty(k));
  });

  test('mapping script supports artificial delay (timeout scenario)', () => {
    const script = path.join(__dirname, '..', 'scripts', 'import', 'map_pending_listings.js');
    // Provide a small data set (no pending rows needed) but force delay
    const start = Date.now();
    const output = execSync(`node ${script}`, { cwd: path.join(__dirname, '..'), encoding: 'utf8', env: { ...process.env, MAP_TEST_DELAY_MS: '50' } });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(50);
    const line = output.split(/\r?\n/).reverse().find(l => l.startsWith('Mapping pass complete '));
    expect(line).toBeTruthy();
  });
});
