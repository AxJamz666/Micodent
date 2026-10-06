const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('POST S3358 preserves relational user ID ordering and deduplicated locks', () => {
  const values = ['', 'a', 'A', '10', '2', 'admin', 'doctor', '\u00f1', '\ud83d\ude00'];
  const original = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  for (const [file, uses] of [
    ['controllers/usuarios.controller.js', 2],
    ['services/session.service.js', 1],
  ]) {
    const source = fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8');
    const declaration = source.match(/function compareUserIds\(a, b\) \{[\s\S]*?\n\}/)?.[0];
    assert.ok(declaration, file);
    const compare = vm.runInNewContext(`(${declaration})`);
    assert.equal(source.match(/\.sort\(compareUserIds\)/g)?.length, uses);
    for (const a of values) {
      for (const b of values) {
        assert.equal(compare(a, b), original(a, b), `${file}: ${a}/${b}`);
        const before = [...new Set([a, b])].sort(original);
        const after = [...new Set([a, b])].sort(compare);
        assert.deepEqual(after, before);
      }
    }
  }
});
