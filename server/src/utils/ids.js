const crypto = require('crypto');

function randomId(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { randomId };
