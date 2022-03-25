/* eslint-disable max-len */
const guildModel = require('../../../models/guild/guildModel.js');
const { stripIndent } = require('common-tags');

const _prettify = {
  textXp: 'Message XP',
  voiceXp: 'Voice XP',
  voteXp: 'Upvote XP',
  inviteXp: 'Invitation XP',
};

module.exports.execute = async function(i) {
  const module = i.options.getString('module');
  const set = i.options.getBoolean('enabled');

  if (set) {
    await guildModel.storage.set(i.guild, module, 1);

    await i.reply({
      content: stripIndent`
    **${_prettify[module]} is now activated.**
    It will be shown in the stats and the bot now counts it in this server.`,
      ephemeral: true,
    });
  } else {
    await guildModel.storage.set(i.guild, module, 0);

    await i.reply({
      content: stripIndent`
    **${_prettify[module]} is now deactivated.** 
    It will not be shown in the stats anymore and the bot no longer counts it in this server.

    _Note: The already counted statistics still add towards a user\'s totalXp - it is recommended to reset only ${_prettify[module]} for everyone, so there is no hidden stat from the past that is increasing a user\'s XP._`,
      ephemeral: true,
    });
  }
};