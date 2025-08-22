/**
 * apply_migrations.js
 * Lightweight migration runner for raw SQL files in database/migrations.
 * Tracks applied migrations in table schema_migrations (filename, applied_at).
 * Order: lexical filename order. Idempotent: skips files whose exact name is present.
 * Env needed: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD (standard pg vars).
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function ensureTable(client){
	await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
}

async function getApplied(client){
	const res = await client.query('SELECT filename FROM schema_migrations');
	return new Set(res.rows.map(r=> r.filename));
}

async function applyFile(client, filePath){
	const sql = fs.readFileSync(filePath, 'utf8');
	await client.query('BEGIN');
	try {
		await client.query(sql);
		const fname = path.basename(filePath);
		await client.query('INSERT INTO schema_migrations(filename) VALUES($1) ON CONFLICT DO NOTHING', [fname]);
		await client.query('COMMIT');
		return { file: fname, applied: true };
	} catch(e){
		await client.query('ROLLBACK');
		return { file: path.basename(filePath), applied:false, error: e.message };
	}
}

async function run(){
	const dir = path.resolve(__dirname, '..', 'database', 'migrations');
	const altDir = path.resolve(__dirname, '..', 'database', 'migrations');
	const migrationsDir = fs.existsSync(dir) ? dir : altDir;
	const files = fs.readdirSync(migrationsDir).filter(f=> f.endsWith('.sql')).sort();
	const client = new Client();
	await client.connect();
	await ensureTable(client);
	const applied = await getApplied(client);
	const results = [];
	for (const f of files){
		if (applied.has(f)) { results.push({ file:f, skipped:true }); continue; }
		// eslint-disable-next-line no-await-in-loop
		const res = await applyFile(client, path.join(migrationsDir, f));
		results.push(res);
		if (res.error){
			console.error('Migration failed:', res.file, res.error); // eslint-disable-line no-console
			break;
		}
	}
	await client.end();
	console.log(JSON.stringify({ migrations: results }, null, 2)); // eslint-disable-line no-console
}

if (require.main === module){
	run().catch(e=>{ console.error('apply_migrations failed', e); process.exit(1); }); // eslint-disable-line no-console
}

module.exports = { run }; 
