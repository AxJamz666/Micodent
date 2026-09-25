const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const workspace = path.resolve(__dirname, '../..');
const version = 'MICODENT-RC4-S1A-DEV';
const destination = path.join(workspace, '.runtime', 'releases', `${version}-${Date.now()}`);
if (!fs.existsSync(path.join(workspace, 'micodent-frontend/dist/index.html'))) throw new Error('Compila primero el frontend.');
fs.mkdirSync(destination, { recursive: true });
const excluded = name => name === 'node_modules' || name === 'uploads' || name === '.git' || name === '.runtime' || name.startsWith('.env') || /(?:_completo\.txt|\.log|\.zip|\.pem|\.key|credentials\.json)$/i.test(name);
function copy(source, target) {
  if (excluded(path.basename(source))) return;
  const stat = fs.lstatSync(source);
  if (stat.isSymbolicLink()) throw new Error('El paquete no admite enlaces.');
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const name of fs.readdirSync(source)) copy(path.join(source, name), path.join(target, name));
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  }
}
const includes = {
  'micodent-backend': ['src', 'scripts', 'migrations', 'tests', 'package.json', 'package-lock.json'],
  'micodent-frontend': ['src', 'public', 'tests', 'package.json', 'package-lock.json', 'index.html', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js', 'eslint.config.js'],
};
for (const [folder, entries] of Object.entries(includes)) {
  for (const entry of entries) copy(path.join(workspace, folder, entry), path.join(destination, folder, entry));
}
copy(path.join(workspace, 'micodent-frontend/dist'), path.join(destination, 'micodent-backend/public'));
copy(path.join(workspace, 'micodent-backend/public/build-version.json'), path.join(destination, 'micodent-backend/public/build-version.json'));
for (const entry of ['iniciar_micodent.bat', 'comprobar_micodent.bat', 'micodent-arranque.cjs', 'docs/HOTFIX_RC1.md', 'docs/HOTFIX_RC2.md', 'docs/HOTFIX_RC3.md', 'docs/HOTFIX_RC4.md', 'docs/RC4_S1A_INTEGRACION.md']) copy(path.join(workspace, entry), path.join(destination, entry));
const files = [];
function inventory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) inventory(file);
    else files.push({ path: path.relative(destination, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
  }
}
inventory(destination);
const manifest = { version, createdAt: new Date().toISOString(), status: 'Integracion exclusiva DEV; requiere configuracion y migraciones verificadas. No desplegar en clinica.', bytes: files.reduce((sum, f) => sum + f.bytes, 0), files };
fs.writeFileSync(path.join(destination, 'MANIFEST.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
for (const file of files) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(destination, file.path))).digest('hex');
  if (actual !== file.sha256) throw new Error(`Integridad incorrecta: ${file.path}`);
}
console.log(JSON.stringify({ destination, files: files.length, bytes: manifest.bytes, integrity: 'SHA-256 verificado', excludes: ['secretos', 'BD', 'uploads', 'dependencias', 'runtime'] }, null, 2));
