const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const coverage = path.join(root, 'coverage');
fs.mkdirSync(coverage, { recursive: true });
const temporary = fs.mkdtempSync(path.join(coverage, 'test-temp-'));

try {
  // Windows fixtures must not inherit an unrelated package scope from global TEMP.
  const result = spawnSync(process.execPath, [
    require.resolve('c8/bin/c8.js'), process.execPath,
    '--test', 'tests/unit/*.test.cjs', 'tests/unit/*.test.js',
  ], {
    cwd: root,
    env: { ...process.env, TEMP: temporary, TMP: temporary },
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error) {
    console.error('COVERAGE_RUNNER_FAILED');
    process.exitCode = 1;
  } else {
    process.exitCode = result.status ?? 1;
  }
} finally {
  const target = path.resolve(temporary);
  if (path.dirname(target) !== coverage || !path.basename(target).startsWith('test-temp-')) {
    throw new Error('UNSAFE_COVERAGE_TEST_CLEANUP');
  }
  fs.rmSync(target, { recursive: true, force: true });
}
