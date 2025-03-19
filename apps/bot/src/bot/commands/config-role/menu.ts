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
  type APIEmbed,
} from 'discord.js';
import { getRoleModel, type RoleModel } from '#bot/models/guild/guildRoleModel.js';
import nameUtil from '../../util/nameUtil.js';
import { command } from '#bot/commands.js';
import { actionrow, closeButton } from '#bot/util/component.js';
import { component, modal } from '#bot/util/registry/component.js';
import { requireUser } from '#bot/util/predicates.js';
import type { TFunction } from 'i18next';

type AssignType = 'assignMessage' | 'deassignMessage';

const generateMainRow = (
  t: TFunction<'command-content'>,
  interaction: Interaction<'cached'>,
  role: RoleModel,
) => {
  const predicate = requireUser(interaction.user);
  return actionrow([
    {
      label: t('config-role.noXP'),
      customId: noXpButton.instanceId({ data: { role }, predicate }),
      style: role.db.noXp ? ButtonStyle.Success : ButtonStyle.Danger,
      type: ComponentType.Button,
    },
    {
      label: t('config-role.assignMessage'),
      customId: modalButton.instanceId({ data: { role, type: 'assignMessage' }, predicate }),
      style: ButtonStyle.Secondary,
      type: ComponentType.Button,
    },
    {
      label: t('config-role.deassignMessage'),
      customId: modalButton.instanceId({ data: { role, type: 'deassignMessage' }, predicate }),
      style: ButtonStyle.Secondary,
      type: ComponentType.Button,
    },
  ]);
};

const generateCloseRow = (
  t: TFunction<'command-content'>,
  interaction: Interaction<'cached'>,
  role: RoleModel,
) =>
  actionrow([
    {
      label: t('config-role.clearMessage'),
      style: ButtonStyle.Danger,
      customId: clearButton.instanceId({
        data: { role },
        predicate: requireUser(interaction.user),
      }),
      type: ComponentType.Button,
    },
    {
      label: t('config-role.close'),
      style: ButtonStyle.Danger,
      customId: closeButton.instanceId({ predicate: requireUser(interaction.user) }),
      type: ComponentType.Button,
    },
  ]);

const _modal = (t: TFunction<'command-content'>, role: RoleModel, type: AssignType) =>
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

    const embed: APIEmbed = {
      author: { name: t('config-role.roleSettings') },
      description: nameUtil.getRoleMention(interaction.guild.roles.cache, resolvedRole.id),
      color: 0x00ae86,
      fields: [
        {
          name: t('config-role.noXP'),
          value: t('config-role.noXPDescription'),
        },
        {
          name: t('config-role.assignMessage'),
          value: t('config-role.assignMessageDescription'),
        },
        {
          name: t('config-role.deassignMessage'),
          value: t('config-role.deassignMessageDescription'),
        },
      ],
    };

    await interaction.reply({
      embeds: [embed],
      components: [
        generateMainRow(t, interaction, cachedRole),
        generateCloseRow(t, interaction, cachedRole),
      ],
    });
  },
});

const clearButton = component<{ role: RoleModel }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    await interaction.reply({
      content: t('config-role.toClear'),
      components: [
        actionrow([
          {
            label: t('config-role.assignMessage'),
            style: ButtonStyle.Secondary,
            customId: unsetMessageButton.instanceId({
              data: { role: data.role, type: 'assignMessage' },
            }),
            type: ComponentType.Button,
          },
          {
            label: t('config-role.deassignMessage'),
            style: ButtonStyle.Secondary,
            customId: unsetMessageButton.instanceId({
              data: { role: data.role, type: 'deassignMessage' },
            }),
            type: ComponentType.Button,
          },
        ]),
      ],
      ephemeral: true,
    });
  },
});

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
      components: [
        generateMainRow(t, interaction, data.role),
        generateCloseRow(t, interaction, data.role),
      ],
    });

    drop();
  },
});

const modalButton = component<{ role: RoleModel; type: AssignType }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    await interaction.showModal(_modal(t, data.role, data.type));
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
      embeds: [new EmbedBuilder().setDescription(value).setColor('#4fd6c8')],
      ephemeral: true,
    });
  },
});
