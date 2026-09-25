// Current browser coverage shares the guarded, disposable RC4 instance harness.
// Do not reuse the historical fixed-port S1-A fixture with the cookie contract.
if (!['mysql8', 'mariadb'].includes(process.env.HOTFIX_ENGINE)
    || !process.env.HOTFIX_SCHEMA_SOURCE || !process.env.HOTFIX_PLAYWRIGHT
    || !(process.env.HOTFIX_ENGINE === 'mysql8' ? process.env.HOTFIX_MYSQL_BIN : process.env.HOTFIX_MARIADB_BIN)) {
  throw new Error('BROWSER_TEST_REQUIRES_EXPLICIT_DISPOSABLE_CONFIGURATION');
}
process.env.HOTFIX_BROWSER_TEST = '1';
require('./hotfix-integration.cjs');
