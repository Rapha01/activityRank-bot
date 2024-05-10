import { event } from '@activityrank/lupus';
import { handleMemberJoin } from 'bot/util/memberJoin.js';

export default event(event.discord.GuildMemberUpdate, async function (oldMember, newMember) {
  if (oldMember.pending && !newMember.pending) await handleMemberJoin(newMember);
});
