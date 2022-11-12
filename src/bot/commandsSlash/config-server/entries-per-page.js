const { PermissionFlagsBits } = require('discord.js');
const guildModel = require('../../models/guild/guildModel.js');


module.exports.execute = async function(i) {
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }
  await guildModel.storage.set(i.guild, 'entriesPerPage', i.options.getInteger('value'));

  await i.reply({
    content: `The server will now see \`${i.options.getInteger('value')}\` entries per page.`,
    ephemeral: true,
  });
};
