const request = require('supertest');
// Set env BEFORE requiring app so adapter picks up values
process.env.EBAY_ADAPTER_FAIL_ONCE_IDS = '3001,3002';
process.env.EBAY_ADAPTER_MAX_RETRIES = '3';
const app = require('../src/app');

describe('Adapter retry logic /api/admin/ebay/retrieve', () => {
	test('transient failures recovered by retry do not count as permanent errors', async () => {
		const res = await request(app)
			.post('/api/admin/ebay/retrieve')
			.send({ itemIds: '3001,3002,3003', dryRun: true })
			.expect(200);
		const s = res.body.summary;
		expect(s.requested).toBe(3);
		// All should eventually fetch despite first-attempt failures on 3001 & 3002
		expect(s.fetched).toBe(3);
		expect(s.transientErrors).toBeGreaterThanOrEqual(2); // at least two transient error occurrences recorded
		expect(s.permanentErrors).toBe(0);
		expect(s.retries).toBeGreaterThanOrEqual(2); // at least two retry attempts
	});
});

