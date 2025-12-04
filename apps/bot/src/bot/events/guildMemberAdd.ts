import { Events } from 'discord.js';
import { handleMemberJoin } from '#bot/util/memberJoin.ts';
import { event } from '#bot/util/registry/event.ts';

export default event(Events.GuildMemberAdd, async (member) => {
  if (!member.pending) await handleMemberJoin(member);
});
