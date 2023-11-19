import fct from '../util/fct.js';
import nameUtil from './util/nameUtil.js';
import guildRoleModel from './models/guild/guildRoleModel.js';
import Discord, { DiscordAPIError, GuildMember, RESTJSONErrorCodes, Role } from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';
import guildModel from './models/guild/guildModel.js';
import guildMemberModel from './models/guild/guildMemberModel.js';

export async function checkLevelUp(
  member: GuildMember,
  oldTotalScore: number,
  newTotalScore: number,
) {
  let roleMessages;
  const cachedGuild = await guildModel.cache.get(member.guild);

  const oldLevel = fct.getLevel(fct.getLevelProgression(oldTotalScore, cachedGuild.db.levelFactor));
  const newLevel = fct.getLevel(fct.getLevelProgression(newTotalScore, cachedGuild.db.levelFactor));

  if (oldLevel != newLevel) roleMessages = await checkRoleAssignment(member, newLevel);

  // Send Message
  if (oldLevel >= newLevel) return;

  await sendGratulationMessage(member, roleMessages!, newLevel).catch((e) =>
    member.client.logger.warn(e, 'Sending error while autoposting levelup message'),
  );
}

export async function checkRoleAssignment(member: GuildMember, level: number) {
  let roleMessages: string[] = [],
    memberHasRole;
  const roles = member.guild.roles.cache;

  if (roles.size == 0 || !member.guild.members.me!.permissions.has(PermissionFlagsBits.ManageRoles))
    return roleMessages;

  const cachedGuild = await guildModel.cache.get(member.guild);

  for (const _role of roles) {
    const role = _role[1];
    const cachedRole = await guildRoleModel.cache.get(role);

    if (cachedRole.db.assignLevel == 0 && cachedRole.db.deassignLevel == 0) continue;
    if (role.comparePositionTo(member.guild.members.me!.roles.highest) > 0) continue;

    memberHasRole = member.roles.cache.get(role.id);

    if (cachedRole.db.deassignLevel != 0 && level >= cachedRole.db.deassignLevel) {
      // User is above role. Deassign or do nothing.
      if (memberHasRole) {
        await member.roles.remove(role).catch((e) => {
          if (e.code !== 50013) throw e; // Missing Permissions
        });
        await addRoleDeassignMessage(roleMessages, member, role);
      }
    } else if (cachedRole.db.assignLevel != 0 && level >= cachedRole.db.assignLevel) {
      // User is within role. Assign or do nothing.
      if (!memberHasRole) {
        await member.roles.add(role).catch((e) => {
          if (e.code !== 50013) throw e; // Missing Permissions
        });
        await addRoleAssignMessage(roleMessages, member, role);
      }
    } else if (
      cachedGuild.db.takeAwayAssignedRolesOnLevelDown &&
      cachedRole.db.assignLevel != 0 &&
      level < cachedRole.db.assignLevel
    ) {
      // User is below role. Deassign or do nothing.
      if (memberHasRole) {
        await member.roles.remove(role).catch((e) => {
          if (e.code !== 50013) throw e; // Missing Permissions
        });
        await addRoleDeassignMessage(roleMessages, member, role);
      }
    }
  }

  return roleMessages;
}

async function sendGratulationMessage(member: GuildMember, roleMessages: string[], level: number) {
  let gratulationMessage = '';

  const cachedGuild = await guildModel.cache.get(member.guild);
  const cachedMember = await guildMemberModel.cache.get(member);

  if (
    cachedGuild.db.levelupMessage != '' &&
    (cachedGuild.db.notifyLevelupWithRole || roleMessages.length == 0)
  )
    gratulationMessage = cachedGuild.db.levelupMessage + '\n';

  if (roleMessages.length > 0) gratulationMessage += roleMessages.join('\n') + '\n';

  if (gratulationMessage == '') return;

  const ping = gratulationMessage.indexOf('<mention>') > -1 ? '<@' + member.id + '>' : '';

  gratulationMessage = replaceTagsLevelup(gratulationMessage, member, level);

  const levelupEmbed = new Discord.EmbedBuilder()
    .setTitle(nameUtil.getGuildMemberAlias(member) + ' 🎖 ' + level)
    .setColor('#4fd6c8')
    .setDescription(gratulationMessage)
    .setThumbnail(member.user.avatarURL());

  function handleGratulationMessageError(_err: unknown) {
    const err = _err as DiscordAPIError;
    if (err.code === RESTJSONErrorCodes.MissingAccess)
      member.client.logger.debug(
        `Missing access to send gratulationMessage in guild ${member.guild.id}`,
      );
    else member.client.logger.warn(err, 'Error while sending gratulationMessage');
  }

  // Active Channel
  let notified = false;
  if (!notified && cachedGuild.db.notifyLevelupCurrentChannel) {
    if (cachedMember.cache.lastMessageChannelId) {
      const channel = member.guild.channels.cache.get(cachedMember.cache.lastMessageChannelId);
      if (channel) {
        if (!channel.isTextBased()) {
          member.client.logger.warn(`lastMessageChannel ${channel.id} is not text-based`);
          return;
        }
        const msg = { embeds: [levelupEmbed], content: ping };

        await channel
          .send(msg)
          .then(() => (notified = true))
          .catch(handleGratulationMessageError);
      }
    }
  }

  // Post_ Channel
  if (!notified && cachedGuild.db.autopost_levelup != '0') {
    const channel = member.guild.channels.cache.get(cachedGuild.db.autopost_levelup);

    if (channel) {
      if (!channel.isTextBased()) {
        member.client.logger.warn(`autopost channel ${channel.id} is not text-based`);
        return;
      }

      const msg = { embeds: [levelupEmbed], content: ping };

      await channel
        .send(msg)
        .then(() => (notified = true))
        .catch(handleGratulationMessageError);
    }
  }

  // Direct Message
  if (!notified && cachedMember.db.notifyLevelupDm == 1 && cachedGuild.db.notifyLevelupDm == 1) {
    levelupEmbed.setFooter({
      text: 'To disable direct messages from me, type `/config-member` in the server.',
    });
    const msg = { embeds: [levelupEmbed], content: ping };

    await member
      .send(msg)
      .then(() => (notified = true))
      .catch(handleGratulationMessageError);
  }
}

const addRoleDeassignMessage = async (roleMessages: string[], member: GuildMember, role: Role) => {
  let message = '';

  const cachedRole = await guildRoleModel.cache.get(role);
  const cachedGuild = await guildModel.cache.get(member.guild);

  if (cachedRole.db.deassignMessage != '') message = cachedRole.db.deassignMessage;
  else if (cachedGuild.db.roleDeassignMessage != '') message = cachedGuild.db.roleDeassignMessage;

  if (message != '') roleMessages.push(replaceTagsRole(message, role));

  return roleMessages;
};

const addRoleAssignMessage = async (roleMessages: string[], member: GuildMember, role: Role) => {
  let message = '';

  const cachedRole = await guildRoleModel.cache.get(role);
  const cachedGuild = await guildModel.cache.get(member.guild);

  if (cachedRole.db.assignMessage != '') message = cachedRole.db.assignMessage;
  else if (cachedGuild.db.roleAssignMessage != '') message = cachedGuild.db.roleAssignMessage;

  if (message != '') roleMessages.push(replaceTagsRole(message, role));

  return roleMessages;
};

const replaceTagsRole = (text: string, role: Role) => {
  return text
    .replace(/<rolename>/g, role.name)
    .replace(/<role>/g, role.name)
    .replace(/<rolemention>/g, role.toString());
};

const replaceTagsLevelup = (text: string, member: GuildMember, level: number) => {
  return (
    text
      .replace(/<mention>/g, '<@' + member.id + '>')
      .replace(/<name>/g, member.user.username)
      .replace(/<level>/g, level.toString())
      .replace(/<servername>/g, member.guild.name) + '\n'
  );
};

export default {
  checkLevelUp,
  checkRoleAssignment,
};
