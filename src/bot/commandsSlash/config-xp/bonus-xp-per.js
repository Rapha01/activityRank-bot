const { MessageEmbed } = require('discord.js');
const { stripIndent } = require('common-tags');
const guildModel = require('../../models/guild/guildModel.js');

module.exports.execute = async function(i) {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }
  const items = {
    bonusPerTextMessage: i.options.getInteger('message'),
    bonusPerVoiceMinute: i.options.getInteger('voiceminute'),
    bonusPerVote: i.options.getInteger('vote'),
    bonusPerInvite: i.options.getInteger('invite'),
  };
  if (Object.values(items).every(x => x === null)) {
    return await i.reply({
      content: 'You must specify at least one option for this command to do anything!',
      ephemeral: true,
    });
  }

  for (const k in items) if (items[k]) await guildModel.storage.set(i.guild, k, items[k]);
  await i.reply({
    embeds: [new MessageEmbed().setAuthor({ name: 'Bonus XP Values' }).setColor(0x00AE86)
      .setDescription(stripIndent`
      Modified Bonus XP Values! New values:

      \`${i.guild.appData.bonusPerTextMessage} xp\` per text message
      \`${i.guild.appData.bonusPerVoiceMinute} xp\` per minute in VC
      \`${i.guild.appData.bonusPerVote} xp\` per vote
      \`${i.guild.appData.bonusPerInvite} xp\` per invite
      `)],
    ephemeral: true,
  });
};
