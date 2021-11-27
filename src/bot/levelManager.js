const fct = require('../util/fct.js');
const nameUtil = require('./util/nameUtil.js');
const guildRoleModel = require('./models/guild/guildRoleModel.js');
const Discord = require('discord.js');

exports.checkLevelUp = (member,oldTotalScore,newTotalScore) => {
  return new Promise(async function (resolve, reject) {
    let oldLevel,newLevel,roleMessages;
    try {
      oldLevel = fct.getLevel(fct.getLevelProgression(oldTotalScore,member.guild.appData.levelFactor));
      newLevel = fct.getLevel(fct.getLevelProgression(newTotalScore,member.guild.appData.levelFactor));

      if (oldLevel != newLevel)
        roleMessages = await exports.checkRoleAssignment(member,newLevel);

    } catch (e) { return reject(e); }

    // Send Message
    if (oldLevel >= newLevel)
      return resolve();

    await sendGratulationMessage(member,roleMessages,newLevel).catch(e => console.log('SendError autoPostLevelup: ' + e));

    resolve();
  });
}

exports.checkRoleAssignment = (member,level) => {
  return new Promise(async function (resolve, reject) {
    try {
      let roleMessages = [],memberHasRole;
      const roles = member.guild.roles.cache;

      if (roles.size == 0 || !member.guild.me.permissions.has("MANAGE_ROLES"))
        return resolve(roleMessages);

      for (let role of roles) {
        role = role[1];
        await guildRoleModel.cache.load(role);

        if (role.appData.assignLevel == 0 && role.appData.deassignLevel == 0)
          continue;
        if (role.comparePositionTo(member.guild.me.roles.highest) > 0)
          continue;

        memberHasRole = member.roles.cache.get(role.id);

        if (role.appData.deassignLevel != 0 && level >= role.appData.deassignLevel) {
          // User is above role. Deassign or do nothing.
          if (memberHasRole) {
            await member.roles.remove(role).catch(e => console.log(e));
            addRoleDeassignMessage(roleMessages,member,role,level);
          }
        } else if (role.appData.assignLevel != 0 && level >= role.appData.assignLevel) {
          // User is within role. Assign or do nothing.
          if (!memberHasRole) {
            await member.roles.add(role).catch(e => console.log(e));
            addRoleAssignMessage(roleMessages,member,role,level);
          }
        } else if (member.guild.appData.takeAwayAssignedRolesOnLevelDown && role.appData.assignLevel != 0 && level < role.appData.assignLevel) {
          // User is below role. Deassign or do nothing.
          if (memberHasRole) {
            await member.roles.remove(role).catch(e => console.log(e));
            addRoleDeassignMessage(roleMessages,member,role,level);
          }
        }
      }

      return resolve(roleMessages);
    } catch (e) { return reject(e); }
  });
}

const sendGratulationMessage = (member,roleMessages,level) => {
  return new Promise(async function (resolve, reject) {
    let gratulationMessage = '';

    if (member.guild.appData.levelupMessage != '' && (member.guild.appData.notifyLevelupWithRole || roleMessages.length == 0))
      gratulationMessage = member.guild.appData.levelupMessage + '\n';

    if (roleMessages.length > 0)
      gratulationMessage += roleMessages.join('\n') + '\n';

    if (gratulationMessage == '')
      return resolve();

    const ping = gratulationMessage.indexOf('<mention>') > -1 ?  '<@' + member.id + '>' : '';

    gratulationMessage = replaceTagsLevelup(gratulationMessage,member,level);

    const levelupEmbed = new Discord.MessageEmbed()
        .setTitle(nameUtil.getGuildMemberAlias(member) + ' 🎖' + level)
        .setAuthor('')
        .setColor('#4fd6c8')
        .setDescription(gratulationMessage)
        .setThumbnail(member.user.avatarURL())

    // Active Channel
    let notified = false;
    if (!notified && member.guild.appData.notifyLevelupCurrentChannel) {
      if (member.lastMessageChannelID) {
        const channel = member.guild.channels.cache.get(member.lastMessageChannelID);
        if (channel) {
          let msg = { embeds: [ levelupEmbed ] };
          if (ping)
            msg['content'] = ping;

          await channel.send(msg).then(res => notified = true).catch(e => console.log);
        }
      }
    }

    // Post_ Channel
    if (!notified && member.guild.appData.autopost_levelup != 0) {
      const channel = member.guild.channels.cache.get(member.guild.appData.autopost_levelup);

      if (channel) {
        let msg = { embeds: [ levelupEmbed ] };
        if (ping)
          msg['content'] = ping;

        await channel.send(msg).then(res => notified = true).catch(e => console.log);
      }
    }

    // Direct Message
    if (!notified && member.appData.notifyLevelupDm == true && member.guild.appData.notifyLevelupDm == true) {
      levelupEmbed.setFooter('To disable direct messages from me type "'+ member.guild.appData.prefix +'member notifyLevelupDm" in the server.');
      let msg = { embeds: [ levelupEmbed ] };
      if (ping)
        msg['content'] = ping;

      await member.send(msg).then(res => notified = true).catch(e => console.log);
    }

    resolve();
  });
};

const addRoleDeassignMessage = (roleMessages,member,role,level) => {
  let message = '';

  if (role.appData.deassignMessage != '')
    message = role.appData.deassignMessage;
  else if (member.guild.appData.roleDeassignMessage != '')
    message = member.guild.appData.roleDeassignMessage;

  if (message != '')
    roleMessages.push(replaceTagsRole(message,member,role,level));

  return roleMessages;
}

const addRoleAssignMessage = (roleMessages,member,role,level) => {
  let message = '';

  if (role.appData.assignMessage != '')
    message = role.appData.assignMessage;
  else if (member.guild.appData.roleAssignMessage != '')
    message = member.guild.appData.roleAssignMessage;

  if (message != '')
    roleMessages.push(replaceTagsRole(message,member,role,level));

  return roleMessages;
}

const replaceTagsRole = (text,member,role,level) => {
  return text.replace(/<rolename>/g,role.name).replace(/<role>/g,role.name);
}

const replaceTagsLevelup = (text,member,level) => {
  return text.replace(/<mention>/g,'<@' + member.id + '>')
      .replace(/<name>/g,member.user.username)
      .replace(/<level>/g,level)
      .replace(/<servername>/g,member.guild.name) + '\n';
}
