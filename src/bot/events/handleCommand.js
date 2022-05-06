const { legacySupportExpired } = require('../util/handleLegacy');

module.exports = async (msg) => {
  await legacySupportExpired(msg);
};
