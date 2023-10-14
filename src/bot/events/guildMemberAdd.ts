import { registerEvent } from 'bot/util/eventLoader.js';
import { handleMemberJoin } from 'bot/util/memberJoin.js';
import { Events } from 'discord.js';

registerEvent(Events.GuildMemberAdd, async function (member) {
  if (!member.pending) await handleMemberJoin(member);
});
