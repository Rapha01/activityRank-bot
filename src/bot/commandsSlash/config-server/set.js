/* eslint-disable max-len */
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { oneLine, stripIndent } = require('common-tags');
const guildModel = require('../../models/guild/guildModel.js');

const generateRows = async (i) => {
  const myGuild = await guildModel.storage.get(i.guild);
  const r1 = [
    new ButtonBuilder().setLabel('Use Nicknames').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} showNicknames`),
    new ButtonBuilder().setLabel('Reaction Voting').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} reactionVote`),
    new ButtonBuilder().setLabel('Allow Muted XP').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} allowMutedXp`),
    new ButtonBuilder().setLabel('Allow Deafened XP').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} allowDeafenedXp`),
    new ButtonBuilder().setLabel('Allow Solo XP').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} allowSoloXp`),
  ];
  const r2 = [
    new ButtonBuilder().setLabel('TAAROLD').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} takeAwayAssignedRolesOnLevelDown`),
    new ButtonBuilder().setLabel('Notify Via DM').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} notifyLevelupDm`),
    new ButtonBuilder().setLabel('Notify in Last Active Channel').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} notifyLevelupCurrentChannel`),
    new ButtonBuilder().setLabel('Replace Levelup Message With Role Message').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} notifyLevelupWithRole`),
  ];
  const r3 = [
    new ButtonBuilder().setEmoji('✍️').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} textXp`),
    new ButtonBuilder().setEmoji('🎙️').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} voiceXp`),
    new ButtonBuilder().setEmoji('✉️').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} inviteXp`),
    new ButtonBuilder().setEmoji('❤️').setCustomId(`commandsSlash/config-server/set.js ${i.member.id} voteXp`),
  ];
  r1.forEach(o => o.setStyle(myGuild[o.customId.split(' ')[2]] === 1 ? ButtonStyle.Success : ButtonStyle.Danger));
  r2.forEach(o => o.setStyle(myGuild[o.customId.split(' ')[2]] === 1 ? ButtonStyle.Success : ButtonStyle.Danger));
  r3.forEach(o => o.setStyle(myGuild[o.customId.split(' ')[2]] === 1 ? ButtonStyle.Success : ButtonStyle.Danger));
  if (myGuild.notifyLevelupCurrentChannel) r2[1].setDisabled(true).setStyle(ButtonStyle.Danger);
  if (parseInt(myGuild.autopost_levelup)) {
    r2[1].setDisabled(true).setStyle(ButtonStyle.Danger);
    r2[2].setDisabled(true).setStyle(ButtonStyle.Danger);
  }
  return [
    new ActionRowBuilder().addComponents(r1),
    new ActionRowBuilder().addComponents(r2),
    new ActionRowBuilder().addComponents(r3),
    _close(i),
  ];
};


const _close = (i) => new ActionRowBuilder()
  .addComponents(new ButtonBuilder()
    .setLabel('Close')
    .setStyle(ButtonStyle.Danger)
    .setCustomId(`commandsSlash/config-server/set.js ${i.member.id} closeMenu`));

module.exports.execute = async (i) => {
  if (!i.member.permissionsIn(i.channel).has('MANAGE_GUILD')) {
    return await i.reply({
      content: 'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const e = new EmbedBuilder()
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
      stripIndent`If this is enabled, the bot will allow members to recieve levelup notifications via DM.
        You cannot select this if either of the below two options are enabled, because they will take priority.`)
    .addField('Notify in Last Active Channel',
      stripIndent`If this is enabled, the bot will notify members of their levelups in their last used text channel.
        You cannot select this if the below option is enabled, because it will take priority.`)
    .addField('Replace Levelup Message With Role Message',
      oneLine`If this is enabled, the bot will send both a levelup and roleAssign message where applicable.
        Otherwise, it will just send a roleAssign message.`)
    .addField('✍️, 🎙️, ✉️, ❤️',
      stripIndent`These will enable or disable text, voice, invite, and upvoteXP respectively.
        You may want to reset these categories, as disabling them will only hide them and prevent more from being added.`);

  await i.reply({
    embeds: [e],
    components: await generateRows(i),
  });

};

module.exports.component = async (i) => {
  const [, memberId, type] = i.customId.split(' ');

  if (memberId !== i.member.id)
    return await i.reply({ content: 'Sorry, this menu isn\'t for you.', ephemeral: true });

  if (type === 'closeMenu') {
    await i.deferUpdate();
    return await i.deleteReply();
  }

  const myGuild = await guildModel.storage.get(i.guild);

  if (myGuild[type]) await guildModel.storage.set(i.guild, type, 0);
  else await guildModel.storage.set(i.guild, type, 1);

  await i.update({ components: await generateRows(i) });
};
