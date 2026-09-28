const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const source = path.resolve(__dirname, '../../micodent-frontend/dist');
const target = path.resolve(__dirname, '../public');
if (!fs.existsSync(path.join(source, 'index.html'))) throw new Error('Primero compila micodent-frontend.');
// Keep old hashed chunks for tabs that were open before an update.
function copyBuild(directory) {
  const destination = path.join(target, path.relative(source, directory));
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const input = path.join(directory, entry.name);
    if (entry.isDirectory()) copyBuild(input);
    else if (entry.isFile()) fs.copyFileSync(input, path.join(destination, entry.name));
    else throw new Error('El build contiene un enlace o archivo no regular.');
  }
}
copyBuild(source);
const files = [];
function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) walk(file);
    else {
      const sha256 = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
      const copied = path.join(target, path.relative(source, file));
      if (crypto.createHash('sha256').update(fs.readFileSync(copied)).digest('hex') !== sha256) {
        throw new Error('El build copiado no coincide con el original.');
      }
      files.push({ file: path.relative(source, file).replaceAll('\\','/'), sha256 });
    }
  }
}
walk(source);
fs.writeFileSync(path.join(target,'build-version.json'), JSON.stringify({ version:'rc4-e09-dev', createdAt:new Date().toISOString(), files }, null, 2));
console.log(`Frontend compilado integrado: ${files.length} archivos verificados en backend/public.`);
