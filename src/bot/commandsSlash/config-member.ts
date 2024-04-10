import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
  type Interaction,
} from 'discord.js';
import { oneLine } from 'common-tags';
import { type GuildMemberModel, getMemberModel } from '../models/guild/guildMemberModel.js';
import { registerComponent, registerSlashCommand } from 'bot/util/commandLoader.js';
import { getGuildModel, type GuildModel } from 'bot/models/guild/guildModel.js';

const generateRow = (i: Interaction<'cached'>, myMember: GuildMemberModel, myGuild: GuildModel) => {
  return [
    new ButtonBuilder()
      .setLabel('Notify levelup via DM')
      .setCustomId(toggleId({ type: 'notifyLevelupDm' }, { ownerId: i.member.id }))
      .setStyle(myMember.db.notifyLevelupDm ? ButtonStyle.Success : ButtonStyle.Danger),
    new ButtonBuilder()
      .setLabel('Reaction voting')
      .setCustomId(toggleId({ type: 'reactionVote' }, { ownerId: i.member.id }))
      .setDisabled(!myGuild.db.voteXp || !myGuild.db.reactionVote)
      .setStyle(myMember.db.reactionVote ? ButtonStyle.Success : ButtonStyle.Danger),
  ];
};

const _close = (interaction: Interaction<'cached'>) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
      .setCustomId(closeId(null, { ownerId: interaction.member.id })),
  );

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('config-member')
    .setDescription('Change your personal settings'),
  async execute(i) {
    const cachedGuild = await getGuildModel(i.member.guild);
    const cachedMember = await getMemberModel(i.member);

    await i.reply({
      embeds: [
        new EmbedBuilder().setAuthor({ name: 'Personal Settings' }).addFields(
          {
            name: 'Notify Levelup via DM',
            value: 'If this is enabled, the bot will send you a DM when you level up.',
          },
          {
            name: 'Reaction Voting',
            value: oneLine`
              If this is enabled, reacting with the server's voteEmote, ${cachedGuild.db.voteEmote},
              will give an upvote to the member that sent the message.`,
          },
        ),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          generateRow(i, cachedMember, cachedGuild),
        ),
        _close(i),
      ],
    });
  },
});

const closeId = registerComponent({
  type: ComponentType.Button,
  identifier: 'config-member.close',
  async callback({ interaction }) {
    await interaction.deferUpdate();
    await interaction.deleteReply();
  },
});

const toggleId = registerComponent<{
  type: 'reactionVote' | 'notifyLevelupDm';
}>({
  type: ComponentType.Button,
  identifier: 'config-member.toggle',
  async callback({ interaction, data }) {
    const cachedGuild = await getGuildModel(interaction.guild);
    const cachedMember = await getMemberModel(interaction.member);
    const { type } = data;

    if (cachedMember.db[type]) await cachedMember.upsert({ [type]: 0 });
    else await cachedMember.upsert({ [type]: 1 });

    await interaction.update({
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          generateRow(interaction, cachedMember, cachedGuild),
        ),
        _close(interaction),
      ],
    });
  },
});
