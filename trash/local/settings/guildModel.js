const localApi = require('../api.js');
const backupApi = require('../../backup/api.js');
const batchsize = 30000;
const fct = require('../../../fct.js');
const congestionManager = require('../../congestionManager.js');

exports.get = (guildId) => {
  return new Promise(async function (resolve, reject) {
    try {
      let guild = await localApi.getSingle('guild',{guildid: guildId});

      // Does guild not exist local?
      if (!guild) {
        if (congestionManager.loadingGuildIds.indexOf(guildId) > -1)
          return resolve();
        congestionManager.loadingGuildIds.push(guildId);

        // Try to get the guild remote and load it locally
        await loadGuildAllRemote(guildId);
        guild = await localApi.getSingle('guild',{guildid: guildId});

        // Did guild not get loaded from remote?
        if (!guild) {
          // Create new local entry
          await localApi.loadSingle('guild', {guildid: guildId});
          await localApi.setSingle('guild',{guildid: guildId},'haschanged',1);
          guild = await localApi.getSingle('guild',{guildid: guildId});
        }

        congestionManager.loadingGuildIds.unset(guildId);
        console.log('Finished loading/creating guild ' + guildId + '. Open to load: ' + congestionManager.loadingGuildIds.length);
      }

      resolve(guild);
    } catch (e) {
      congestionManager.loadingGuildIds.unset(guildId);
      reject(e);
    }
  });
}

exports.set = (guildId,field,value) => {
  return new Promise(async function (resolve, reject) {
    try {
      await localApi.setSingle('guild',{guildid: guildId},field,value);
      resolve();
    } catch (e) { reject(e); }
  });
}

function loadGuildAllRemote(guildId) {
  return new Promise(async function (resolve, reject) {
    try {
      let from = 0,to = batchsize,count = 1,str;
      let guildAll = await backupApi.getAll(guildId,from,to);

      const properties = Object.keys(guildAll);
      properties.unset('guild');

      while (!arraysInObjectAreEmpty(guildAll, properties)) {
        str = '';
        for (property of properties) {
          str += ' ' + guildAll[property].length;
          await localApi.loadMulti(property, guildAll[property]);
        }
        console.log('Loaded GuildAll Nr ' + count + ' for guild ' + guildId + '. Rows: ' + str);

        from = to; to += batchsize; count += 1;
        guildAll = await backupApi.getAll(guildId,from,to);
        await fct.sleep(300);
      }

      if (!guildAll.guild) {
        console.log('Not found remote. Creating guild ' + guildId + '.');
        return resolve();
      } else
        console.log('Found remote. Loading guild ' + guildId + '.');

      await localApi.loadSingle('guild', guildAll.guild);

      //console.log('Loaded ' + count + ' rows to ' + tablename + ' of guild ' + guildId);
      resolve();
    } catch (e) { reject(e); }
  });
}

function arraysInObjectAreEmpty(obj, properties) {
  for (property of properties) {
    if (obj[property].length > 0) {
      return false;
    }
  }
  return true;
}

/* function remoteToLocal(tablename,guildId) {
  return new Promise(async function (resolve, reject) {
    try {
      let from = 0, to = batchsize - 1, count = 0;
      let rows = await backupApi.getMulti(tablename,{guildid: guildId},from,to);

      while (rows.length > 0) {
        await localApi.loadMulti(tablename,rows);
        from = to; to += batchsize; count += rows.length;
        rows = await backupApi.getMulti(tablename,{guildid: guildId},from,to);
      }

      //console.log('Loaded ' + count + ' rows to ' + tablename + ' of guild ' + guildId);
      resolve();
    } catch (e) { reject(e); }
  });
} */
