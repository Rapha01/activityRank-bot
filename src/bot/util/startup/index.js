const cmdLoader = require('./cmdLoader');
const eventLoader = require('./eventLoader');

module.exports = function load(client) {
  cmdLoader(client);
  eventLoader(client);
};
