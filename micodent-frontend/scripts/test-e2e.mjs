import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import cypress from 'cypress';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const open = process.argv.includes('--open');
let completed = false;
process.on('exit', () => {
  if (!open && !completed && !process.exitCode) {
    console.error('Cypress ended without a complete result; run in a Windows terminal.');
    process.exitCode = 1;
  }
});
let blockedApiRequests = 0;
const server = await createServer({
  root,
  configFile: false,
  envFile: false,
  plugins: [react(), {
    name: 'micodent-e2e-isolation',
    configureServer(vite) {
      vite.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
        if (pathname === '/__micodent_e2e_health') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ mode: 'synthetic-api-only', database: 'disabled' }));
        } else if (/^\/(api|uploads)(\/|$)/.test(pathname)) {
          // Never proxy a missed intercept to the development or clinical API.
          blockedApiRequests++;
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, mensaje: 'E2E request has no synthetic response.' }));
        } else next();
      });
    },
  }],
  server: { host: '127.0.0.1', port: 4175, strictPort: false, hmr: false },
});
let interrupted = false;
const interrupt = () => { interrupted = true; };
process.on('SIGINT', interrupt);
process.on('SIGTERM', interrupt);
try {
  await server.listen();
  const baseUrl = 'http://127.0.0.1:' + server.httpServer.address().port;
  const health = await (await fetch(baseUrl + '/__micodent_e2e_health')).json();
  if (health.database !== 'disabled') throw new Error('E2E isolation check failed.');
  const probe = await fetch(baseUrl + '/api/health');
  if (probe.status !== 503) throw new Error('E2E API fallback must fail closed.');
  blockedApiRequests = 0;
  const edge = [process.env['PROGRAMFILES(X86)'], process.env.PROGRAMFILES]
    .filter(Boolean).some(dir => existsSync(path.join(dir, 'Microsoft/Edge/Application/msedge.exe')));
  const options = {
    project: root,
    configFile: path.join(root, 'cypress.config.cjs'),
    config: { baseUrl },
    browser: edge ? 'edge' : 'electron',
  };
  console.log('MICODENT E2E: original frontend; synthetic API only; no database/backend.');
  if (open) {
    await cypress.open(options);
  } else {
    const result = await cypress.run({ ...options, headless: true, record: false });
    if ('failures' in result) throw new Error(result.message || 'Cypress failed to start.');
    const evidence = {
      phase: 'CYPRESS_E2E', executedAt: new Date().toISOString(),
      cypressVersion: result.cypressVersion, browser: result.browserName,
      browserVersion: result.browserVersion, totalTests: result.totalTests,
      totalPassed: result.totalPassed, totalFailed: result.totalFailed,
      totalSkipped: result.totalSkipped, totalPending: result.totalPending,
      durationMs: result.totalDuration, blockedApiRequests,
      runs: result.runs.map(run => ({
        spec: run.spec.relative,
        tests: run.tests.map(test => ({
          title: test.title, state: test.state,
          attempts: test.attempts.map(attempt => ({
            state: attempt.state, durationMs: attempt.wallClockDuration,
            error: attempt.error?.message || null,
          })),
        })),
        screenshots: run.screenshots.map(screenshot => ({
          path: path.relative(root, screenshot.path), testFailure: screenshot.testFailure,
        })),
      })),
    };
    const directory = path.join(root, 'test-results/cypress');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'run.json'), JSON.stringify(evidence, null, 2) + '\n');
    completed = true;
    if (result.totalTests !== 10 || result.totalPassed !== 10 || result.totalFailed
      || result.totalSkipped || result.totalPending || blockedApiRequests) process.exitCode = 1;
  }
} finally {
  process.off('SIGINT', interrupt);
  process.off('SIGTERM', interrupt);
  await server.close();
  if (interrupted) process.exitCode = 130;
}
