import { event } from 'bot/util/registry/event.js';
import { Events } from 'discord.js';
import { handleMemberJoin } from 'bot/util/memberJoin.js';

export default event(Events.GuildMemberUpdate, async function (oldMember, newMember) {
  if (oldMember.pending && !newMember.pending) await handleMemberJoin(newMember);
});
