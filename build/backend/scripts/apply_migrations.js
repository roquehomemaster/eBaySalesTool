// Contents of apply_migrations.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function applyMigrations() {
    const migrationsPath = '/shared_migrations';
    const files = fs.readdirSync(migrationsPath);

    files.forEach(file => {
        const filePath = path.join(migrationsPath, file);
        console.log(`Applying migration: ${file}`);
        execSync(`psql -h database -U postgres -d ebay_sales_tool -f ${filePath}`);
    });

    console.log('All migrations applied successfully.');
}

applyMigrations();
