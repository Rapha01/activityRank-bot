/*
.addChannelOption(o => o
  .setName('channel').setDescription('The channel to modify')
  .addChannelTypes([GuildText, GuildVoice]))
.addStringOption(o => o
  .setName('id').setDescription('The ID of the channel to modify'));
*/

module.exports.parseChannel = async (i) => {
  let id = null;
  if (i.options.get('channel')) id = i.options.get('channel').value;
  if (i.options.getString('id')) id = i.options.getString('id');

  if (!id)
    return null;

  const channel = i.guild.channels.cache.get(id);

  return { id, channel };
};

module.exports.parseRole = async (i) => {
  let id = null;
  if (i.options.get('role')) id = i.options.get('role').value;
  if (i.options.getString('id')) id = i.options.getString('id');

  if (!id)
    return null;

  const role = i.guild.roles.cache.get(id);

  return { id, role };
};


module.exports.parseMember = async (i) => {
  let id = null;
  if (i.options.get('member')) id = i.options.get('member').value;
  if (i.options.getString('id')) id = i.options.getString('id');

  if (!id)
    return null;

  const member = null;
  try {
    const member = await i.guild.members.fetch(id);
  } catch (e) { }


  return { id, member };
};
