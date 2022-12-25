const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const { oneLine } = require('common-tags');
const guildMemberModel = require('../models/guild/guildMemberModel.js');

const generateRow = (i, myGuildMember) => {
  const r = [
    new ButtonBuilder().setLabel('Notify levelup via DM'),
    new ButtonBuilder().setLabel('Reaction voting'),
  ];
  r[0].setCustomId(`config-member ${i.member.id} notifyLevelupDm`);
  r[0].setStyle(
    myGuildMember.notifyLevelupDm ? ButtonStyle.Success : ButtonStyle.Danger
  );

  r[1].setCustomId(`config-member ${i.member.id} reactionVote`);
  r[1].setDisabled(!i.guild.appData.voteXp || !i.guild.appData.reactionVote);
  r[1].setStyle(
    myGuildMember.reactionVote ? ButtonStyle.Success : ButtonStyle.Danger
  );
  return r;
};

const _close = (i) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
      .setCustomId(`config-member ${i.member.id} closeMenu`)
  );

module.exports.data = new SlashCommandBuilder()
  .setName('config-member')
  .setDescription('Change your personal settings');

module.exports.execute = async (i) => {
  await guildMemberModel.cache.load(i.member);
  const myGuildMember = await guildMemberModel.storage.get(
    i.guild,
    i.member.id
  );

  await i.reply({
    embeds: [
      new EmbedBuilder().setAuthor({ name: 'Personal Settings' }).addFields(
        {
          name: 'Notify Levelup via DM',
          value:
            'If this is enabled, the bot will send you a DM when you level up.',
        },
        {
          name: 'Reaction Voting',
          value: oneLine`
        If this is enabled, reacting with the server's voteEmote, ${i.guild.appData.voteEmote},
        will give an upvote to the member that sent the message.`,
        }
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(generateRow(i, myGuildMember)),
      _close(i),
    ],
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

  await guildMemberModel.cache.load(i.member);
  let myGuildMember = await guildMemberModel.storage.get(i.guild, i.member.id);

  if (myGuildMember[type])
    await guildMemberModel.storage.set(i.guild, memberId, type, 0);
  else await guildMemberModel.storage.set(i.guild, memberId, type, 1);

  myGuildMember = await guildMemberModel.storage.get(i.guild, i.member.id);
  await i.update({
    components: [
      new ActionRowBuilder().addComponents(generateRow(i, myGuildMember)),
      _close(i),
    ],
  });
};
