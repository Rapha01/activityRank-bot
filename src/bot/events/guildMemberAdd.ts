export default {
  name: 'guildMemberAdd',
  execute(member) {
    if (!member.pending) member.client.emit('_guildMemberJoin', member);
  },
};
