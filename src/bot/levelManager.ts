import fct from '../util/fct.js';
import nameUtil from './util/nameUtil.js';
import guildRoleModel from './models/guild/guildRoleModel.js';
import Discord from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';

export const checkLevelUp = (member, oldTotalScore, newTotalScore) => {
  return new Promise(async function (resolve, reject) {
    let oldLevel, newLevel, roleMessages;
    try {
      oldLevel = fct.getLevel(
        fct.getLevelProgression(oldTotalScore, member.guild.appData.levelFactor),
      );
      newLevel = fct.getLevel(
        fct.getLevelProgression(newTotalScore, member.guild.appData.levelFactor),
      );

      if (oldLevel != newLevel) roleMessages = await checkRoleAssignment(member, newLevel);
    } catch (e) {
      return reject(e);
    }

    // Send Message
    if (oldLevel >= newLevel) return resolve();

    await sendGratulationMessage(member, roleMessages, newLevel).catch((e) =>
      member.client.logger.warn(e, 'Sending error while autoposting levelup message'),
    );

    resolve();
  });
};

export const checkRoleAssignment = (member, level) => {
  return new Promise(async function (resolve, reject) {
    try {
      let roleMessages = [],
        memberHasRole;
      const roles = member.guild.roles.cache;

      if (
        roles.size == 0 ||
        !member.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)
      )
        return resolve(roleMessages);

      for (let role of roles) {
        role = role[1];
        await guildRoleModel.cache.load(role);

        if (role.appData.assignLevel == 0 && role.appData.deassignLevel == 0) continue;
        if (role.comparePositionTo(member.guild.members.me.roles.highest) > 0) continue;

        memberHasRole = member.roles.cache.get(role.id);

        if (role.appData.deassignLevel != 0 && level >= role.appData.deassignLevel) {
          // User is above role. Deassign or do nothing.
          if (memberHasRole) {
            await member.roles.remove(role).catch((e) => {
              if (e.code !== 50013) throw e; // Missing Permissions
            });
            addRoleDeassignMessage(roleMessages, member, role, level);
          }
        } else if (role.appData.assignLevel != 0 && level >= role.appData.assignLevel) {
          // User is within role. Assign or do nothing.
          if (!memberHasRole) {
            await member.roles.add(role).catch((e) => {
              if (e.code !== 50013) throw e; // Missing Permissions
            });
            addRoleAssignMessage(roleMessages, member, role, level);
          }
        } else if (
          member.guild.appData.takeAwayAssignedRolesOnLevelDown &&
          role.appData.assignLevel != 0 &&
          level < role.appData.assignLevel
        ) {
          // User is below role. Deassign or do nothing.
          if (memberHasRole) {
            await member.roles.remove(role).catch((e) => {
              if (e.code !== 50013) throw e; // Missing Permissions
            });
            addRoleDeassignMessage(roleMessages, member, role, level);
          }
        }
      }

      return resolve(roleMessages);
    } catch (e) {
      return reject(e);
    }
  });
};

const sendGratulationMessage = (member, roleMessages, level) => {
  return new Promise(async function (resolve, reject) {
    let gratulationMessage = '';

    if (
      member.guild.appData.levelupMessage != '' &&
      (member.guild.appData.notifyLevelupWithRole || roleMessages.length == 0)
    )
      gratulationMessage = member.guild.appData.levelupMessage + '\n';

    if (roleMessages.length > 0) gratulationMessage += roleMessages.join('\n') + '\n';

    if (gratulationMessage == '') return resolve();

    const ping = gratulationMessage.indexOf('<mention>') > -1 ? '<@' + member.id + '>' : '';

    gratulationMessage = replaceTagsLevelup(gratulationMessage, member, level);

    const levelupEmbed = new Discord.EmbedBuilder()
      .setTitle(nameUtil.getGuildMemberAlias(member) + ' 🎖 ' + level)
      .setColor('#4fd6c8')
      .setDescription(gratulationMessage)
      .setThumbnail(member.user.avatarURL());

    function handleGratulationMessageError(err) {
      if (err.code === 50001)
        // Missing Access
        member.client.logger.debug(
          `Missing access to send gratulationMessage in guild ${member.guild.id}`,
        );
      else member.client.logger.warn(err, 'Error while sending gratulationMessage');
    }

    // Active Channel
    let notified = false;
    if (!notified && member.guild.appData.notifyLevelupCurrentChannel) {
      if (member.appData.lastMessageChannelId) {
        const channel = member.guild.channels.cache.get(member.appData.lastMessageChannelId);
        if (channel) {
          const msg = { embeds: [levelupEmbed] };
          if (ping) msg['content'] = ping;

          await channel
            .send(msg)
            .then(() => (notified = true))
            .catch(handleGratulationMessageError);
        }
      }
    }

    // Post_ Channel
    if (!notified && member.guild.appData.autopost_levelup != 0) {
      const channel = member.guild.channels.cache.get(member.guild.appData.autopost_levelup);

      if (channel && channel.send) {
        const msg = { embeds: [levelupEmbed] };
        if (ping) msg['content'] = ping;

        await channel
          .send(msg)
          .then(() => (notified = true))
          .catch(handleGratulationMessageError);
      }
    }

    // Direct Message
    if (
      !notified &&
      member.appData.notifyLevelupDm == true &&
      member.guild.appData.notifyLevelupDm == true
    ) {
      levelupEmbed.setFooter({
        text: 'To disable direct messages from me, type `/config-member` in the server.',
      });
      const msg = { embeds: [levelupEmbed] };
      if (ping) msg['content'] = ping;

      await member
        .send(msg)
        .then(() => (notified = true))
        .catch(handleGratulationMessageError);
    }

    resolve();
  });
};

const addRoleDeassignMessage = (roleMessages, member, role, level) => {
  let message = '';

  if (role.appData.deassignMessage != '') message = role.appData.deassignMessage;
  else if (member.guild.appData.roleDeassignMessage != '')
    message = member.guild.appData.roleDeassignMessage;

  if (message != '') roleMessages.push(replaceTagsRole(message, member, role, level));

  return roleMessages;
};

const addRoleAssignMessage = (roleMessages, member, role, level) => {
  let message = '';

  if (role.appData.assignMessage != '') message = role.appData.assignMessage;
  else if (member.guild.appData.roleAssignMessage != '')
    message = member.guild.appData.roleAssignMessage;

  if (message != '') roleMessages.push(replaceTagsRole(message, member, role, level));

  return roleMessages;
};

const replaceTagsRole = (text, member, role, level) => {
  return text
    .replace(/<rolename>/g, role.name)
    .replace(/<role>/g, role.name)
    .replace(/<rolemention>/g, role.toString());
};

const replaceTagsLevelup = (text, member, level) => {
  return (
    text
      .replace(/<mention>/g, '<@' + member.id + '>')
      .replace(/<name>/g, member.user.username)
      .replace(/<level>/g, level)
      .replace(/<servername>/g, member.guild.name) + '\n'
  );
};

// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
  checkLevelUp,
  checkRoleAssignment,
};

// GENERATED: end of generated content by `exports-to-default`.
