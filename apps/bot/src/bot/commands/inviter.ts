import {
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
  type GuildMember,
} from 'discord.js';
import type { TFunction } from 'i18next';
import { command } from '#bot/commands.ts';
import { getGuildModel } from '#bot/models/guild/guildModel.ts';
import { useConfirm } from '#bot/util/component.ts';
import { resolveMember } from '#bot/util/parser.ts';
import { requireUser } from '#bot/util/predicates.ts';
import fct from '../../util/fct.ts';
import { getMemberModel } from '../models/guild/guildMemberModel.ts';
import statFlushCache from '../statFlushCache.ts';

export default command({
  name: 'inviter',
  async execute({ interaction, options, t }) {
    const member = await resolveMember(options.member, interaction);

    if (!member) {
      await interaction.reply({ content: t('missing.notOnServer'), ephemeral: true });
      return;
    }

    const cachedGuild = await getGuildModel(interaction.guild);

    if (!cachedGuild.db.inviteXp) {
      await interaction.reply({ content: t('inviter.disabled'), ephemeral: true });
      return;
    }

    if (member.id === interaction.member.id) {
      await interaction.reply({ content: t('inviter.ownInviter'), ephemeral: true });
      return;
    }

    const cachedMember = await getMemberModel(interaction.member);
    const myMember = await cachedMember.fetch();
    const cachedTarget = await getMemberModel(member);
    const myTarget = await cachedTarget.fetch();

    if (myMember.inviter !== '0') {
      await interaction.reply({ content: t('inviter.alreadySet'), ephemeral: true });
      return;
    }
    if (myTarget.inviter === interaction.member.id) {
      await interaction.reply({ content: t('inviter.invited'), ephemeral: true });
      return;
    }
    if (member.user.bot) {
      await interaction.reply({ content: t('inviter.bot'), ephemeral: true });
      return;
    }

    if (await fct.hasNoXpRole(member)) {
      await interaction.reply({ content: t('inviter.noXP'), ephemeral: true });
      return;
    }

    await confirmInviter(t, interaction, member);
  },
});

async function confirmInviter(
  t: TFunction<'command-content'>,
  interaction: ChatInputCommandInteraction<'cached'>,
  inviter: GuildMember,
) {
  const predicate = requireUser(interaction.user);
  await interaction.reply({
    content: t('inviter.confirmation', { inviter: inviter.toString() }),
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            customId: confirmButton.instanceId({ data: { inviter }, predicate }),
            style: ButtonStyle.Primary,
            label: t('inviter.confirm'),
          },
          {
            type: ComponentType.Button,
            customId: denyButton.instanceId({ predicate }),
            style: ButtonStyle.Secondary,
            label: t('inviter.cancel'),
          },
        ],
      },
    ],
    allowedMentions: { users: [] },
  });
}

const { confirmButton, denyButton } = useConfirm<{ inviter: GuildMember }>({
  async confirmFn({ interaction, data, drop, t }) {
    await interaction.deferUpdate();

    const cachedMember = await getMemberModel(interaction.member);
    await cachedMember.upsert({ inviter: data.inviter.id });

    await statFlushCache.addInvite(data.inviter, 1);
    await statFlushCache.addInvite(interaction.member, 1);

    await interaction.editReply({ content: t('inviter.success'), components: [] });
    drop();
  },
  async denyFn({ interaction, drop }) {
    await interaction.deferUpdate();
    await interaction.deleteReply();
    drop();
  },
});
