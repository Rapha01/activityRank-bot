import { registerEvent } from 'bot/util/eventLoader.js';
import { handleMemberJoin } from 'bot/util/memberJoin.js';
import { Events } from 'discord.js';

registerEvent(Events.GuildMemberUpdate, async function (oldMember, newMember) {
  if (oldMember.pending && !newMember.pending) await handleMemberJoin(newMember);
});
