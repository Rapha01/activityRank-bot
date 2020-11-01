const fct = require('../fct.js');
const backupApi = require('./backup/api.js');
const db = require('./local/db.js');

exports.resetGuildStats = (guildId) => {
  return new Promise(async function (resolve, reject) {
    try {
      await resetGuild('textmessage',guildId);
      await resetGuild('voiceminute',guildId);
      await resetGuild('vote',guildId);
      await resetGuild('bonus',guildId);

      await backupApi.resetGuildStats(guildId);

      resolve();
    } catch (e) { reject(e); }
  });
}

exports.resetGuildSettings = (guildId) => {
  return new Promise(async function (resolve, reject) {
    try {
      await resetGuild('guild',guildId);
      await resetGuild('guildmember',guildId);
      await resetGuild('guildrole',guildId);
      await resetGuild('guildchannel',guildId);

      await backupApi.resetGuildSettings(guildId);

      resolve();
    } catch (e) { reject(e); }
  });
}

const batchsize = 30000;
exports.resetGuildmembersStats = (guildId,userIds) => {
  return new Promise(async function (resolve, reject) {
    try {
      await resetGuildmembers('textmessage',guildId,userIds);
      await resetGuildmembers('voiceminute',guildId,userIds);
      await resetGuildmembers('vote',guildId,userIds);
      await resetGuildmembers('bonus',guildId,userIds);

      while (userIds.length > 0)
        await backupApi.resetGuildmembersStats(guildId,userIds.splice(0,batchsize));

      resolve();
    } catch (e) { reject(e); }
  });
}

exports.resetGuildchannelsStats = (guildId,channelIds) => {
  return new Promise(async function (resolve, reject) {
    try {
      await resetGuildchannels('textmessage',guildId,channelIds);
      await resetGuildchannels('voiceminute',guildId,channelIds);

      while (channelIds.length > 0)
        await backupApi.resetGuildchannelsStats(guildId,channelIds.splice(0,batchsize));

      resolve();
    } catch (e) { reject(e); }
  });
}

exports.resetScoreByTime = (time) => {
  return new Promise(async function (resolve, reject) {
    try {
      await resetScore('textmessage',time);
      await resetScore('voiceminute',time);
      await resetScore('vote',time);
      await resetScore('bonus',time);
      await resetScore('command',time);
      await resetScore('guildrole','assigned' + time);
      await resetScore('guildrole','deassigned' + time);

      resolve();
    } catch (e) { reject(e); }
  });
}

function resetScore(tablename,time) {
  return new Promise(function (resolve, reject) {
    db.query(`UPDATE ${tablename} SET ${time} = 0`, function (err, results, fields) {
      if (err) return reject(err);

      resolve();
    });
  });
}

function resetGuild(tablename,guildId) {
  return new Promise(async function (resolve, reject) {
    const schema = await getSchema(tablename);

    const updateStrings = [];
    for (schem of schema)
      if(schem.Key == '' && schem.Field != 'dateadded' && schem.Field != 'haschanged')
        updateStrings.push(schem.Field + '=' + 'DEFAULT');

    updateStrings.push('haschanged=0');

    db.query(`UPDATE ${tablename} SET ${updateStrings.join(',')} WHERE guildid = ${guildId}`, function (err, results, fields) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function resetGuildmembers(tablename,guildId,userIds) {
  return new Promise(async function (resolve, reject) {
    const schema = await getSchema(tablename);

    const updateStrings = [];
    for (schem of schema)
      if(schem.Key == '' && schem.Field != 'dateadded' && schem.Field != 'haschanged')
        updateStrings.push(schem.Field + '=' + 'DEFAULT');

    updateStrings.push('haschanged=0');

    let usersSql = [];
    for (userId of userIds)
      usersSql.push('userid=' + userId);

    db.query(`UPDATE ${tablename} SET ${updateStrings.join(',')} WHERE guildid = ${guildId} AND (${usersSql.join(' OR ')})`, function (err, results, fields) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function resetGuildchannels(tablename,guildId,channelIds) {
  return new Promise(async function (resolve, reject) {
    const schema = await getSchema(tablename);

    const updateStrings = [];
    for (schem of schema)
      if(schem.Key == '' && schem.Field != 'dateadded' && schem.Field != 'haschanged')
        updateStrings.push(schem.Field + '=' + 'DEFAULT');

    updateStrings.push('haschanged=0');

    let channelsSql = [];
    for (channelId of channelIds)
      channelsSql.push('channelid=' + channelId);

    db.query(`UPDATE ${tablename} SET ${updateStrings.join(',')} WHERE guildid = ${guildId} AND (${channelsSql.join(' OR ')})`, function (err, results, fields) {
      if (err) return reject(err);
      resolve();
    });
  });
}


function getSchema(tablename) {
  return new Promise(function (resolve, reject) {
    db.query(`SHOW COLUMNS FROM ${tablename}`, function (err, results, fields) {
      if (err) return reject(err);
      resolve(results);
    });
  });
}
