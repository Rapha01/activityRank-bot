import {
  type DiscordAPIError,
  EmbedBuilder,
  type GuildMember,
  RESTJSONErrorCodes,
} from 'discord.js';
import {
  checkLevelup,
  getNewMemberRoles,
  getRoleAssignmentMessages,
  runRoleUpdate,
} from '#bot/levelManager.js';
import fct from '../../util/fct.js';
import { getMemberModel } from '../models/guild/guildMemberModel.js';
import { getGuildModel } from '../models/guild/guildModel.js';

export async function handleMemberJoin(member: GuildMember) {
  // member.client.logger.debug(`Handling member ${member.id} join`);
  if (member.user.bot) return;

  const cachedGuild = await getGuildModel(member.guild);
  const cachedMember = await getMemberModel(member);

  let roleAssignmentMessages: string[] = [];
  if (cachedGuild.db.stickyLevelRoles) {
    // Roleassignments
    const totalXp = cachedMember.cache.totalXp ?? 0;
    const { isLevelup, newLevel } = await checkLevelup(member.guild, 0, totalXp);

    const newRoles = await getNewMemberRoles(member, newLevel);
    roleAssignmentMessages = await getRoleAssignmentMessages(member, newRoles);
    if (newLevel > 1 && isLevelup) {
      await runRoleUpdate(member, newLevel, newRoles);
    }
  }

  // AutoPost serverjoin
  if (cachedGuild.db.autopost_serverJoin !== '0')
    await autoPostServerJoin(member, roleAssignmentMessages);
}

async function autoPostServerJoin(member: GuildMember, roleAssignmentString: string[]) {
  const cachedGuild = await getGuildModel(member.guild);

  const channel = member.guild.channels.cache.get(cachedGuild.db.autopost_serverJoin);
  if (!channel || !channel.viewable || !channel.isTextBased()) return;

  let welcomeMessage: string;
  if (cachedGuild.db.serverJoinMessage !== '') welcomeMessage = cachedGuild.db.serverJoinMessage;
  else welcomeMessage = 'Welcome <mention>. Have a good time here!';

  welcomeMessage += '\n';
  welcomeMessage += roleAssignmentString;

  welcomeMessage = welcomeMessage
    .replace(/<mention>/g, `<@${member.id}>`)
    .replace(/<name>/g, member.user.username)
    .replace(/<servername>/g, member.guild.name);

  const welcomeEmbed = new EmbedBuilder()
    .setTitle(member.user.username)
    .setColor(0x01c3d9)
    .setDescription(welcomeMessage)
    .setThumbnail(member.user.avatarURL());

  try {
    await channel.send({
      content: `<@${member.id}>`,
      embeds: [welcomeEmbed],
    });
  } catch (_err) {
    const err = _err as DiscordAPIError;
    if (err.code === RESTJSONErrorCodes.MissingPermissions)
      member.client.logger.debug(
        `Missing permissions to send welcome message in guild ${member.guild.id}`,
      );
    else throw err;
  }
}
