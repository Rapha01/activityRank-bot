import { ButtonStyle, ComponentType, type Interaction } from 'discord.js';
import { oneLine } from 'common-tags';
import { type GuildMemberModel, getMemberModel } from '../models/guild/guildMemberModel.js';
import { getGuildModel, type GuildModel } from '#bot/models/guild/guildModel.js';
import { command } from '#bot/util/registry/command.js';
import { actionrow, closeButton } from '#bot/util/component.js';
import { component } from '#bot/util/registry/component.js';
import { requireUser } from '#bot/util/predicates.js';

const generateRow = (
  interaction: Interaction<'cached'>,
  myMember: GuildMemberModel,
  myGuild: GuildModel,
) => {
  const predicate = requireUser(interaction.user);
  return actionrow([
    {
      type: ComponentType.Button,
      label: 'Notify levelup via DM',
      customId: toggleButton.instanceId({ data: { type: 'notifyLevelupDm' }, predicate }),
      style: myMember.db.notifyLevelupDm ? ButtonStyle.Success : ButtonStyle.Danger,
    },
    {
      type: ComponentType.Button,
      label: 'Reaction voting',
      customId: toggleButton.instanceId({ data: { type: 'reactionVote' }, predicate }),
      style: myMember.db.reactionVote ? ButtonStyle.Success : ButtonStyle.Danger,
      disabled: !myGuild.db.voteXp || !myGuild.db.reactionVote,
    },
  ]);
};

const closeRow = (interaction: Interaction<'cached'>) =>
  actionrow([
    {
      type: ComponentType.Button,
      label: 'Close',
      style: ButtonStyle.Danger,
      customId: closeButton.instanceId({ predicate: requireUser(interaction.user) }),
    },
  ]);

export default command.basic({
  data: { name: 'config-member', description: 'Change your personal settings.' },
  async execute({ interaction }) {
    const cachedGuild = await getGuildModel(interaction.member.guild);
    const cachedMember = await getMemberModel(interaction.member);

    const fields = [
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
    ];

    await interaction.reply({
      embeds: [{ author: { name: 'Personal Settings' }, fields }],
      components: [generateRow(interaction, cachedMember, cachedGuild), closeRow(interaction)],
    });
  },
});

const toggleButton = component<{ type: 'reactionVote' | 'notifyLevelupDm' }>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    const cachedGuild = await getGuildModel(interaction.guild);
    const cachedMember = await getMemberModel(interaction.member);
    const { type } = data;

    if (cachedMember.db[type]) await cachedMember.upsert({ [type]: 0 });
    else await cachedMember.upsert({ [type]: 1 });

    await interaction.update({
      components: [generateRow(interaction, cachedMember, cachedGuild), closeRow(interaction)],
    });
  },
});
