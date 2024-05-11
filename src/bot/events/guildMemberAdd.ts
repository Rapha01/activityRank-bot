import { event } from '@activityrank/lupus';
import { handleMemberJoin } from 'bot/util/memberJoin.js';

export default event(event.discord.GuildMemberAdd, async function (member) {
  if (!member.pending) await handleMemberJoin(member);
});
