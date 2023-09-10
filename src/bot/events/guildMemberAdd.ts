import type { GuildMember } from 'discord.js';

export default {
  name: 'guildMemberAdd',
  execute(member: GuildMember) {
    if (!member.pending) member.client.emit('_guildMemberJoin', member);
  },
};
