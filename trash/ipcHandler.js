const promiseIpc = require('node-ipc-promise');

promiseIpc.on('guildDb.query', async (event) => {
  return resolve('Received ipc in manager. Get data from ' + event.host);
});
