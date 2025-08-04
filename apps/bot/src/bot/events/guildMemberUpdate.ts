import { Events } from 'discord.js';
import { handleMemberJoin } from '#bot/util/memberJoin.js';
import { event } from '#bot/util/registry/event.js';

export default event(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (oldMember.pending && !newMember.pending) await handleMemberJoin(newMember);
});
