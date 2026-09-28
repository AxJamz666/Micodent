const fs = require('node:fs/promises');
const path = require('node:path');

function contentMatches(bytes, extension) {
  const ext = extension.toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return bytes.length >= 4 && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) && bytes.subarray(-2).equals(Buffer.from([0xff, 0xd9]));
  if (ext === '.png') return bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (ext === '.gif') return bytes.length >= 14 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6));
  if (ext === '.webp') return bytes.length >= 20 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (ext === '.pdf') return bytes.length >= 10 && bytes.toString('ascii', 0, 5) === '%PDF-' && bytes.subarray(-1024).includes(Buffer.from('%%EOF'));
  return false;
}

async function validStagedFile(file) {
  if (!file || !file.size || file.size > 10 * 1024 * 1024) return false;
  const bytes = await fs.readFile(file.path);
  return bytes.length === file.size && contentMatches(bytes, path.extname(file.filename));
}

module.exports = { validStagedFile, contentMatches };
