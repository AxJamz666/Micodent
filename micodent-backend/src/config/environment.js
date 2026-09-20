const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

function databaseOptions() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (DB_NAME !== 'micodent_dev' || !['localhost', '127.0.0.1', '::1'].includes(DB_HOST)
      || DB_USER !== 'dev_micodent' || !DB_PASSWORD || !/^\d+$/.test(DB_PORT || '')
      || Number(DB_PORT) < 1 || Number(DB_PORT) > 65535) {
    throw new Error('S1A_DEV_DATABASE_GUARD');
  }
  return { host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD,
    database: DB_NAME, dateStrings: true, timezone: '-05:00', connectTimeout: 5000 };
}

function tokenOptions() {
  if (Buffer.byteLength(process.env.JWT_SECRET || '') < 32) throw new Error('S1A_JWT_CONFIGURATION');
  return { secret: process.env.JWT_SECRET, issuer: 'micodent-dev-s1a', audience: 'micodent-web-dev',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h', algorithm: 'HS256' };
}

module.exports = { databaseOptions, tokenOptions };
