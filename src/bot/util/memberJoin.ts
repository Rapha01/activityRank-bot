import { getMemberModel } from '../models/guild/guildMemberModel.js';
import levelManager from '../levelManager.js';
import { getGuildModel } from '../models/guild/guildModel.js';
import fct from '../../util/fct.js';
import { DiscordAPIError, RESTJSONErrorCodes, type GuildMember } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

export async function handleMemberJoin(member: GuildMember) {
  member.client.logger.debug(`Handling member ${member.id} join`);
  if (member.user.bot) return;

  const cachedGuild = await getGuildModel(member.guild);
  const cachedMember = await getMemberModel(member);

  //member.client.logger.debug({ cachedGuild, cachedMember }, `cache objects`);

  // Roleassignments
  const level = fct.getLevel(
    fct.getLevelProgression(cachedMember.cache.totalScore!, cachedGuild.db.levelFactor),
  );
  member.client.logger.debug(
    `level ${level} ${cachedMember.cache.totalScore} ${cachedGuild.db.levelFactor}`,
  );

  const roleAssignmentString = await levelManager.checkRoleAssignment(member, level);

  // member.client.logger.debug({ roleAssignmentString }, `RAS`);

  // AutoPost serverjoin
  if (cachedGuild.db.autopost_serverJoin !== '0')
    await autoPostServerJoin(member, roleAssignmentString);
}

async function autoPostServerJoin(member: GuildMember, roleAssignmentString: string[]) {
  const cachedGuild = await getGuildModel(member.guild);

  const channel = member.guild.channels.cache.get(cachedGuild.db.autopost_serverJoin);
  if (!channel || !channel.viewable || !channel.isTextBased()) return;

  let welcomeMessage;
  if (cachedGuild.db.serverJoinMessage != '') welcomeMessage = cachedGuild.db.serverJoinMessage;
  else welcomeMessage = 'Welcome <mention>. Have a good time here!';

  welcomeMessage = welcomeMessage + '\n' + roleAssignmentString;
  welcomeMessage = welcomeMessage
    .replace(/<mention>/g, `<@${member.id}>`)
    .replace(/<name>/g, member.user.username)
    .replace(/<servername>/g, member.guild.name);

  const welcomeEmbed = new EmbedBuilder()
    .setTitle(member.user.username)
    .setColor('#4fd6c8')
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
