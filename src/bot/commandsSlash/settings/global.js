/* eslint-disable max-len */
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { oneLine } = require('common-tags');
const guildModel = require('../../models/guild/guildModel.js');

const generateRows = async (i) => {
  const myGuild = await guildModel.storage.get(i.guild);
  const r1 = [
    new MessageButton().setLabel('Use Nicknames').setCustomId(`commandsSlash/settings/global.js ${i.member.id} showNicknames`),
    new MessageButton().setLabel('Reaction Voting').setCustomId(`commandsSlash/settings/global.js ${i.member.id} reactionVote`),
    new MessageButton().setLabel('Allow Muted XP').setCustomId(`commandsSlash/settings/global.js ${i.member.id} allowMutedXp`),
    new MessageButton().setLabel('Allow Deafened XP').setCustomId(`commandsSlash/settings/global.js ${i.member.id} allowDeafenedXp`),
    new MessageButton().setLabel('Allow Solo XP').setCustomId(`commandsSlash/settings/global.js ${i.member.id} allowSoloXp`),
  ];
  const r2 = [
    new MessageButton().setLabel('TAAROLD').setCustomId(`commandsSlash/settings/global.js ${i.member.id} takeAwayAssignedRolesOnLevelDown`),
    new MessageButton().setLabel('Notify Via DM').setCustomId(`commandsSlash/settings/global.js ${i.member.id} notifyLevelupDm`),
    new MessageButton().setLabel('Notify in Last Active Channel').setCustomId(`commandsSlash/settings/global.js ${i.member.id} notifyLevelupCurrentChannel`),
    new MessageButton().setLabel('Replace Levelup Message With Role Message').setCustomId(`commandsSlash/settings/global.js ${i.member.id} notifyLevelupWithRole`),
  ];
  r1.forEach(o => o.setStyle(myGuild[o.customId.split(' ')[2]] === 1 ? 'SUCCESS' : 'DANGER'));
  r2.forEach(o => o.setStyle(myGuild[o.customId.split(' ')[2]] === 1 ? 'SUCCESS' : 'DANGER'));
  if (myGuild.notifyLevelupCurrentChannel) r2[1].setDisabled(true).setStyle('DANGER');
  if (parseInt(myGuild.autopost_levelup)) {
    r2[1].setDisabled(true).setStyle('DANGER');
    r2[2].setDisabled(true).setStyle('DANGER');
  }
  return [new MessageActionRow().addComponents(r1), new MessageActionRow().addComponents(r2), _close(i)];
};


const _close = (i) => new MessageActionRow()
  .addComponents(new MessageButton()
    .setLabel('Close')
    .setStyle('DANGER')
    .setCustomId(`commandsSlash/settings/global.js ${i.member.id} closeMenu`));

module.exports.execute = async (i) => {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  console.log(await guildModel.storage.get(i.guild));

  const e = new MessageEmbed()
    .setAuthor({ name: 'Server Settings' }).setColor(0x00AE86)
    .addField('Use Nicknames',
      'If this is enabled, nicknames will be used to represent members instead of their Discord usernames')
    .addField('Reaction Voting',
      `If this is enabled, members will be permitted to vote using the server's voteEmote, ${i.guild.appData.voteEmote}`)
    .addField('Allow Muted XP',
      'If this is enabled, members will be permitted to gain XP in VCs, even when they are muted.')
    .addField('Allow Deafened XP',
      'If this is enabled, members will be permitted to gain XP in VCs, even when they are deafened.')
    .addField('Allow Solo XP',
      'If this is enabled, members will be permitted to gain XP in VCs, even when they are alone. Bots do not count.')
    .addField('TAAROLD (Take Away Assigned Roles On Level Down)',
      'If this is enabled, the bot will remove roles when the member falls below their assignLevel.')
    .addField('Notify Via DM',
      'If this is enabled, the bot will allow members to recieve levelup notifications via DM.')
    .addField('Notify in Last Active Channel',
      'If this is enabled, the bot will notify members of their levelups in their last used text channel.')
    .addField('Replace Levelup Message With Role Message',
      oneLine`If this is enabled, the bot will send both a levelup and roleAssign message where applicable. 
      Otherwise, it will just send a roleAssign message.`);

  i.reply({
    embeds: [e],
    components: await generateRows(i),
  });

};

module.exports.component = async (i) => {
  const [, memberId, type] = i.customId.split(' ');

  if (memberId !== i.member.id)
    return i.reply({ content: 'Sorry, this menu isn\'t for you.', ephemeral: true });

  if (type === 'closeMenu')
    return await i.message.delete();

  const myGuild = await guildModel.storage.get(i.guild);

  if (myGuild[type]) await guildModel.storage.set(i.guild, type, 0);
  else await guildModel.storage.set(i.guild, type, 1);

  await i.update({ components: await generateRows(i) });
};

