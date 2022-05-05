const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { oneLine } = require('common-tags');
const guildMemberModel = require('../models/guild/guildMemberModel.js');


const generateRow = (i, myGuildMember) => {
  const r = [
    new MessageButton().setLabel('Notify levelup via DM'),
    new MessageButton().setLabel('Reaction voting'),
  ];
  r[0].setCustomId(`commandsSlash/config-member.js ${i.member.id} notifyLevelupDm`);
  r[0].setStyle(myGuildMember.notifyLevelupDm ? 'SUCCESS' : 'DANGER');

  r[1].setCustomId(`commandsSlash/config-member.js ${i.member.id} reactionVote`);
  r[1].setDisabled(!i.guild.appData.voteXp || !i.guild.appData.reactionVote);
  r[1].setStyle(myGuildMember.reactionVote ? 'SUCCESS' : 'DANGER');
  return r;
};

const _close = (i) => new MessageActionRow()
  .addComponents(new MessageButton()
    .setLabel('Close')
    .setStyle('DANGER')
    .setCustomId(`commandsSlash/config-member.js ${i.member.id} closeMenu`));

module.exports.data = new SlashCommandBuilder()
  .setName('config-member')
  .setDescription('Change your personal settings');

module.exports.execute = async (i) => {
  await guildMemberModel.cache.load(i.member);
  const myGuildMember = await guildMemberModel.storage.get(i.guild, i.member.id);

  await i.reply({
    embeds: [new MessageEmbed()
      .setAuthor({ name: 'Personal Settings' })
      .addField('Notify Levelup via DM', 'If this is enabled, the bot will send you a DM when you level up.')
      .addField('Reaction Voting',
        oneLine`If this is enabled, reacting with the server's voteEmote, ${i.guild.appData.voteEmote},
        will give an upvote to the member that sent the message.`)],

    components: [new MessageActionRow().addComponents(generateRow(i, myGuildMember)), _close(i)],
  });

};

module.exports.component = async (i) => {
  const [, memberId, type] = i.customId.split(' ');

  if (memberId !== i.member.id)
    return await i.reply({ content: 'Sorry, this menu isn\'t for you.', ephemeral: true });

  if (type === 'closeMenu')
    return await i.message.delete();

  await guildMemberModel.cache.load(i.member);
  const myGuildMember = await guildMemberModel.storage.get(i.guild, i.member.id);

  if (myGuildMember[type]) {
    await guildMemberModel.storage.set(i.guild, memberId, type, 0);
    myGuildMember[type] = 0;
  } else {
    await guildMemberModel.storage.set(i.guild, memberId, type, 1);
    myGuildMember[type] = 1;
  }
  await i.update({ components: [new MessageActionRow().addComponents(generateRow(i, myGuildMember)), _close(i)] });
};
