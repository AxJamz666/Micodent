const db = require('../config/db');
const { tokenOptions } = require('../config/environment');
const { createSessionService } = require('./session.service');
module.exports = createSessionService(db, tokenOptions());
