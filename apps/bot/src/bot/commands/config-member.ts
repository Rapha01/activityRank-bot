import { ButtonStyle, ComponentType, type Interaction } from 'discord.js';
import { command } from '#bot/commands.js';
import { type GuildModel, getGuildModel } from '#bot/models/guild/guildModel.js';
import { actionrow, closeButton } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { component } from '#bot/util/registry/component.js';
import { type GuildMemberModel, getMemberModel } from '../models/guild/guildMemberModel.js';

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

export default command({
  name: 'config-member',
  async execute({ interaction, t }) {
    const cachedGuild = await getGuildModel(interaction.member.guild);
    const cachedMember = await getMemberModel(interaction.member);

    const fields = [
      { name: t('config-member.notifyDM'), value: t('config-member.notifyDMDescription') },
      {
        name: t('config-member.reactVote'),
        value: t('config-member.reactVoteDescription', { emote: cachedGuild.db.voteEmote }),
      },
    ];

    await interaction.reply({
      embeds: [{ author: { name: t('config-member.personalSettings') }, fields }],
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
