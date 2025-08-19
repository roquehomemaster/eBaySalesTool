// validate_swagger.js
// Ensures swagger.json has mandatory version metadata so Swagger UI can render.
// If missing, injects openapi 3.0.1 + basic info and servers.
const fs = require('fs');
const path = require('path');
const swaggerPath = path.resolve(__dirname, '../../swagger.json');
if (!fs.existsSync(swaggerPath)) {
  console.error('validate_swagger: swagger.json not found at', swaggerPath);
  process.exit(1);
}
try {
  const raw = fs.readFileSync(swaggerPath, 'utf8');
  const doc = raw.trim() ? JSON.parse(raw) : {};
  let changed = false;
  if (!doc.openapi && !doc.swagger) { doc.openapi = '3.0.1'; changed = true; }
  if (!doc.info) { doc.info = { title: 'eBay Sales Tool API', version: '1.0.0', description: 'Auto-injected metadata (validate_swagger.js).' }; changed = true; }
  if (!doc.servers) { doc.servers = [{ url: 'http://localhost:5000', description: 'Default server' }]; changed = true; }
  if (changed) {
    fs.writeFileSync(swaggerPath, JSON.stringify(doc, null, 2));
    console.log('validate_swagger: injected missing metadata.');
  } else {
    console.log('validate_swagger: swagger.json already valid.');
  }
  process.exit(0);
} catch (e) {
  console.error('validate_swagger: failed ->', e.message);
  process.exit(1);
}
