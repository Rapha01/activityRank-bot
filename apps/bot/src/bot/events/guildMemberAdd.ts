import { event } from '#bot/util/registry/event.js';
import { Events } from 'discord.js';
import { handleMemberJoin } from '#bot/util/memberJoin.js';

export default event(Events.GuildMemberAdd, async function (member) {
  if (!member.pending) await handleMemberJoin(member);
});
