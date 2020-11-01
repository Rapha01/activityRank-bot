const guildRoleModel = require('../models/guild/guildRoleModel.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }

      if (args.length < 2) {
        await msg.channel.send('Too few arguments. Type ``'+msg.guild.appData.prefix+'help rolesettings`` for more information');
        return resolve();
      }

      if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
        await msg.channel.send('You have an old version of the bot with no permission to manage roles. Please kick and reinvite it with the new invitelink found on discordbots.org. Your servers stats will ***not*** reset.');
        return resolve();
      }

      let roleName = [],roleId,subcommand,value,role,i;

      let endOfRolenameIndex = 0;
      for (i = 0; i < args.length; i++) {
        endOfRolenameIndex = i;
        if (args[i] == 'assignlevel' || args[i] == 'deassignlevel' || args[i] == 'assignmessage' || args[i] == 'deassignmessage' || args[i] == 'noxp') {
          subcommand = args[i];
          break;
        }

        roleName.push(args[i]);
      }

      if (!subcommand) {
        await msg.channel.send('Please specify the subcommand (f.e. assignlevel) as second argument. Type ``'+msg.guild.appData.prefix+'help setrole`` for more information.');
        return resolve();
      }

      roleName = roleName.join(' ');

      if (roleName.startsWith('id:'))
        roleId = roleName.slice(3).trim();
      else if (msg.mentions.roles.first())
        roleId = msg.mentions.roles.first().id;
      else if (roleName != '')
        roleId = msg.guild.roles.cache.find(role => role.name == roleName).id;
      else if (roleName == '') {
        await msg.channel.send('Please specify a role.');
        return resolve();
      }

      if (!roleId || isNaN(roleId)) {
        await msg.channel.send('Could not find specified role.');
        return resolve();
      }

      value = args.slice(i+1,args.length+1).join(' ');

      subcommand = subcommand.toLowerCase();
      if (subcommand == 'assignlevel')
        await assignlevel(msg,roleId,'assignLevel',value);
      else if (subcommand == 'deassignlevel')
        await assignlevel(msg,roleId,'deassignLevel',value);
      else if (subcommand == 'assignmessage')
        await assignmessage(msg,roleId,'assignMessage',value);
      else if (subcommand == 'deassignmessage')
        await assignmessage(msg,roleId,'deassignMessage',value);
      else if (subcommand == 'noxp')
        await noxp(msg,roleId,'noXp',value);
      else {
        await msg.channel.send('Invalid argument. Type ``'+msg.guild.appData.prefix+'help setrole`` for more information');
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}

function noxp(msg,roleId,field,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'on')
        value = 1;
      else if (value == 'off')
        value = 0;
      else {
        await msg.channel.send('The value for noxp setting needs to be either ``on`` or ``off``.');
        return resolve();
      }

      await guildRoleModel.storage.set(msg.guild,roleId,field,value);
      await msg.channel.send('Role updated.');

      resolve();
    } catch (e) { reject(e); }
  });
}

function assignlevel(msg,roleId,field,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (!value || isNaN(value)) {
        await msg.channel.send('Please specify the level as last argument. Type ``ar!help setrole`` for more information');
        return resolve();
      }
      if (value > 2000 || value < 0) {
        await msg.channel.send('Level has to be within 0 and 2000.');
        return resolve();
      }

      await guildRoleModel.storage.set(msg.guild,roleId,field,value);
      await msg.channel.send('Role updated.');

      resolve();
    } catch (e) { reject(e); }
  });
}

function assignmessage(msg,roleId,field,value) {
  return new Promise(async function (resolve, reject) {
    try {
      /*if (!value) {
        await msg.channel.send('Please specify a message as last argument. Type ``ar!help setrole`` for more information');
        return resolve();
      }*/

      await guildRoleModel.storage.set(msg.guild,roleId,field,value);
      await msg.channel.send('Role updated.');

      resolve();
    } catch (e) { reject(e); }
  });
}
