const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const dotenv = require('dotenv');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '../..');
const MAX_BYTES = 16 * 1024 * 1024;
const SKIP_DIRS = new Set(['.git', '.runtime', 'node_modules', 'coverage', 'test-results', 'playwright-report']);
const TEXT = /(?:\.(?:js|jsx|mjs|cjs|ts|tsx|json|txt|md|html|css|svg|ya?ml|bat|ps1|ini|conf|log|pem|key|sql)|\.env(?:\.[^/]*)?)$/i;
// Reviewed schema migrations only. A changed SQL file needs a fresh content review.
const REVIEWED_SQL = new Map([
  ['micodent-backend/migrations/001_hotfix_finanzas.sql', '873a049851041c9d09a6f76b841659b92da850ab37b6f6ee6cdca95daabd2bb1'],
  ['micodent-backend/migrations/002_pos.sql', '265c10a84deeede06a0f3b514088001df4ec8d96786433a7075f6c7d6db146a3'],
]);
const LEGACY_NOTICE = "// Disabled legacy reset tool. No database access or credential changes.\nconsole.error('Herramienta deshabilitada. Usa el cambio o restablecimiento protegido de contrasena de MICODENT.');\nprocess.exitCode = 1;\n";
const relative = value => value.replaceAll('\\', '/');
const placeholder = value => !value.trim() || /^<[^<>]+>$/.test(value.trim());

function privatePath(file) {
  const name = path.posix.basename(relative(file));
  const lower = name.toLowerCase();
  return (lower.startsWith('.env') && lower !== '.env.example')
    || (/\.sql$/i.test(name) && !REVIEWED_SQL.has(relative(file)))
    || /_completo\.txt$|^credentials\.json$|\.(?:zip|pem|key|p12|pfx)$|^\.npmrc$/i.test(name)
    || /(?:^|\/)(?:uploads|\.runtime|\.git)(?:\/|$)/i.test(relative(file));
}

function scanText(content, file, knownSecrets = []) {
  const findings = [];
  const add = (rule, index) => findings.push({ file, line: content.slice(0, index).split('\n').length, rule });
  if (/\.sql$/i.test(file)) {
    const hash = crypto.createHash('sha256').update(content.replaceAll('\r\n', '\n')).digest('hex');
    if (REVIEWED_SQL.get(relative(file)) !== hash) add('SQL_CONTENT_NOT_REVIEWED', 0);
  }
  for (const secret of knownSecrets) {
    if (!secret) continue;
    const index = content.indexOf(secret);
    if (index !== -1) add('KNOWN_SECRET_COPY', index);
  }
  const keys = '(?:JWT_SECRET|DB_PASSWORD|API_KEY|CLIENT_SECRET|ACCESS_TOKEN|REFRESH_TOKEN)';
  const quoted = new RegExp('\\b' + keys + '["\']?\\s*[:=]\\s*(["\x27`])([^\\r\\n]*?)\\1', 'gi');
  const assignment = new RegExp('^[ \\t]*' + keys + '[ \\t]*=[ \\t]*([^\\r\\n#]+)', 'gmi');
  for (const regex of [quoted, assignment]) {
    for (const match of content.matchAll(regex)) {
      const value = regex === quoted ? match[2] : match[1].trim().replace(/^(["'])|(["'])$/g, '');
      if (!placeholder(value)) add('CREDENTIAL_LITERAL', match.index);
    }
  }
  for (const match of content.matchAll(/-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g)) add('PRIVATE_KEY', match.index);
  for (const match of content.matchAll(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g)) add('JWT_LITERAL', match.index);
  for (const match of content.matchAll(/(?:https?|mysql|postgres(?:ql)?):\/\/[^\s/@:]+:[^\s/@]+@/gi)) add('URL_CREDENTIALS', match.index);
  if (path.posix.basename(file) === 'actualizar-credenciales.js'
      && content.replaceAll('\r\n', '\n') !== LEGACY_NOTICE) add('LEGACY_RESET_NOT_DISABLED', 0);
  return findings;
}

function scanFrontendEnv(content, file, knownSecrets) {
  const findings = [];
  for (const [key, value] of Object.entries(dotenv.parse(content))) {
    if (!key.startsWith('VITE_')) continue;
    if (/SECRET|PASSWORD|TOKEN|PRIVATE_KEY|API_KEY/i.test(key) && value) findings.push({ file, rule: 'FRONTEND_SECRET_VARIABLE' });
    if (value && knownSecrets.some(secret => secret && value.includes(secret))) findings.push({ file, rule: 'FRONTEND_KNOWN_SECRET' });
    if (/^[a-z]+:\/\/[^\s/@:]+:[^\s/@]+@/i.test(value)) findings.push({ file, rule: 'FRONTEND_URL_CREDENTIALS' });
  }
  return findings;
}

function scanDirectory(folder, { knownSecrets = [], artifact = false } = {}) {
  const findings = []; let scanned = 0;
  function walk(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, item.name);
      const name = relative(path.relative(folder, full));
      if (item.isSymbolicLink()) { findings.push({ file: name, rule: 'SYMLINK_REQUIRES_REVIEW' }); continue; }
      if (item.isDirectory()) {
        if (SKIP_DIRS.has(item.name.toLowerCase())) {
          if (artifact) findings.push({ file: name, rule: 'EXCLUDED_SOURCE_DIRECTORY' });
          continue;
        }
        if (item.name.toLowerCase() === 'uploads') {
          if (artifact) findings.push({ file: name, rule: 'CLINICAL_FILES_IN_SOURCE_ARTIFACT' });
          continue;
        }
        walk(full); continue;
      }
      if (!item.isFile()) continue;
      if (name === '.git' && !artifact) continue; // Git worktree pointer, never an artifact file.
      const isEnv = item.name.toLowerCase() === '.env' || item.name.toLowerCase().startsWith('.env.');
      const isExample = item.name.toLowerCase() === '.env.example';
      const privateConfig = isEnv && !isExample && ['micodent-backend', 'micodent-frontend'].includes(path.posix.dirname(name));
      if (privatePath(name) && (artifact || !privateConfig)) {
        findings.push({ file: name, rule: 'PRIVATE_FILE_IN_DELIVERABLE' });
      }
      if (!TEXT.test(name)) continue;
      if (fs.statSync(full).size > MAX_BYTES) { findings.push({ file: name, rule: 'FILE_TOO_LARGE_FOR_SCAN' }); continue; }
      const text = fs.readFileSync(full, 'utf8'); scanned++;
      if (privateConfig && !artifact) {
        if (name.startsWith('micodent-frontend/')) findings.push(...scanFrontendEnv(text, name, knownSecrets));
        continue;
      }
      findings.push(...scanText(text, name, knownSecrets));
    }
  }
  if (fs.lstatSync(folder).isSymbolicLink()) throw new Error('SYMLINK_ROOT_REJECTED');
  walk(folder);
  return { findings, scanned };
}

function git(args) {
  return cp.execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
}

function scanHistory(knownSecrets, runGit = git) {
  const commits = runGit(['rev-list', 'HEAD']).trim().split('\n').filter(Boolean);
  const seen = new Set(), findings = [];
  for (const commit of commits) {
    for (const entry of runGit(['ls-tree', '-r', '-z', commit]).split('\0').filter(Boolean)) {
      const match = entry.match(/^(\d+) (blob|commit) ([a-f0-9]+)\t([\s\S]+)$/);
      if (!match) throw new Error('UNEXPECTED_HISTORY_ENTRY');
      const [, mode, type, oid, name] = match;
      if (mode === '120000' || type === 'commit') findings.push({ file: name, rule: 'LINKED_HISTORY_ENTRY_REQUIRES_REVIEW' });
      if (privatePath(name)) findings.push({ file: name, commit: commit.slice(0, 8), rule: 'PRIVATE_FILE_IN_HISTORY' });
      // The same blob can appear under different paths; path-dependent rules need both.
      const identity = oid + ':' + name;
      if (seen.has(identity) || !TEXT.test(name) || type !== 'blob') continue;
      seen.add(identity);
      const content = runGit(['cat-file', 'blob', oid]);
      if (Buffer.byteLength(content) > MAX_BYTES) { findings.push({ file: name, rule: 'FILE_TOO_LARGE_FOR_SCAN' }); continue; }
      findings.push(...scanText(content, name, knownSecrets).map(f => ({ ...f, commit: commit.slice(0, 8) })));
    }
  }
  return { findings, commits: commits.length, uniqueTextEntries: seen.size };
}

function scanIndex(knownSecrets = [], runGit = git) {
  const findings = [];
  for (const entry of runGit(['ls-files', '--stage', '-z']).split('\0').filter(Boolean)) {
    const match = entry.match(/^(\d+) ([a-f0-9]+) (\d)\t([\s\S]+)$/);
    if (!match) throw new Error('UNEXPECTED_INDEX_ENTRY');
    const [, mode, oid, stage, name] = match;
    if (stage !== '0') findings.push({ file: name, rule: 'UNMERGED_INDEX' });
    if (mode === '120000' || mode === '160000') findings.push({ file: name, rule: 'LINKED_INDEX_ENTRY_REQUIRES_REVIEW' });
    if (privatePath(name)) findings.push({ file: name, rule: 'PRIVATE_FILE_TRACKED' });
    if (TEXT.test(name) && mode !== '160000') {
      const content = runGit(['cat-file', 'blob', oid]);
      if (Buffer.byteLength(content) > MAX_BYTES) findings.push({ file: name, rule: 'FILE_TOO_LARGE_FOR_SCAN' });
      else findings.push(...scanText(content, name, knownSecrets).map(f => ({ ...f, scope: 'git-index' })));
    }
  }
  return findings;
}

function loadKnownSecrets(references = process.env.MICODENT_SECRET_REFERENCES) {
  const files = references === undefined ? [path.join(ROOT, 'micodent-backend/.env')] : references.split(path.delimiter);
  const secrets = [];
  for (const file of files) {
    if (!file || !path.isAbsolute(file) || fs.lstatSync(file).isSymbolicLink()) throw new Error('LOCAL_SECRET_REFERENCE_REQUIRED');
    const env = dotenv.parse(fs.readFileSync(file));
    if (!env.JWT_SECRET || !env.DB_PASSWORD) throw new Error('LOCAL_SECRET_REFERENCE_REQUIRED');
    secrets.push(...Object.entries(env).filter(([key, value]) => /SECRET|PASSWORD|TOKEN|API_KEY/i.test(key) && value).map(([, value]) => value));
  }
  return [...new Set(secrets)];
}

function run(args = process.argv.slice(2)) {
  const patternsOnly = args.includes('--patterns-only');
  const artifactIndex = args.indexOf('--artifact');
  const artifact = artifactIndex === -1 ? null : args[artifactIndex + 1];
  if (args.some((arg, index) => !['--history', '--artifact', '--patterns-only'].includes(arg) && !(artifactIndex !== -1 && index === artifactIndex + 1))
      || (artifactIndex !== -1 && (!artifact || artifact.startsWith('--')))) throw new Error('INVALID_SCAN_ARGUMENTS');
  const knownSecrets = patternsOnly ? [] : loadKnownSecrets();
  const result = scanDirectory(artifact ? path.resolve(artifact) : ROOT, { knownSecrets, artifact: Boolean(artifact) });
  let history;
  if (!artifact) result.findings.push(...scanIndex(knownSecrets));
  if (args.includes('--history')) { history = scanHistory(knownSecrets); result.findings.push(...history.findings); }
  const unique = [...new Map(result.findings.map(f => [JSON.stringify(f), f])).values()];
  const report = { ok: unique.length === 0, mode: artifact ? 'source-artifact' : 'workspace', scannedTextFiles: result.scanned,
    knownSecretComparison: !patternsOnly, history: history ? { ref: 'HEAD', commits: history.commits, uniqueTextEntries: history.uniqueTextEntries } : null,
    findings: unique, limitations: ['Pattern and exact-value checks, not a guarantee against every unknown or encoded secret.',
      'No database access, remote fetch, history rewrite or automatic cleanup.', 'Clinical uploads, private runtime and dependency contents are not inspected.'] };
  // Paths themselves could contain confidential material; never print a known value even there.
  let output = JSON.stringify(report, null, 2);
  for (const secret of knownSecrets) output = output.split(JSON.stringify(secret).slice(1, -1)).join('[REDACTED]');
  console.log(output);
  return report.ok ? 0 : 1;
}

if (require.main === module) {
  try { process.exitCode = run(); }
  catch { console.error('SECRET_SCAN_FAILED: no se pudo completar la comprobacion; no se muestran datos internos.'); process.exitCode = 2; }
}
module.exports = { scanText, scanFrontendEnv, scanDirectory, scanIndex, scanHistory, loadKnownSecrets, privatePath, LEGACY_NOTICE, run };
