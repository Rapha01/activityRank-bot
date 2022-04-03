module.exports = function(i) {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    i.reply({
      content: 'You need the `Manage Server` permission to use this command.',
      ephemeral: true,
    });
    return false;
  }
  return true;
};