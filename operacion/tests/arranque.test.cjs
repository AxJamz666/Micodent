'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const net = require('node:net');
const cp = require('node:child_process');
const launcher = require('../arranque-v4/micodent-arranque.cjs');

const valid = { DB_HOST: '127.0.0.1', DB_NAME: 'fixture_only', DB_USER: 'fixture_user' };
const rejects = code => error => error.code === code;
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'MICODENT fixture space ! '));
  t.after(() => {
    const resolved = path.resolve(dir);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('MICODENT fixture space ! '));
    fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  fs.mkdirSync(path.join(dir, 'public/assets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'public/index.html'), '<!doctype html><title>Fixture</title><div id="root"></div><script type="module" src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css">');
  fs.writeFileSync(path.join(dir, 'public/assets/app.js'), 'document.title = "Fixture";');
  fs.writeFileSync(path.join(dir, 'public/assets/app.css'), 'body { color: black; }');
  return dir;
}
async function server(t, handler) {
  const app = http.createServer(handler);
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { app.closeAllConnections(); app.close(resolve); }));
  return app.address().port;
}
function fakeBoot(extra = {}) {
  const events = []; let starts = 0;
  return { events, get starts() { return starts; }, op: {
    owner: async () => starts ? 'ours' : 'free', start: async () => { starts++; return { exited: false }; },
    tcp: async () => true, healthy: async () => true, verifyBuild: async () => {},
    timeout: 80, interval: 1, log: code => events.push(code), ...extra,
  } };
}

test('config: default matches backend MySQL 3306, local host and port validation', () => {
  assert.equal(launcher.configuration(valid, {}).dbPort, 3306);
  assert.equal(launcher.configuration({ ...valid, DB_PORT: '3307', PORT: '4010' }, {}).backendPort, 4010);
  for (const value of ['0', '65536', '3306 & echo unsafe', '12.5', ' 4000', '-1']) {
    assert.throws(() => launcher.configuration({ ...valid, PORT: value }, {}), rejects('CONFIG'));
  }
  assert.throws(() => launcher.configuration({ ...valid, DB_HOST: 'example.com' }, {}), rejects('CONFIG'));
  assert.throws(() => launcher.configuration({ ...valid, PORT: '3306' }, {}), rejects('CONFIG'));
});
test('config: inherited database/port cannot silently override .env', () => {
  assert.throws(() => launcher.configuration(valid, { DB_NAME: 'other_fixture' }), rejects('ENV_CONFLICT'));
  assert.throws(() => launcher.configuration(valid, { PORT: '4400' }), rejects('ENV_CONFLICT'));
  assert.throws(() => launcher.configuration(valid, { NODE_OPTIONS: '--inspect' }), rejects('CONFIG'));
  assert.equal(launcher.configuration(valid, { DB_NAME: valid.DB_NAME }).env.DB_NAME, valid.DB_NAME);
});
test('layout: relative backend, spaces and ambiguous directories', t => {
  const dir = fixture(t); const backend = path.join(dir, 'micodent-backend');
  fs.mkdirSync(path.join(backend, 'src'), { recursive: true });
  fs.writeFileSync(path.join(backend, 'package.json'), '{}');
  fs.writeFileSync(path.join(backend, 'src/index.js'), '');
  assert.equal(launcher.locate(dir), fs.realpathSync(backend));
  assert.equal(launcher.locate(backend), fs.realpathSync(backend));
  fs.mkdirSync(path.join(dir, 'src')); fs.writeFileSync(path.join(dir, 'src/index.js'), '');
  fs.writeFileSync(path.join(dir, 'package.json'), '{}');
  assert.throws(() => launcher.locate(dir), rejects('INSTALLATION'));
});
test('build: includes root, CSS, JS and lazy assets', t => {
  const dir = fixture(t); fs.writeFileSync(path.join(dir, 'public/assets/lazy.js'), 'void 0;');
  assert.equal(launcher.assets(dir, 4000).length, 4);
});
test('build: missing file, traversal and external script fail closed', t => {
  const dir = fixture(t); fs.unlinkSync(path.join(dir, 'public/assets/app.css'));
  assert.throws(() => launcher.assets(dir, 4000), rejects('BUILD'));
  for (const src of ['../outside.js', 'https://example.com/code.js']) {
    fs.writeFileSync(path.join(dir, 'public/index.html'), `<div id="root"></div><script src="${src}"></script>`);
    assert.throws(() => launcher.assets(dir, 4000), rejects('BUILD'));
  }
});
test('build: a compiled API port mismatch is rejected before starting', t => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir, 'public/assets/app.js'), 'const endpoint = "http://localhost:4000/api";');
  assert.throws(() => launcher.assets(dir, 4010), rejects('BUILD_PORT'));
  assert.equal(launcher.assets(dir, 4000).length, 3);
});
test('lock: repeated opens acquire once and release without stale PID files', async t => {
  const dir = fixture(t); const release = await launcher.lock(dir);
  try { assert.equal(await launcher.lock(dir), null); } finally { await release(); }
  const again = await launcher.lock(dir); assert.equal(typeof again, 'function'); await again();
});
test('lock: OS releases it when the owning process exits', async t => {
  const dir = fixture(t);
  const file = require.resolve('../arranque-v4/micodent-arranque.cjs');
  const child = cp.spawn(process.execPath, ['-e', 'require(process.argv[1]).lock(process.argv[2]).then(()=>process.send("locked"))', file, dir],
    { stdio: ['ignore', 'ignore', 'ignore', 'ipc'], windowsHide: true });
  await new Promise((resolve, reject) => { child.once('message', resolve); child.once('error', reject); });
  assert.equal(await launcher.lock(dir), null);
  const exited = new Promise(resolve => child.once('exit', resolve)); child.kill(); await exited;
  // Unix socket files need explicit cleanup after a crash; Windows named pipes do not.
  if (process.platform !== 'win32') fs.unlinkSync(path.join(os.tmpdir(), `micodent-${launcher.identity(dir)}.sock`));
  const release = await launcher.lock(dir); assert.equal(typeof release, 'function'); await release();
});
test('logging: only allowlisted-shaped events, bounded retention, no exception text', t => {
  const dir = fixture(t); const log = launcher.logger(dir); log('BEGIN');
  assert.throws(() => log('password=do-not-print'), rejects('LOG'));
  assert.match(fs.readFileSync(path.join(dir, 'arranque.log'), 'utf8'), /V4.0.0 BEGIN/);
  fs.writeFileSync(path.join(dir, 'arranque.log'), 'x'.repeat(270000));
  launcher.logger(dir)('READY');
  assert.ok(fs.existsSync(path.join(dir, 'arranque.log.1')));
  assert.ok(fs.statSync(path.join(dir, 'arranque.log')).size < 1000);
});
test('boot: cold start once, verifies before READY', async () => {
  const run = fakeBoot(); await launcher.boot({}, run.op);
  assert.equal(run.starts, 1);
  assert.deepEqual(run.events, ['MYSQL_WAIT', 'BACKEND_START', 'BACKEND_WAIT', 'BUILD_CHECK', 'READY']);
});
test('boot: healthy same installation reused with no new process', async () => {
  const run = fakeBoot({ owner: async () => 'ours' }); await launcher.boot({}, run.op);
  assert.equal(run.starts, 0); assert.ok(run.events.includes('BACKEND_REUSE'));
});
test('boot: existing slow backend waits instead of false port conflict', async () => {
  let attempts = 0;
  const run = fakeBoot({ owner: async () => 'ours', healthy: async () => ++attempts >= 3 });
  await launcher.boot({}, run.op); assert.equal(run.starts, 0); assert.ok(attempts >= 3);
});
test('boot: delayed database recovers without configuration or restart', async () => {
  let attempts = 0; const run = fakeBoot({ tcp: async () => ++attempts > 3 });
  await launcher.boot({}, run.op); assert.equal(run.starts, 1); assert.equal(attempts, 4);
});
test('boot: unavailable DB does not start Node or signal READY', async () => {
  const run = fakeBoot({ tcp: async () => false, timeout: 15 });
  await assert.rejects(launcher.boot({}, run.op), rejects('MYSQL_TIMEOUT'));
  assert.equal(run.starts, 0); assert.ok(!run.events.includes('READY'));
});
test('boot: foreign port is never killed or adopted', async () => {
  const run = fakeBoot({ owner: async () => 'foreign' });
  await assert.rejects(launcher.boot({}, run.op), rejects('PORT_BUSY'));
  assert.equal(run.starts, 0); assert.equal(run.events.length, 0);
});
test('boot: cannot inspect owner, or lost race to foreign process', async () => {
  const run = fakeBoot({ owner: async () => { throw Object.assign(new Error(), { code: 'OWNER' }); } });
  await assert.rejects(launcher.boot({}, run.op), rejects('OWNER'));
  let calls = 0;
  const raced = fakeBoot({ owner: async () => ++calls > 1 ? 'foreign' : 'free' });
  await assert.rejects(launcher.boot({}, raced.op), rejects('PORT_BUSY')); assert.equal(raced.starts, 0);
});
test('boot: child exit and persistent unhealthy response remain failures', async () => {
  const dead = fakeBoot({ start: async () => ({ exited: true }) });
  await assert.rejects(launcher.boot({}, dead.op), rejects('BACKEND_EXIT'));
  const unhealthy = fakeBoot({ healthy: async () => false, timeout: 15 });
  await assert.rejects(launcher.boot({}, unhealthy.op), rejects('BACKEND_TIMEOUT'));
  assert.ok(!unhealthy.events.includes('READY'));
});
test('boot: broken build and last-minute DB failure cannot signal READY', async () => {
  const broken = fakeBoot({ verifyBuild: async () => { throw Object.assign(new Error(), { code: 'HTTP' }); } });
  await assert.rejects(launcher.boot({}, broken.op), rejects('HTTP'));
  let checks = 0; const dropped = fakeBoot({ healthy: async () => ++checks === 1 });
  await assert.rejects(launcher.boot({}, dropped.op), rejects('HTTP'));
  assert.ok(!dropped.events.includes('READY'));
});
test('clock: polling includes probe execution time in deadline', async () => {
  const start = performance.now();
  await assert.rejects(launcher.waitUntil(async left => { await new Promise(r => setTimeout(r, Math.min(20, left))); return false; }, 60, 'MYSQL_TIMEOUT', 5), rejects('MYSQL_TIMEOUT'));
  assert.ok(performance.now() - start < 180);
});
test('TCP and HTTP: bounded real network probes and oversized body rejection', async t => {
  const targetPort = await server(t, (_req, res) => { res.writeHead(200); res.end('x'.repeat(100)); });
  assert.equal(await launcher.tcp('127.0.0.1', targetPort, 1000), true);
  assert.equal(await launcher.request(targetPort, '/', 1000, 10), null);
  const hungPort = await server(t, () => {});
  const began = performance.now(); assert.equal(await launcher.request(hungPort, '/', 50), null);
  assert.ok(performance.now() - began < 500);
});
test('HTTP: health contract and exact compiled resources, not HTML fallback', async t => {
  const dir = fixture(t); let broken = false; let health = true;
  const targetPort = await server(t, (req, res) => {
    if (req.url === '/api/health') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: health, status: 'healthy', backend: 'online', database: 'connected' }));
    }
    const file = path.join(dir, 'public', req.url === '/' ? 'index.html' : req.url.slice(1));
    res.setHeader('Content-Type', broken ? 'text/html' : req.url.endsWith('.js') ? 'application/javascript' : req.url.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(broken ? '<html>Fallback</html>' : fs.readFileSync(file));
  });
  const config = { backendPort: targetPort, resources: launcher.assets(dir, targetPort) };
  assert.equal(await launcher.healthy(config, 1000), true); await launcher.verifyBuild(config);
  health = false; assert.equal(await launcher.healthy(config, 1000), false);
  broken = true; await assert.rejects(launcher.verifyBuild(config), rejects('HTTP'));
});
test('Windows: real hidden Node, ownership, reuse, changed revision and foreign port', {
  skip: process.platform !== 'win32', timeout: 90000,
}, async t => {
  const dir = fixture(t); fs.mkdirSync(path.join(dir, 'src'));
  const probe = net.createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r));
  const targetPort = probe.address().port; await new Promise(r => probe.close(r));
  const entry = path.join(dir, 'src/index.js');
  fs.writeFileSync(entry, `const http=require('node:http'); const fs=require('node:fs'); const path=require('node:path');
    http.createServer((req,res)=>{if(req.url==='/api/health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,status:'healthy',backend:'online',database:'connected'}));return;}
    const name=req.url==='/'?'index.html':req.url.slice(1);res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(__dirname,'../public',name)));}).listen(${targetPort},'127.0.0.1');`);
  const config = { backend: dir, entry, backendPort: targetPort, revision: 'synthetic-test',
    resources: launcher.assets(dir, targetPort), env: { ...process.env } };
  assert.equal(await launcher.owner(config), 'free');
  const child = await launcher.start(config);
  try {
    await launcher.waitUntil(left => launcher.tcp('127.0.0.1', targetPort, Math.min(100, left)), 5000, 'START', 30);
    assert.equal(await launcher.owner(config), 'ours');
    assert.equal(await launcher.owner({ ...config, revision: 'changed' }), 'foreign');
    let starts = 0;
    await launcher.boot(config, { tcp: async () => true, timeout: 15000, start: async () => { starts++; } });
    assert.equal(starts, 0);
    assert.equal(await launcher.owner({ ...config, entry: path.join(dir, 'different.js') }), 'foreign');
  } finally {
    // Only the synthetic child PID returned by this test is stopped.
    if (!child.exited) process.kill(child.pid);
    await launcher.waitUntil(async () => child.exited, 5000, 'START', 30);
  }
});

test('Windows: detached backend survives launcher process exit', {
  skip: process.platform !== 'win32', timeout: 20000,
}, async t => {
  const dir = fixture(t); const entry = path.join(dir, 'synthetic.cjs');
  fs.writeFileSync(entry, 'setInterval(()=>{}, 1000);');
  const file = require.resolve('../arranque-v4/micodent-arranque.cjs');
  const parent = cp.spawn(process.execPath, ['-e',
    'require(process.argv[1]).start({backend:process.argv[2],entry:process.argv[3],revision:"fixture",env:process.env}).then(c=>console.log(c.pid))', file, os.tmpdir(), entry],
  { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
  let output = ''; parent.stdout.on('data', chunk => { output += chunk; });
  const code = await new Promise((resolve, reject) => { parent.once('exit', resolve); parent.once('error', reject); });
  assert.equal(code, 0); const pid = Number(output.trim()); assert.ok(Number.isSafeInteger(pid) && pid > 0);
  try { assert.equal(process.kill(pid, 0), true); } finally {
    process.kill(pid);
    await launcher.waitUntil(async () => { try { process.kill(pid, 0); return false; } catch { return true; } }, 5000, 'START', 30);
  }
});

test('Windows: actual BAT propagates failure without exposing internals', {
  skip: process.platform !== 'win32', timeout: 10000,
}, t => {
  const dir = fixture(t);
  for (const name of ['iniciar_micodent.bat', 'micodent-arranque.cjs']) {
    fs.copyFileSync(path.join(__dirname, '../arranque-v4', name), path.join(dir, name));
  }
  const result = cp.spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'call "%MICODENT_TEST_BAT%"'], {
    env: { ...process.env, MICODENT_TEST_BAT: path.join(dir, 'iniciar_micodent.bat') },
    input: '\n', windowsHide: true, windowsVerbatimArguments: true, encoding: 'utf8', timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[INSTALLATION\]/);
  assert.doesNotMatch(result.stderr, /at Object|at main|ENOENT|password/i);
});
