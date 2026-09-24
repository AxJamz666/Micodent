const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const source = path.resolve(__dirname, '../../micodent-frontend/dist');
const target = path.resolve(__dirname, '../public');
if (!fs.existsSync(path.join(source, 'index.html'))) throw new Error('Primero compila micodent-frontend.');
// Preserve the assets directory and old chunks for tabs open during an update.
fs.cpSync(source, target, { recursive: true });
const files = [];
function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) walk(file);
    else files.push({ file: path.relative(source, file).replaceAll('\\','/'), sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
  }
}
walk(source);
fs.writeFileSync(path.join(target,'build-version.json'), JSON.stringify({ version:'hotfix-clinico-financiero-rc4', createdAt:new Date().toISOString(), files }, null, 2));
console.log(`Frontend compilado integrado: ${files.length} archivos verificados en backend/public.`);
