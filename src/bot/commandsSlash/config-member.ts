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
import guildMemberModel from '../models/guild/guildMemberModel.js';
import { registerComponent, registerSlashCommand } from 'bot/util/commandLoader.js';
import type { GuildMemberSchema } from 'models/types/shard.js';
import type { PropertiesOfType } from 'models/types/generics.js';
import guildModel, { type CachedGuild } from 'bot/models/guild/guildModel.js';

const generateRow = (
  i: Interaction<'cached'>,
  myMember: GuildMemberSchema,
  myGuild: CachedGuild,
) => {
  return [
    new ButtonBuilder()
      .setLabel('Notify levelup via DM')
      .setCustomId(toggleId({ type: 'notifyLevelupDm' }, { ownerId: i.member.id }))
      .setStyle(myMember.notifyLevelupDm ? ButtonStyle.Success : ButtonStyle.Danger),
    new ButtonBuilder()
      .setLabel('Reaction voting')
      .setCustomId(toggleId({ type: 'reactionVote' }, { ownerId: i.member.id }))
      .setDisabled(!myGuild.db.voteXp || !myGuild.db.reactionVote)
      .setStyle(myMember.reactionVote ? ButtonStyle.Success : ButtonStyle.Danger),
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
    const cachedGuild = await guildModel.cache.get(i.member.guild);
    const myGuildMember = await guildMemberModel.storage.get(i.guild, i.member.id);

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
          generateRow(i, myGuildMember, cachedGuild),
        ),
        _close(i),
      ],
    });
  },
});

const closeId = registerComponent({
  type: ComponentType.Button,
  identifier: 'config-member.close',
  async callback(interaction) {
    await interaction.deferUpdate();
    await interaction.deleteReply();
  },
});

const toggleId = registerComponent<{
  type: Exclude<keyof PropertiesOfType<GuildMemberSchema, number>, 'tokensBurned'>;
}>({
  type: ComponentType.Button,
  identifier: 'config-member.toggle',
  async callback(interaction, data) {
    const cachedGuild = await guildModel.cache.get(interaction.guild);
    const myGuildMember = await guildMemberModel.storage.get(
      interaction.guild,
      interaction.member.id,
    );
    const { type } = data;

    if (myGuildMember[type])
      await guildMemberModel.storage.set(interaction.guild, interaction.user.id, type, 0);
    else await guildMemberModel.storage.set(interaction.guild, interaction.user.id, type, 1);

    const newMember = await guildMemberModel.storage.get(interaction.guild, interaction.member.id);
    await interaction.update({
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          generateRow(interaction, newMember, cachedGuild),
        ),
        _close(interaction),
      ],
    });
  },
});
