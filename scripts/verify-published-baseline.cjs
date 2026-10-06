const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
function digest(relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative)) throw new Error('Invalid relative path');
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || fs.lstatSync(file).isSymbolicLink()) {
    throw new Error('Unsafe publication path');
  }
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

try {
  const map = JSON.parse(fs.readFileSync(path.join(root, 'docs/baseline/GIT_BASELINE_SOURCE_MAP.json'), 'utf8'));
  if (map.total !== 219 || map.files.length !== 219 || map.documents.length !== 2 ||
      new Set(map.files.map(file => file.originalPath)).size !== 219 ||
      new Set(map.files.map(file => file.publishedPath)).size !== 219) throw new Error('Invalid baseline map');
  for (const file of [...map.files, ...map.documents]) {
    const relative = file.publishedPath || file.path;
    if (!/^[a-f0-9]{64}$/.test(file.sha256) || digest(relative) !== file.sha256) {
      throw new Error('SHA-256 mismatch: ' + relative);
    }
  }
  console.log('CLINIC BASELINE:219/219 MATCH');
  console.log('ORIGINAL WORD REPORTS:2/2 MATCH');
  const manifest = path.join(root, 'docs/versioning/CLINIC_PUBLICATION_SHA256.txt');
  if (fs.existsSync(manifest)) {
    const rows = fs.readFileSync(manifest, 'utf8').trimEnd().split(/\r?\n/);
    for (const row of rows) {
      if (!/^[a-f0-9]{64}  .+$/.test(row) || digest(row.slice(66)) !== row.slice(0, 64)) {
        throw new Error('Publication manifest mismatch');
      }
    }
    console.log('PUBLICATION MANIFEST:' + rows.length + '/' + rows.length + ' MATCH');
  }
  console.log('Historical validation preserved; no application tests or database operations executed.');
} catch (error) {
  console.error('PUBLICATION VERIFICATION FAILED: ' + error.message);
  process.exitCode = 1;
}
