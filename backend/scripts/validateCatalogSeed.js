// validateCatalogSeed.js
// Script to check if Catalog table has data after build/seed

const { Client } = require('pg');

// Update these values to match your environment or use environment variables
const config = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'ebay_sales_tool',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
};

async function main() {
  const client = new Client(config);
  try {
    await client.connect();
    const res = await client.query('SELECT COUNT(*) FROM "Catalog";');
    const count = res.rows[0].count;
    if (parseInt(count) > 0) {
      console.log(`SUCCESS: Catalog table contains ${count} row(s).`);
      process.exit(0);
    } else {
      console.error('ERROR: Catalog table is empty after seeding.');
      process.exit(1);
    }
  } catch (err) {
    console.error('ERROR: Could not query Catalog table:', err.message);
    process.exit(2);
  } finally {
    await client.end();
  }
}

main();
