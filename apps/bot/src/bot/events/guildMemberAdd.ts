import { Events } from 'discord.js';
import { handleMemberJoin } from '#bot/util/memberJoin.js';
import { event } from '#bot/util/registry/event.js';

export default event(Events.GuildMemberAdd, async (member) => {
  if (!member.pending) await handleMemberJoin(member);
});
