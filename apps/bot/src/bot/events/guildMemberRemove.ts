import { Events } from 'discord.js';
import { getGuildModel } from '#bot/models/guild/guildModel.js';
import { ResetGuildMembersStatisticsAndXp } from '#bot/models/resetModel.js';
import { event } from '#bot/util/registry/event.js';

export default event(Events.GuildMemberRemove, async (member) => {
  const cachedGuild = await getGuildModel(member.guild);

  // always reset bots when they leave - although they shouldn't have any stats.
  // This is an easy way to fix the issue of bots accidentaly having XP: instruct
  // the user to kick and reinvite the bot in question.
  if (!member.user.bot && !cachedGuild.db.resetDeletedMembers) return;

  member.client.logger.debug(`Resetting left member ${member.id} (${member.guild.id})`);
  const job = new ResetGuildMembersStatisticsAndXp(member.guild, [member.id]);

  job.skipPlan();
  await job.runUntilComplete({ globalBufferTime: 100 });

  member.client.logger.debug(`Finished reset of left member ${member.id} (${member.guild.id})`);
});
