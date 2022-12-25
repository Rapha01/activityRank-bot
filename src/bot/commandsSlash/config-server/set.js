/* eslint-disable max-len */
const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { stripIndent } = require('common-tags');
const guildModel = require('../../models/guild/guildModel.js');

const generateRows = async (i) => {
  const myGuild = await guildModel.storage.get(i.guild);
  const r1 = [
    new ButtonBuilder()
      .setLabel('Use Nicknames')
      .setCustomId(`config-server/set ${i.member.id} showNicknames`),
    new ButtonBuilder()
      .setLabel('Reaction Voting')
      .setCustomId(`config-server/set ${i.member.id} reactionVote`),
    new ButtonBuilder()
      .setLabel('Allow Muted XP')
      .setCustomId(`config-server/set ${i.member.id} allowMutedXp`),
    new ButtonBuilder()
      .setLabel('Allow Deafened XP')
      .setCustomId(`config-server/set ${i.member.id} allowDeafenedXp`),
    new ButtonBuilder()
      .setLabel('Allow Solo XP')
      .setCustomId(`config-server/set ${i.member.id} allowSoloXp`),
  ];
  const r2 = [
    new ButtonBuilder()
      .setLabel('TAAROLD')
      .setCustomId(
        `config-server/set ${i.member.id} takeAwayAssignedRolesOnLevelDown`
      ),
    new ButtonBuilder()
      .setLabel('Notify Via DM')
      .setCustomId(`config-server/set ${i.member.id} notifyLevelupDm`),
    new ButtonBuilder()
      .setLabel('Notify in Last Active Channel')
      .setCustomId(
        `config-server/set ${i.member.id} notifyLevelupCurrentChannel`
      ),
    new ButtonBuilder()
      .setLabel('Include Levelup Message')
      .setCustomId(`config-server/set ${i.member.id} notifyLevelupWithRole`),
  ];
  const r3 = [
    new ButtonBuilder()
      .setEmoji('✍️')
      .setCustomId(`config-server/set ${i.member.id} textXp`),
    new ButtonBuilder()
      .setEmoji('🎙️')
      .setCustomId(`config-server/set ${i.member.id} voiceXp`),
    new ButtonBuilder()
      .setEmoji('✉️')
      .setCustomId(`config-server/set ${i.member.id} inviteXp`),
    new ButtonBuilder()
      .setEmoji('❤️')
      .setCustomId(`config-server/set ${i.member.id} voteXp`),
  ];
  r1.forEach((o) =>
    o.setStyle(
      myGuild[o.data.custom_id.split(' ')[2]] === 1
        ? ButtonStyle.Success
        : ButtonStyle.Danger
    )
  );
  r2.forEach((o) =>
    o.setStyle(
      myGuild[o.data.custom_id.split(' ')[2]] === 1
        ? ButtonStyle.Success
        : ButtonStyle.Danger
    )
  );
  r3.forEach((o) =>
    o.setStyle(
      myGuild[o.data.custom_id.split(' ')[2]] === 1
        ? ButtonStyle.Success
        : ButtonStyle.Danger
    )
  );
  if (myGuild.notifyLevelupCurrentChannel)
    r2[1].setDisabled(true).setStyle(ButtonStyle.Danger);
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

const _close = (i) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
      .setCustomId(`config-server/set ${i.member.id} closeMenu`)
  );

module.exports.execute = async (i) => {
  if (!i.member.permissionsIn(i.channel).has(PermissionFlagsBits.ManageGuild)) {
    return await i.reply({
      content:
        'You need the permission to manage the server in order to use this command.',
      ephemeral: true,
    });
  }

  const e = new EmbedBuilder()
    .setAuthor({ name: 'Server Settings' })
    .setColor(0x00ae86)
    .addFields(
      {
        name: 'Use Nicknames',
        value:
          'If this is enabled, nicknames will be used to represent members instead of their Discord usernames',
      },
      {
        name: 'Reaction Voting',
        value: `If this is enabled, members will be permitted to vote using the server's voteEmote, ${i.guild.appData.voteEmote}`,
      },
      {
        name: 'Allow Muted XP',
        value:
          'If this is enabled, members will be permitted to gain XP in VCs, even when they are muted.',
      },
      {
        name: 'Allow Deafened XP',
        value:
          'If this is enabled, members will be permitted to gain XP in VCs, even when they are deafened.',
      },
      {
        name: 'Allow Solo XP',
        value:
          'If this is enabled, members will be permitted to gain XP in VCs, even when they are alone. Bots do not count.',
      },
      {
        name: 'TAAROLD (Take Away Assigned Roles On Level Down)',
        value:
          'If this is enabled, the bot will remove roles when the member falls below their assignLevel.',
      },
      {
        name: 'Notify Via DM',
        value: stripIndent`
        If this is enabled, the bot will allow members to recieve levelup notifications via DM.
        You cannot select this if either of the below two options are enabled, because they will take priority.`,
      },
      {
        name: 'Notify in Last Active Channel',
        value: stripIndent`
        If this is enabled, the bot will notify members of their levelups in their last used text channel.
        You cannot select this if the below option is enabled, because it will take priority.`,
      },
      {
        name: 'Include Levelup Message',
        value: stripIndent`
        If this is enabled, when a role has a custom roleAssign message, the bot will also send the default levelup message.
        Otherwise, it will only send the roleAssign message.`,
      },
      {
        name: '✍️, 🎙️, ✉️, ❤️',
        value: stripIndent`
        These will enable or disable text, voice, invite, and upvoteXP respectively.
        You may want to reset these categories, as disabling them will only hide them and prevent more from being added.`,
      }
    );

  await i.reply({
    embeds: [e],
    components: await generateRows(i),
  });
};

module.exports.component = async (i) => {
  const [, memberId, type] = i.customId.split(' ');

  if (memberId !== i.member.id)
    return await i.reply({
      content: "Sorry, this menu isn't for you.",
      ephemeral: true,
    });

  if (type === 'closeMenu') {
    await i.deferUpdate();
    return await i.deleteReply();
  }

  const myGuild = await guildModel.storage.get(i.guild);

  if (myGuild[type]) await guildModel.storage.set(i.guild, type, 0);
  else await guildModel.storage.set(i.guild, type, 1);

  await i.update({ components: await generateRows(i) });
};
