/*
.addChannelOption(o => o
  .setName('channel').setDescription('The channel to modify')
  .addChannelTypes([GuildText, GuildVoice]))
.addStringOption(o => o
  .setName('id').setDescription('The ID of the channel to modify'));
*/
const { Constants } = require('discord.js');

module.exports.parseChannel = async (i) => {
  const cid = i.options.get('channel')?.value || i.options.getString('id');
  if (!cid) {
    return i.reply({
      content: 'You need to specify either a channel or a channel\'s ID!',
      ephemeral: true,
    });
  }
  try {
    return {
      id: cid,
      channel: await i.guild.channels.fetch(cid),
    };
  } catch (e) {
    if (e.code === Constants.APIErrors.MISSING_ACCESS)
      return { id: cid, channel: null };
    else throw e;
  }
};

module.exports.parseRole = async (i) => {
  const rid = i.options.get('role')?.value || i.options.getString('id');
  if (!rid) {
    return i.reply({
      content: 'You need to specify either a role or a role\'s ID!',
      ephemeral: true,
    });
  }
  try {
    return {
      id: rid,
      role: await i.guild.roles.fetch(rid),
    };
  } catch (e) {
    if (e.code === Constants.APIErrors.MISSING_ACCESS)
      return { id: rid, role: null };
    else throw e;
  }
};