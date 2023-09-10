import type { GuildMember } from 'discord.js';

export default {
  name: 'guildMemberUpdate',
  execute(oldMember: GuildMember, newMember: GuildMember) {
    if (oldMember.pending && !newMember.pending)
      newMember.client.emit('_guildMemberJoin', newMember);
  },
};
