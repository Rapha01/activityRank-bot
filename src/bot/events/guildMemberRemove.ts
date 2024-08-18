import { event } from 'bot/util/registry/event.js';
import { Events } from 'discord.js';
import { getGuildModel } from 'bot/models/guild/guildModel.js';
import resetModel from 'bot/models/resetModel.js';

export default event(Events.GuildMemberRemove, async function (member) {
  const cachedGuild = await getGuildModel(member.guild);

  // always reset bots when they leave - although they shouldn't have any stats.
  // This is an easy way to fix the issue of bots accidentaly having XP: instruct
  // the user to kick and reinvite the bot in question.
  if (!member.user.bot && !cachedGuild.db.resetDeletedMembers) return;

  member.client.logger.debug(`Resetting left member ${member.id} (${member.guild.id})`);
  let count: number;
  do {
    count = await resetModel.storage.resetGuildMembersStats(1000, member.guild, [member.id]);
  } while (count >= 1000);
  member.client.logger.debug(`Finished reset of left member ${member.id} (${member.guild.id})`);
});
