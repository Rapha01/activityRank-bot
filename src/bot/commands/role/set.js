const guildRoleModel = require('../../models/guild/guildRoleModel.js');
const errorMsgs = require('../../../const/errorMsgs.js');

module.exports = (msg,targetRoleId,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }
      if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
        await msg.channel.send('You have an old version of the bot with no permission to manage roles. Please kick and reinvite it with the new invitelink found on discordbots.org. Your servers stats will ***not*** reset.');
        return resolve();
      }
      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
      if (!targetRoleId) {
        await msg.channel.send('Could not find role.');
        return resolve();
      }

      let field = args[0].toLowerCase();
      const value = args.slice(1,args.length+1).join(' ');

      if (field == 'assignlevel')
        await assignlevel(msg,targetRoleId,value);
      else if (field == 'deassignlevel')
        await deassignlevel(msg,targetRoleId,value);
      else if (field == 'assignmessage')
        await assignmessage(msg,targetRoleId,value);
      else if (field == 'deassignmessage')
        await deassignmessage(msg,targetRoleId,value);
      else if (field == 'noxp')
        await noxp(msg,targetRoleId);
      else {
        await msg.channel.send(errorMsgs.invalidArgument.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}

function noxp(msg,targetRoleId) {
  return new Promise(async function (resolve, reject) {
    try {
      const myRole = await guildRoleModel.storage.get(msg.guild,targetRoleId);

      if (myRole.noXp) {
        await guildRoleModel.storage.set(msg.guild,targetRoleId,'noXp',0);
        await msg.channel.send('Users with the specified role are no longer banned from gaining XP.');
      } else {
        await guildRoleModel.storage.set(msg.guild,targetRoleId,'noXp',1);
        await msg.channel.send('Users with the specified role are now banned from gaining XP.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function assignlevel(msg,roleId,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (!value || isNaN(value)) {
        await msg.channel.send('Please specify the level as last argument.');
        return resolve();
      }
      if (isNaN(value) || value > 2000 || value < 0) {
        await msg.channel.send('Level has to be within 0 and 2000.');
        return resolve();
      }

      const roleAssignmentsByLevel = await guildRoleModel.storage.getRoleAssignmentsByLevel(msg.guild,'assignLevel',value);

      if (value != 0 && roleAssignmentsByLevel.length >= 3) {
        await msg.channel.send('Maxiumum of 3 roleassignments per level. Remove some first.');
        return resolve();
      }

      await guildRoleModel.storage.set(msg.guild,roleId,'assignLevel',value);
      await msg.channel.send('Role updated.');

      resolve();
    } catch (e) { reject(e); }
  });
}

function deassignlevel(msg,roleId,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (!value || isNaN(value)) {
        await msg.channel.send('Please specify the level as last argument.');
        return resolve();
      }
      if (isNaN(value) || value > 2000 || value < 0) {
        await msg.channel.send('Level has to be within 0 and 2000.');
        return resolve();
      }

      const roleDeassignmentsByLevel = await guildRoleModel.storage.getRoleAssignmentsByLevel(msg.guild,'deassignLevel',value);

      if (value != 0 && roleDeassignmentsByLevel.length >= 3) {
        await msg.channel.send('Maxiumum of 3 roledeassignments per level. Remove some first.');
        return resolve();
      }

      await guildRoleModel.storage.set(msg.guild,roleId,'deassignLevel',value);
      await msg.channel.send('Role updated.');

      resolve();
    } catch (e) { reject(e); }
  });
}

function assignmessage(msg,roleId,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value.length > 1000) {
        await msg.channel.send('Assignmessage must me under 1000 characters.');
        return resolve();
      }

      await guildRoleModel.storage.set(msg.guild,roleId,'assignMessage',value);
      await msg.channel.send('Role updated.');

      resolve();
    } catch (e) { reject(e); }
  });
}

function deassignmessage(msg,roleId,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value.length > 1000) {
        await msg.channel.send('Deassignmessage must me under 1000 characters.');
        return resolve();
      }

      await guildRoleModel.storage.set(msg.guild,roleId,'deassignMessage',value);
      await msg.channel.send('Role updated.');

      resolve();
    } catch (e) { reject(e); }
  });
}
