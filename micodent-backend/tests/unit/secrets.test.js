const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const { scanText, scanFrontendEnv, scanDirectory, scanIndex, scanHistory, loadKnownSecrets, privatePath, LEGACY_NOTICE } = require('../../scripts/check-secrets');
const synthetic = ['synthetic', 'm02', 'not-a-real-secret', '2026'].join('-');
const jwtKey = ['JWT', 'SECRET'].join('_');
const dbKey = ['DB', 'PASSWORD'].join('_');

test('known secret copies report location and never the value', () => {
  const result = scanText('first line\n' + synthetic, 'fixture.js', [synthetic]);
  assert.equal(result[0].line, 2);
  assert.equal(result[0].rule, 'KNOWN_SECRET_COPY');
  assert.ok(!JSON.stringify(result).includes(synthetic));
});

test('detects credential assignments in dotenv, JavaScript and JSON', () => {
  for (const content of [jwtKey + '=' + synthetic, 'const ' + jwtKey + ' = "' + synthetic + '";',
    JSON.stringify({ [dbKey]: synthetic })]) {
    const result = scanText(content, 'fixture.txt');
    assert.ok(result.some(f => f.rule === 'CREDENTIAL_LITERAL'));
    assert.ok(!JSON.stringify(result).includes(synthetic));
  }
});

test('empty templates and explicit placeholders are not usable credential literals', () => {
  const source = jwtKey + '=\nJWT_EXPIRES_IN=8h\n' + dbKey + '=\n';
  assert.deepEqual(scanText(source, '.env.example'), []);
  assert.deepEqual(scanText(jwtKey + '="<GENERATE_PRIVATELY>"', '.env.example'), []);
  assert.deepEqual(scanText(dbKey + '= # fill privately', '.env.example'), []);
});

test('flags private key material and complete JWT literals', () => {
  const key = ['-----BEGIN', 'PRIVATE KEY-----'].join(' ');
  const token = [Buffer.from('{"alg":"HS256"}').toString('base64url'),
    Buffer.from('{"sub":"synthetic"}').toString('base64url'), 'x'.repeat(32)].join('.');
  assert.ok(scanText(key, 'fixture.txt').some(f => f.rule === 'PRIVATE_KEY'));
  assert.ok(scanText(token, 'fixture.js').some(f => f.rule === 'JWT_LITERAL'));
});

test('flags passwords in connection URLs without echoing them', () => {
  const url = ['mysql:', '//qa:', synthetic, '@localhost/schema'].join('');
  const findings = scanText(url, 'fixture.js');
  assert.ok(findings.some(f => f.rule === 'URL_CREDENTIALS'));
  assert.ok(!JSON.stringify(findings).includes(synthetic));
});

test('frontend secret names and disguised known values are rejected', () => {
  const named = scanFrontendEnv('VITE_' + jwtKey + '=' + synthetic, '.env', []);
  const disguised = scanFrontendEnv('VITE_PUBLIC_CONFIG=' + synthetic, '.env', [synthetic]);
  assert.equal(named[0].rule, 'FRONTEND_SECRET_VARIABLE');
  assert.equal(disguised[0].rule, 'FRONTEND_KNOWN_SECRET');
});

test('both existing public frontend URL variables remain supported', () => {
  const source = 'VITE_API_BASE_URL=http://localhost:4000/api\nVITE_API_URL=http://localhost:4000';
  assert.deepEqual(scanFrontendEnv(source, '.env', [synthetic]), []);
});

test('private paths are blocked without blocking example templates', () => {
  for (const file of ['backend/.env', 'frontend/.env.production', 'backend/.ENV', 'credentials.json', 'backend_completo.txt',
    'frontend_completo.txt', 'snapshot.sql', 'copy.zip', 'key.pem', '.npmrc', 'backend/src/uploads/file.png', '.runtime/server.log']) {
    assert.equal(privatePath(file), true, file);
  }
  for (const file of ['backend/.env.example', 'src/config/environment.js', 'package.json']) assert.equal(privatePath(file), false, file);
});

test('workspace allows private configuration while source artifacts reject it', t => {
  const temp = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(temp, 'micodent-m02-'));
  t.after(() => {
    if (path.dirname(fs.realpathSync(dir)) !== temp || !path.basename(dir).startsWith('micodent-m02-')) throw new Error('CLEANUP_GUARD');
    fs.rmSync(dir, { recursive: true });
  });
  fs.mkdirSync(path.join(dir, 'micodent-backend'));
  fs.writeFileSync(path.join(dir, 'micodent-backend/.env'), dbKey + '=' + synthetic);
  fs.writeFileSync(path.join(dir, 'micodent-backend/.env.example'), dbKey + '=\n' + jwtKey + '=\n');
  assert.deepEqual(scanDirectory(dir, { knownSecrets: [synthetic] }).findings, []);
  const artifact = scanDirectory(dir, { knownSecrets: [synthetic], artifact: true });
  assert.ok(artifact.findings.some(f => f.rule === 'PRIVATE_FILE_IN_DELIVERABLE'));
  assert.ok(artifact.findings.some(f => f.rule === 'KNOWN_SECRET_COPY'));
});

test('auxiliary exports and source-artifact dependency folders are rejected', t => {
  const temp = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(temp, 'micodent-m02-'));
  t.after(() => {
    if (path.dirname(fs.realpathSync(dir)) !== temp || !path.basename(dir).startsWith('micodent-m02-')) throw new Error('CLEANUP_GUARD');
    fs.rmSync(dir, { recursive: true });
  });
  fs.mkdirSync(path.join(dir, 'node_modules'));
  fs.writeFileSync(path.join(dir, 'backend_completo.txt'), 'synthetic export');
  const findings = scanDirectory(dir, { artifact: true }).findings;
  assert.ok(findings.some(f => f.rule === 'PRIVATE_FILE_IN_DELIVERABLE'));
  assert.ok(findings.some(f => f.rule === 'EXCLUDED_SOURCE_DIRECTORY'));
});

test('legacy reset is checked statically, never executed', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../actualizar-credenciales.js'), 'utf8');
  assert.equal(source.replaceAll('\r\n', '\n'), LEGACY_NOTICE);
  assert.deepEqual(scanText(source, 'actualizar-credenciales.js'), []);
  assert.ok(scanText('legacy database write', 'actualizar-credenciales.js').some(f => f.rule === 'LEGACY_RESET_NOT_DISABLED'));
});

test('unknown CLI arguments fail without leaking configuration or internal errors', () => {
  const result = cp.spawnSync(process.execPath, [path.resolve(__dirname, '../../scripts/check-secrets.js'), '--unknown'],
    { encoding: 'utf8', timeout: 10000, windowsHide: true });
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^SECRET_SCAN_FAILED:/);
  assert.ok(!result.stderr.includes('Error:'));
});

test('index scanning catches a staged secret independently of the working file', () => {
  const runGit = args => args[0] === 'ls-files' ? '100644 abcdef 0\tsrc/example.js\0' : 'const data = "' + synthetic + '";';
  const result = scanIndex([synthetic], runGit);
  assert.ok(result.some(f => f.scope === 'git-index' && f.rule === 'KNOWN_SECRET_COPY'));
  assert.ok(!JSON.stringify(result).includes(synthetic));
});

test('index scanning rejects private files even when they contain no literal secrets', () => {
  const result = scanIndex([], args => args[0] === 'ls-files' ? '100644 abcdef 0\tbackend/.env\0' : 'PORT=4000');
  assert.ok(result.some(f => f.rule === 'PRIVATE_FILE_TRACKED'));
});

test('index conflicts and linked entries cannot be reported as clean', () => {
  const result = scanIndex([], args => args[0] === 'ls-files' ? '120000 abcdef 2\tlink\0' : 'synthetic');
  assert.ok(result.some(f => f.rule === 'UNMERGED_INDEX'));
  assert.ok(result.some(f => f.rule === 'LINKED_INDEX_ENTRY_REQUIRES_REVIEW'));
});

test('a configuration copy under public is not treated as legitimate private configuration', t => {
  const temp = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(temp, 'micodent-m02-'));
  t.after(() => {
    if (path.dirname(fs.realpathSync(dir)) !== temp || !path.basename(dir).startsWith('micodent-m02-')) throw new Error('CLEANUP_GUARD');
    fs.rmSync(dir, { recursive: true });
  });
  fs.mkdirSync(path.join(dir, 'micodent-frontend/public'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'micodent-frontend/public/.env'), jwtKey + '=' + synthetic);
  const result = scanDirectory(dir, { knownSecrets: [synthetic] });
  assert.ok(result.findings.some(f => f.rule === 'PRIVATE_FILE_IN_DELIVERABLE'));
  assert.ok(result.findings.some(f => f.rule === 'KNOWN_SECRET_COPY'));
});

function fixture(t) {
  const parent = fs.realpathSync(os.tmpdir());
  const folder = fs.mkdtempSync(path.join(parent, 'micodent-m02-'));
  t.after(() => {
    if (path.dirname(fs.realpathSync(folder)) !== parent || !path.basename(folder).startsWith('micodent-m02-')) throw new Error('CLEANUP_GUARD');
    fs.rmSync(folder, { recursive: true });
  });
  return folder;
}

test('only exact reviewed financial migrations pass, never renamed data dumps', () => {
  for (const name of ['001_hotfix_finanzas.sql', '002_pos.sql']) {
    const file = 'micodent-backend/migrations/' + name;
    const sql = fs.readFileSync(path.resolve(__dirname, '../../migrations', name), 'utf8');
    assert.equal(privatePath(file), false);
    assert.deepEqual(scanText(sql, file), []);
    assert.deepEqual(scanText(sql.replaceAll('\r\n', '\n').replaceAll('\n', '\r\n'), file), []);
    assert.ok(scanText(sql + '\n-- altered content', file).some(f => f.rule === 'SQL_CONTENT_NOT_REVIEWED'));
    assert.equal(privatePath('database/' + name), true);
    assert.ok(scanText(sql, 'database/' + name).some(f => f.rule === 'SQL_CONTENT_NOT_REVIEWED'));
  }
});

test('reviewed SQL paths still receive known-secret checks', () => {
  const file = 'micodent-backend/migrations/002_pos.sql';
  const sql = fs.readFileSync(path.resolve(__dirname, '../../migrations/002_pos.sql'), 'utf8');
  assert.ok(scanText(sql + synthetic, file, [synthetic]).some(f => f.rule === 'KNOWN_SECRET_COPY'));
  assert.ok(scanIndex([], args => args[0] === 'ls-files' ? `100644 abcdef 0\t${file}\0` : 'SELECT 1;')
    .some(f => f.rule === 'SQL_CONTENT_NOT_REVIEWED'));
});

test('private runtime and all uploads are skipped locally but rejected in deliverables', t => {
  const folder = fixture(t);
  for (const name of ['.runtime', 'uploads']) {
    fs.mkdirSync(path.join(folder, name));
    fs.writeFileSync(path.join(folder, name, 'private.txt'), synthetic);
  }
  fs.writeFileSync(path.join(folder, '.git'), 'gitdir: synthetic-pointer');
  assert.deepEqual(scanDirectory(folder, { knownSecrets: [synthetic] }).findings, []);
  const result = scanDirectory(folder, { artifact: true });
  for (const file of ['.runtime', 'uploads', '.git']) assert.ok(result.findings.some(f => f.file === file));
  assert.equal(privatePath('elsewhere/uploads/patient.png'), true);
});

test('external private references are read only, combined and required to be complete', t => {
  const folder = fixture(t);
  const first = path.join(folder, 'one.env'), second = path.join(folder, 'two.env');
  const content = `${jwtKey}=${synthetic}\n${dbKey}=${synthetic}-database\n`;
  fs.writeFileSync(first, content);
  fs.writeFileSync(second, content.replaceAll(synthetic, synthetic + '-other'));
  assert.equal(loadKnownSecrets([first, second].join(path.delimiter)).length, 4);
  assert.equal(fs.readFileSync(first, 'utf8'), content);
  assert.throws(() => loadKnownSecrets(''));
  assert.throws(() => loadKnownSecrets('relative.env'));
  assert.throws(() => loadKnownSecrets(first + path.delimiter));
  fs.writeFileSync(second, `${jwtKey}=${synthetic}`);
  assert.throws(() => loadKnownSecrets(second));
});

test('history scans HEAD ancestors and cannot ignore linked entries', () => {
  const calls = [];
  const result = scanHistory([synthetic], args => {
    calls.push(args);
    if (args[0] === 'rev-list') return 'abcdef\n';
    if (args[0] === 'ls-tree') return '100644 blob 123456\tsrc/file.js\0' +
      '120000 blob 789abc\tlinked\0' + '160000 commit def123\tsubmodule\0';
    return synthetic;
  });
  assert.deepEqual(calls[0], ['rev-list', 'HEAD']);
  assert.ok(result.findings.some(f => f.rule === 'KNOWN_SECRET_COPY'));
  assert.equal(result.findings.filter(f => f.rule === 'LINKED_HISTORY_ENTRY_REQUIRES_REVIEW').length, 2);
});

test('packaging refuses missing secret reference before creating any deliverable', () => {
  const releases = path.resolve(__dirname, '../../../.runtime/releases');
  const before = fs.existsSync(releases) ? fs.readdirSync(releases).sort() : [];
  const result = cp.spawnSync(process.execPath, [path.resolve(__dirname, '../../scripts/package-hotfix.cjs')], {
    encoding: 'utf8', timeout: 10000, windowsHide: true,
    env: { ...process.env, MICODENT_SECRET_REFERENCES: '' },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /PACKAGE_SECURITY_CHECK_FAILED/);
  assert.equal(result.stdout, '');
  assert.deepEqual(fs.existsSync(releases) ? fs.readdirSync(releases).sort() : [], before);
});
