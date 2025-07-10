import {
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ComponentType,
  type Interaction,
  type ContainerComponentData,
  type BaseMessageOptions,
  MessageFlags,
} from 'discord.js';
import { getRoleModel, type RoleModel } from '#bot/models/guild/guildRoleModel.js';
import { getRoleMention } from '../../util/nameUtil.js';
import { command } from '#bot/commands.js';
import { actionrow, container } from '#bot/util/component.js';
import { component, modal } from '#bot/util/registry/component.js';
import { requireUser } from '#bot/util/predicates.js';
import type { TFunction } from 'i18next';
import invariant from 'tiny-invariant';

type AssignType = 'assignMessage' | 'deassignMessage';

const getModal = (t: TFunction<'command-content'>, role: RoleModel, type: AssignType) =>
  new ModalBuilder()
    .setCustomId(messageModal.instanceId({ data: { type, role } }))
    .setTitle(
      type === 'assignMessage' ? t('config-role.assignMessage') : t('config-role.deassignMessage'),
    )
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('msg-component-1')
          .setLabel(
            type === 'assignMessage'
              ? t('config-role.assignToSend')
              : t('config-role.deassignToSend'),
          )
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setRequired(true),
      ),
    );

export default command({
  name: 'config-role menu',
  async execute({ interaction, options, t }) {
    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    const resolvedRole = options.role;
    if (resolvedRole.id === interaction.guild.id) {
      await interaction.reply({
        content: t('config-role.everyone'),
        ephemeral: true,
        allowedMentions: { parse: [] },
      });
      return;
    }

    const cachedRole = await getRoleModel(resolvedRole);

    await interaction.reply({
      components: await renderPage(t, resolvedRole.id, cachedRole, interaction),
      flags: [MessageFlags.IsComponentsV2],
    });
  },
});

async function renderPage(
  t: TFunction<'command-content'>,
  roleId: string,
  role: RoleModel,
  interaction: Interaction,
): Promise<BaseMessageOptions['components']> {
  invariant(interaction.guild);

  const predicate = requireUser(interaction.user);
  const enabled = role.db.noXp === 1;
  const main: ContainerComponentData = container(
    [
      {
        type: ComponentType.TextDisplay,
        content: `## ${t('config-role.roleSettings')} • ${getRoleMention(interaction.guild.roles.cache, roleId)}`,
      },
      { type: ComponentType.Separator, spacing: 2 },
      {
        type: ComponentType.Section,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `### ${t('config-role.noXp')}\n${t('config-role.noXpDescription')}`,
          },
        ],
        accessory: {
          type: ComponentType.Button,
          customId: noXpButton.instanceId({ data: { role }, predicate }),
          style: enabled ? ButtonStyle.Success : ButtonStyle.Danger,
          label: enabled ? t('config-role.button.enabled') : t('config-role.button.not-enabled'),
        },
      },
      {
        type: ComponentType.TextDisplay,
        content: `### ${t('config-role.assignMessage')}\n${t('config-role.assignMessageDescription')}`,
      },
      actionrow([
        {
          type: ComponentType.Button,
          customId: modalButton.instanceId({ data: { role, type: 'assignMessage' }, predicate }),
          style: ButtonStyle.Secondary,
          label: t('config-role.button.edit'),
        },
        {
          type: ComponentType.Button,
          customId: unsetMessageButton.instanceId({
            data: { role, type: 'assignMessage' },
            predicate,
          }),
          style: ButtonStyle.Secondary,
          disabled: role.db.assignMessage === '',
          label: t('config-role.button.clear'),
        },
      ]),
      {
        type: ComponentType.TextDisplay,
        content: `### ${t('config-role.deassignMessage')}\n${t('config-role.deassignMessageDescription')}`,
      },
      actionrow([
        {
          type: ComponentType.Button,
          customId: modalButton.instanceId({ data: { role, type: 'deassignMessage' }, predicate }),
          style: ButtonStyle.Secondary,
          label: t('config-role.button.edit'),
        },
        {
          type: ComponentType.Button,
          customId: unsetMessageButton.instanceId({
            data: { role, type: 'deassignMessage' },
            predicate,
          }),
          style: ButtonStyle.Secondary,
          disabled: role.db.deassignMessage === '',
          label: t('config-role.button.clear'),
        },
      ]),
    ],
    { accentColor: 0x01c3d9 },
  );

  return [main];
}

const unsetMessageButton = component<{ role: RoleModel; type: AssignType }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    await interaction.deferReply({ ephemeral: true });

    await data.role.upsert({ [data.type]: '' });

    await interaction.editReply({
      content: t(
        data.type === 'assignMessage' ? 'config-role.removedAssign' : 'config-role.removedDeassign',
        { roleId: data.role.object.id },
      ),
    });
  },
});

const noXpButton = component<{ role: RoleModel }>({
  type: ComponentType.Button,
  async callback({ interaction, data, drop, t }) {
    const myRole = await data.role.fetch();

    if (myRole.noXp) {
      await data.role.upsert({ noXp: 0 });
    } else {
      await data.role.upsert({ noXp: 1 });
    }

    await interaction.update({
      components: await renderPage(t, data.role.object.id, data.role, interaction),
    });

    drop();
  },
});

const modalButton = component<{ role: RoleModel; type: AssignType }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    await interaction.showModal(getModal(t, data.role, data.type));
  },
});

const messageModal = modal<{ type: AssignType; role: RoleModel }>({
  async callback({ interaction, data, t }) {
    const { role, type } = data;
    const value = interaction.fields.getTextInputValue('msg-component-1');
    await role.upsert({ [type]: value });

    await interaction.deferReply({ ephemeral: true });
    await interaction.followUp({
      content: t(
        type === 'assignMessage' ? 'config-role.addedAssign' : 'config-role.addedDeassign',
        { roleId: role.object.id },
      ),
      embeds: [new EmbedBuilder().setDescription(value).setColor(0x01c3d9)],
      ephemeral: true,
    });
  },
});
