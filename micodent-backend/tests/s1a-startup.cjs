const assert = require('node:assert/strict');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async ({ conn, base }) => {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const launch = () => spawn(process.execPath, [path.resolve(__dirname, '../src/index.js')], {
    windowsHide: true, stdio: 'ignore', env: { ...process.env, PORT: String(port) }
  });
  const stop = async child => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, 'exit'); child.kill(); await exited;
  };
  let child = launch();
  try {
    let healthy = false;
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && child.exitCode === null) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(1000) });
        const body = await response.json();
        if (response.ok && body.version === 'rc4-s1b-dev') { healthy = true; break; }
      } catch { /* The child may still be starting. */ }
      await delay(100);
    }
    assert(healthy, 'El proceso real debe servir health con ambas migraciones verificadas.');
  } finally { await stop(child); }
  const [[marker]] = await conn.query("SELECT checksum FROM micodent_migrations WHERE id='001_s1a'");
  try {
    await conn.query("UPDATE micodent_migrations SET checksum=? WHERE id='001_s1a'", ['0'.repeat(64)]);
    const response = await fetch(base + '/api/health');
    assert.equal(response.status, 503); assert.equal((await response.json()).reason, 'schema_pending');
    child = launch();
    const exited = once(child, 'exit');
    let timer;
    const result = await Promise.race([exited, new Promise(resolve => { timer = setTimeout(() => resolve(null), 15000); })]);
    clearTimeout(timer);
    assert(result, 'El arranque debe rechazar un checksum incorrecto.');
    assert.equal(result[0], 1);
  } finally {
    await stop(child);
    await conn.query("UPDATE micodent_migrations SET checksum=? WHERE id='001_s1a'", [marker.checksum]);
  }
  assert.equal((await fetch(base + '/api/health')).status, 200);
};
