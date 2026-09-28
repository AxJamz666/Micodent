const test = require('node:test');
const assert = require('node:assert/strict');
const { contentMatches } = require('../../src/services/clinicalUpload');

test('file contents must agree with the extension, including an intact JPEG tail', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 0xff, 0xd9]);
  assert(contentMatches(jpeg, '.jpg'));
  assert(!contentMatches(jpeg.subarray(0, -2), '.jpg'));
  assert(!contentMatches(jpeg, '.png'));
  assert(!contentMatches(Buffer.from('<svg><script/></svg>'), '.png'));
});

test('PDF has a header and ending marker; active formats are never accepted', () => {
  assert(contentMatches(Buffer.from('%PDF-1.7\nbody\n%%EOF'), '.pdf'));
  assert(!contentMatches(Buffer.from('%PDF-1.7\nbody'), '.pdf'));
  assert(!contentMatches(Buffer.from('%PDF-1.7\nbody\n%%EOF'), '.html'));
});
