const { tokenOptions } = require('./environment');
const { createBrowserTransport } = require('../services/browserTransport');

if (process.env.NODE_ENV === 'production') throw Error('S1B2_DEV_TRANSPORT_ONLY');
module.exports = createBrowserTransport(tokenOptions());
