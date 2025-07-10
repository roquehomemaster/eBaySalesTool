
// generate_swagger.js
// -----------------------------------------------------------------------------
// Merges all swagger JSON files into a single swagger.json at the project root.
//
// Standard Operating Procedure (SOP):
// - This script must be run and completed before any process that depends on swagger.json.
// - The file write is synchronous and blocking, so swagger.json is always valid when the script exits.
// - Do not edit swagger.json manually; always update .swagger.json files in backend/src/swagger and rerun this script.
// - If you change this script to use async file operations, you must await completion before continuing the build.
//
// Usage:
//   node backend/scripts/generate_swagger.js
//
// This script will:
//   - Load the main swagger.json (if it exists)
//   - Merge in all .swagger.json files from backend/src/swagger
//   - Write the merged result to swagger.json at the project root
//
// Author: eBay Sales Tool Team
// Last updated: 2025-07-10
// -----------------------------------------------------------------------------


const fs = require('fs');
const path = require('path');

const rootSwaggerPath = path.resolve(__dirname, '../../swagger.json');
const swaggerDir = path.resolve(__dirname, '../src/swagger');

// Load the main swagger.json if it exists, but handle empty or invalid JSON gracefully
let mainSwagger = {};
if (fs.existsSync(rootSwaggerPath)) {
  try {
    const rootContent = fs.readFileSync(rootSwaggerPath, 'utf8');
    if (rootContent.trim()) {
      mainSwagger = JSON.parse(rootContent);
    } else {
      console.warn('Root swagger.json is empty, starting with empty object.');
    }
  } catch (err) {
    console.error('Root swagger.json is invalid JSON, starting with empty object:', err.message);
  }
}

// Merge in all .swagger.json files from backend/src/swagger
const files = fs.readdirSync(swaggerDir).filter(f => f.endsWith('.swagger.json'));
for (const file of files) {
  const filePath = path.join(swaggerDir, file);
  let fileContent;
  try {
    fileContent = fs.readFileSync(filePath, 'utf8');
    if (!fileContent.trim()) {
      console.warn(`Skipping empty swagger file: ${file}`);
      continue;
    }
    const doc = JSON.parse(fileContent);
    // Merge paths
    if (doc.paths) {
      mainSwagger.paths = mainSwagger.paths || {};
      Object.assign(mainSwagger.paths, doc.paths);
    }
    // Merge components (schemas, responses, etc.)
    if (doc.components) {
      mainSwagger.components = mainSwagger.components || {};
      for (const key of Object.keys(doc.components)) {
        mainSwagger.components[key] = {
          ...(mainSwagger.components[key] || {}),
          ...doc.components[key],
        };
      }
    }
  } catch (err) {
    console.error(`Error parsing swagger file ${file}:`, err.message);
    continue;
  }
}

// Write merged swagger.json
fs.writeFileSync(rootSwaggerPath, JSON.stringify(mainSwagger, null, 2));
console.log('Swagger JSON merged and written to', rootSwaggerPath);

// -----------------------------
// End of generate_swagger.js
// -----------------------------
