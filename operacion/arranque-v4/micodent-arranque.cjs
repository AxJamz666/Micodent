'use strict';

// Launcher only: no SQL, service configuration, dependency installs or app edits.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const net = require('node:net');
const http = require('node:http');
const cp = require('node:child_process');
const { createRequire } = require('node:module');
const { performance } = require('node:perf_hooks');

const VERSION = '4.0.1';
const MESSAGES = {
  PLATFORM: 'Este paquete requiere Windows y Node.js 20 o posterior.',
  INSTALLATION: 'Faltan archivos o hay dos backends posibles. Revise la ubicacion del lanzador.',
  CONFIG: 'Configuracion local invalida o incompatible. No se ha cambiado el archivo .env.',
  ENV_CONFLICT: 'Hay variables de Windows que contradicen .env. Debe revisarlo el administrador.',
  DEPENDENCIES: 'Faltan dependencias instaladas o el comando de inicio no es compatible. No se instalo nada.',
  BUILD: 'El build de React esta incompleto o no es compatible con esta instalacion.',
  BUILD_PORT: 'El build apunta a otro puerto de API. No se abrira una interfaz conectada a otra instalacion.',
  LOG: 'No se pudo escribir el registro local de arranque. Revise espacio y acceso del usuario.',
  LOCK: 'No se pudo comprobar si otro inicio esta en curso. No se iniciara un proceso duplicado.',
  OWNER: 'No se pudo verificar el propietario del puerto. Solicite revision tecnica.',
  OWNER_TIMEOUT: 'Windows tardo demasiado al identificar el proceso. Espere a que termine de iniciar y vuelva a abrir MICODENT.',
  PORT_BUSY: 'El puerto pertenece a otro proceso o al lanzador anterior. No se detuvo ningun proceso. El administrador debe revisarlo.',
  MYSQL_TIMEOUT: 'MySQL no estuvo disponible a tiempo. Revise su inicio en XAMPP; no reinstale ni restaure la base.',
  BACKEND_TIMEOUT: 'MICODENT no confirmo conexion con MySQL a tiempo. Puede volver a abrir este acceso; no se duplicara el backend verificado.',
  BACKEND_EXIT: 'El backend termino antes de estar listo. Revise configuracion y dependencias con el administrador.',
  START: 'Windows no pudo iniciar el backend.',
  HTTP: 'La respuesta del servidor no coincide con esta instalacion.',
  BROWSER: 'MICODENT responde, pero no se pudo abrir el navegador. Abra la direccion indicada.',
  INTERNAL: 'No se completo el inicio. Consulte el codigo del registro con el administrador.',
};
function fail(code) { const error = new Error(code); error.code = code; throw error; }
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const identity = backend => hash(path.resolve(backend).toLowerCase()).slice(0, 32);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

function locate(base) {
  const candidates = [base, path.join(base, 'micodent-backend')].filter(folder =>
    fs.existsSync(path.join(folder, 'package.json')) && fs.existsSync(path.join(folder, 'src/index.js')));
  if (candidates.length !== 1) fail('INSTALLATION');
  return fs.realpathSync(candidates[0]);
}
function port(value, fallback) {
  const raw = value === undefined || value === '' ? String(fallback) : value;
  if (!/^\d{1,5}$/.test(raw) || Number(raw) < 1 || Number(raw) > 65535) fail('CONFIG');
  return Number(raw);
}
function configuration(parsed, inherited = process.env) {
  if (!['127.0.0.1', 'localhost', '::1'].includes(parsed.DB_HOST)) fail('CONFIG');
  for (const key of ['DB_NAME', 'DB_USER']) if (!parsed[key]?.trim()) fail('CONFIG');
  const backendPort = port(parsed.PORT, 4000);
  const dbPort = port(parsed.DB_PORT, 3306); // Same default as V3 src/config/db.js.
  if (backendPort === dbPort) fail('CONFIG');
  // dotenv would normally prefer inherited values. Fail closed rather than
  // silently start another database, port or secret selected by Windows.
  for (const key of new Set([...Object.keys(parsed), ...Object.keys(inherited)])) {
    if (/^(DB_|JWT_|PORT$|NODE_ENV$)/i.test(key) && own(inherited, key)
        && inherited[key] !== parsed[key]) fail('ENV_CONFLICT');
  }
  for (const key of ['NODE_OPTIONS', 'NODE_PATH']) {
    if (inherited[key] || parsed[key]) fail('CONFIG');
  }
  return { backendPort, dbPort, dbHost: parsed.DB_HOST, env: { ...inherited, ...parsed } };
}

function assets(backend, backendPort) {
  const root = fs.realpathSync(path.join(backend, 'public'));
  const resources = new Map();
  let total = 0;
  function add(relative) {
    if (relative.includes('\\') || relative.includes('\0')) fail('BUILD');
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) fail('BUILD');
    const real = fs.realpathSync(file);
    if (!real.startsWith(root + path.sep) || !fs.statSync(real).isFile()) fail('BUILD');
    if (resources.has(relative)) return;
    const size = fs.statSync(real).size;
    if (size > 16 * 1024 * 1024) fail('BUILD');
    const bytes = fs.readFileSync(real);
    total += size;
    if (total > 64 * 1024 * 1024 || resources.size >= 256) fail('BUILD');
    if (/\.m?js$/i.test(relative)) {
      for (const match of bytes.toString().matchAll(/https?:\/\/(?:localhost|127\.0\.0\.1):(\d+)/g)) {
        if (Number(match[1]) !== backendPort) fail('BUILD_PORT');
      }
    }
    resources.set(relative, { url: '/' + relative.split('/').map(encodeURIComponent).join('/'),
      sha256: hash(bytes), size });
  }
  add('index.html');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  let scripts = 0;
  for (const tag of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
    const attribute = tag[0].match(/\b(?:src|href)\s*=\s*["']([^"']+)["']/i);
    if (!attribute) continue;
    const resource = attribute[1];
    if (/^(?:https?:|\/\/|data:)/i.test(resource)) {
      if (tag[1].toLowerCase() === 'script' || /\b(?:stylesheet|modulepreload)\b/i.test(tag[0])) fail('BUILD');
      continue;
    }
    if (tag[1].toLowerCase() === 'script') scripts++;
    add(decodeURIComponent(resource.replace(/^\//, '').split(/[?#]/)[0]));
  }
  if (!scripts || !/\bid\s*=\s*["']root["']/i.test(html)) fail('BUILD');
  // Vite chunks may load only after login. Verify all compiled assets too.
  function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) fail('BUILD');
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(full);
      else add(path.relative(root, full).split(path.sep).join('/'));
    }
  }
  if (fs.existsSync(path.join(root, 'assets'))) walk(path.join(root, 'assets'));
  return [...resources.values()];
}
function inspect(base, inherited = process.env) {
  try {
    const backend = locate(base);
    for (const file of ['.env', 'src/config/db.js', 'public/index.html']) {
      if (!fs.statSync(path.join(backend, file)).isFile()) fail('INSTALLATION');
    }
    const pkg = JSON.parse(fs.readFileSync(path.join(backend, 'package.json'), 'utf8'));
    if (pkg.name !== 'micodent-backend' || pkg.scripts?.start?.trim() !== 'node src/index.js') fail('DEPENDENCIES');
    const localRequire = createRequire(path.join(backend, 'package.json'));
    for (const name of Object.keys(pkg.dependencies || {})) localRequire.resolve(name);
    const parsed = localRequire('dotenv').parse(fs.readFileSync(path.join(backend, '.env')));
    const config = configuration(parsed, inherited);
    const resources = assets(backend, config.backendPort);
    const envStat = fs.statSync(path.join(backend, '.env'));
    const revision = hash(JSON.stringify({ version: VERSION, envModified: envStat.mtimeMs,
      envSize: envStat.size, resources, files: ['src/index.js', 'src/config/db.js', 'package.json']
        .map(file => hash(fs.readFileSync(path.join(backend, file)))) }));
    return { ...config, backend, revision, entry: path.join(backend, 'src/index.js'),
      resources, url: `http://localhost:${config.backendPort}` };
  } catch (error) { fail(MESSAGES[error.code] ? error.code : 'INSTALLATION'); }
}

function logger(folder) {
  try {
    fs.mkdirSync(folder, { recursive: true });
    const file = path.join(folder, 'arranque.log');
    if (fs.existsSync(file) && fs.statSync(file).size > 256 * 1024) {
      const previous = file + '.1';
      if (fs.existsSync(previous)) fs.unlinkSync(previous);
      fs.renameSync(file, previous);
    }
    return code => {
      if (!/^[A-Z_]+$/.test(code)) fail('LOG');
      try { fs.appendFileSync(file, `${new Date().toISOString()} V${VERSION} ${code}\n`); }
      catch { fail('LOG'); }
    };
  } catch { fail('LOG'); }
}
function lock(backend) {
  const name = process.platform === 'win32'
    ? `\\\\.\\pipe\\micodent-arranque-${identity(backend)}`
    : path.join(require('node:os').tmpdir(), `micodent-${identity(backend)}.sock`);
  return new Promise((resolve, reject) => {
    const server = net.createServer(socket => socket.end());
    server.once('error', error => error.code === 'EADDRINUSE' ? resolve(null) : reject(Object.assign(new Error('LOCK'), { code: 'LOCK' })));
    server.listen(name, () => resolve(() => new Promise(done => server.close(done))));
  });
}
function tcp(host, targetPort, timeout) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host, port: targetPort });
    const timer = setTimeout(() => finish(false), timeout);
    let finished = false;
    function finish(value) {
      if (finished) return;
      finished = true; clearTimeout(timer); socket.destroy(); resolve(value);
    }
    socket.once('connect', () => finish(true)); socket.once('error', () => finish(false));
  });
}
function request(targetPort, route, timeout, maxBytes = 16 * 1024 * 1024) {
  return new Promise(resolve => {
    let finished = false;
    const request = http.get({ hostname: '127.0.0.1', port: targetPort, path: route,
      headers: { Host: `localhost:${targetPort}`, 'Cache-Control': 'no-cache' }, agent: false }, response => {
      let size = 0; const chunks = [];
      response.on('data', chunk => {
        size += chunk.length;
        if (size > maxBytes) return finish(null);
        chunks.push(chunk);
      });
      response.on('end', () => finish({ status: response.statusCode, type: response.headers['content-type'] || '', body: Buffer.concat(chunks) }));
      response.on('error', () => finish(null));
    });
    const timer = setTimeout(() => finish(null), timeout);
    function finish(value) {
      if (finished) return;
      finished = true; clearTimeout(timer); request.destroy(); resolve(value);
    }
    request.on('error', () => finish(null));
  });
}
async function healthy(config, timeout) {
  const response = await request(config.backendPort, '/api/health', timeout, 8192);
  if (response?.status !== 200 || !response.type.includes('application/json')) return false;
  try {
    const body = JSON.parse(response.body);
    return body.ok === true && body.status === 'healthy' && body.database === 'connected' && body.backend === 'online';
  } catch { return false; }
}
async function verifyBuild(config, timeout = 3000) {
  const deadline = performance.now() + 300000;
  for (const item of config.resources) {
    if (performance.now() >= deadline) fail('HTTP');
    const response = await request(config.backendPort, item.url === '/index.html' ? '/' : item.url,
      Math.min(timeout, deadline - performance.now()));
    if (!response || response.status !== 200 || hash(response.body) !== item.sha256) fail('HTTP');
    if (/\.m?js$/.test(item.url) && !/(?:javascript|ecmascript)/i.test(response.type)) fail('HTTP');
    if (/\.css$/.test(item.url) && !response.type.includes('text/css')) fail('HTTP');
    if (item.url === '/index.html' && !response.type.includes('text/html')) fail('HTTP');
  }
}
function powershell(script, env, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
    cp.execFile(executable, ['-NoProfile', '-NonInteractive', '-Command', script], {
      env: { ...process.env, ...env }, windowsHide: true, timeout, maxBuffer: 16384,
    }, (error, stdout) => {
      if (!error) return resolve(stdout.trim());
      const code = error.killed ? 'OWNER_TIMEOUT' : 'OWNER';
      reject(Object.assign(new Error(code), { code }));
    });
  });
}
async function owner(config, timeout = 20000) {
  const script = `$ErrorActionPreference='Stop';
    $all=@(Get-NetTCPConnection -State Listen -ErrorAction Stop);
    $ids=@($all | Where-Object LocalPort -eq ([int]$env:MICODENT_CHECK_PORT) | Select-Object -ExpandProperty OwningProcess -Unique);
    if ($ids.Count -eq 0) { 'free'; exit 0 };
    $expected='^"?'+[regex]::Escape($env:MICODENT_CHECK_NODE)+'"?\\s+"?'+[regex]::Escape($env:MICODENT_CHECK_ENTRY)+'"?\\s+'+[regex]::Escape($env:MICODENT_CHECK_REVISION)+'\\s*$';
    foreach ($id in $ids) {
      $p=Get-CimInstance Win32_Process -Filter ('ProcessId='+$id) -ErrorAction Stop;
      if (!$p -or $p.ExecutablePath -ine $env:MICODENT_CHECK_NODE -or $p.CommandLine -notmatch $expected) { 'foreign'; exit 0 }
    }; 'ours'`;
  const result = await powershell(script, { MICODENT_CHECK_PORT: String(config.backendPort),
    MICODENT_CHECK_NODE: process.execPath, MICODENT_CHECK_ENTRY: config.entry,
    MICODENT_CHECK_REVISION: '--micodent-launcher-v4=' + config.revision }, timeout);
  if (!['free', 'ours', 'foreign'].includes(result)) fail('OWNER');
  return result;
}
function start(config) {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(process.execPath, [config.entry, '--micodent-launcher-v4=' + config.revision], { cwd: config.backend,
      env: config.env, detached: true, windowsHide: true, stdio: 'ignore' });
    const state = { exited: false };
    child.once('error', () => reject(Object.assign(new Error('START'), { code: 'START' })));
    child.once('exit', () => { state.exited = true; });
    child.once('spawn', () => { state.pid = child.pid; child.unref(); resolve(state); });
  });
}
async function waitUntil(check, duration, code, interval = 1000) {
  const deadline = performance.now() + duration;
  while (performance.now() < deadline) {
    if (await check(Math.max(1, deadline - performance.now()))) return;
    const remaining = deadline - performance.now();
    if (remaining > 0) await sleep(Math.min(interval, remaining));
  }
  fail(code);
}
async function boot(config, dependencies = {}) {
  const op = { owner, start, tcp, healthy, verifyBuild, waitUntil, log: () => {},
    timeout: 300000, interval: 1000, ...dependencies };
  let ownership = await op.owner(config);
  if (ownership === 'foreign') fail('PORT_BUSY');
  op.log('MYSQL_WAIT');
  await op.waitUntil(remaining => op.tcp(config.dbHost, config.dbPort, Math.min(2000, remaining)),
    op.timeout, 'MYSQL_TIMEOUT', op.interval);
  ownership = await op.owner(config);
  if (ownership === 'foreign') fail('PORT_BUSY');
  let child;
  if (ownership === 'free') { op.log('BACKEND_START'); child = await op.start(config); }
  else op.log('BACKEND_REUSE');
  op.log('BACKEND_WAIT');
  await op.waitUntil(async remaining => {
    if (child?.exited) fail('BACKEND_EXIT');
    const began = performance.now();
    const state = await op.owner(config, Math.min(20000, remaining));
    if (state === 'foreign') fail('PORT_BUSY');
    const left = remaining - (performance.now() - began);
    return state === 'ours' && left > 0 && await op.healthy(config, Math.min(2000, left));
  }, op.timeout, 'BACKEND_TIMEOUT', op.interval);
  op.log('BUILD_CHECK');
  await op.verifyBuild(config);
  if (await op.owner(config) !== 'ours' || !await op.healthy(config, 2000)) fail('HTTP');
  op.log('READY');
}
async function main() {
  let release; let log = () => {};
  try {
    console.log(`MICODENT - Arranque V${VERSION}. Verificando, espere...`);
    if (process.platform !== 'win32' || Number(process.versions.node.split('.')[0]) < 20) fail('PLATFORM');
    if (process.argv.length > 3 || (process.argv[2] && process.argv[2] !== '--comprobar')) fail('CONFIG');
    const config = inspect(__dirname);
    if (process.argv[2] === '--comprobar') {
      console.log(`Archivos y configuracion compatibles. Node ${process.versions.node}.`);
      console.log(`Puerto backend: ${config.backendPort}. Puerto MySQL: ${config.dbPort}. Recursos: ${config.resources.length}.`);
      console.log('SOLO LECTURA: no se iniciaron procesos, no se consulto MySQL ni se verifico el funcionamiento clinico.');
      return;
    }
    release = await lock(config.backend);
    if (!release) { console.log('Ya hay un inicio en curso. Espere a que termine la primera ventana.'); return; }
    if (!process.env.LOCALAPPDATA) fail('LOG');
    const folder = path.join(process.env.LOCALAPPDATA, 'MICODENT', 'arranque-v4', identity(config.backend));
    log = logger(folder); log('BEGIN');
    console.log('Registro de soporte: ' + path.join(folder, 'arranque.log'));
    await boot(config, { log: code => {
      log(code);
      if (code === 'MYSQL_WAIT') console.log('Esperando MySQL (hasta 5 minutos).');
      if (code === 'BACKEND_WAIT') console.log('Esperando la conexion del backend (hasta 5 minutos).');
      if (code === 'BUILD_CHECK') console.log('Verificando los archivos de la interfaz.');
    } });
    console.log('Inicio verificado. Abra ' + config.url);
    try {
      await powershell('Start-Process -FilePath $env:MICODENT_OPEN_URL -ErrorAction Stop', { MICODENT_OPEN_URL: config.url });
    } catch { console.log(MESSAGES.BROWSER); log('BROWSER'); }
  } catch (error) {
    const code = MESSAGES[error.code] ? error.code : 'INTERNAL';
    try { log(code); } catch { /* Never print an exception containing runtime data. */ }
    console.error(`[${code}] ${MESSAGES[code]}`);
    console.error('No se borraron datos ni se detuvo ningun servicio. No reinstale la base de datos.');
    process.exitCode = 1;
  } finally { if (release) await release(); }
}
module.exports = { VERSION, configuration, locate, assets, inspect, logger, lock, tcp, request,
  healthy, verifyBuild, owner, start, waitUntil, boot, identity };
if (require.main === module) main();
