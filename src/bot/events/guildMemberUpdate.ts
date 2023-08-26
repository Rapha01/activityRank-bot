export default {
  name: 'guildMemberUpdate',
  execute(oldMember, newMember) {
    if (oldMember.pending && !newMember.pending)
      newMember.client.emit('_guildMemberJoin', newMember);
  },
};
