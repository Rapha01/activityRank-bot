import {
  type BaseMessageOptions,
  ButtonStyle,
  ComponentType,
  type ContainerComponentData,
  type Interaction,
  MessageFlags,
  type ModalComponentData,
  PermissionFlagsBits,
  TextInputStyle,
} from 'discord.js';
import type { TFunction } from 'i18next';
import invariant from 'tiny-invariant';
import { command } from '#bot/commands.ts';
import { getRoleModel, type RoleModel } from '#bot/models/guild/guildRoleModel.ts';
import { actionrow, container } from '#bot/util/component.ts';
import { requireUser } from '#bot/util/predicates.ts';
import { component, modal } from '#bot/util/registry/component.ts';
import { getRoleMention } from '../../util/nameUtil.ts';

type AssignType = 'assignMessage' | 'deassignMessage';

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
          customId: modalButton.instanceId({
            data: { role, type: 'assignMessage', editOriginal: true },
            predicate,
          }),
          style: ButtonStyle.Primary,
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
        {
          type: ComponentType.Button,
          customId: testMessageButton.instanceId({
            data: { role, type: 'assignMessage' },
            predicate,
          }),
          style: ButtonStyle.Secondary,
          disabled: role.db.assignMessage === '',
          label: t('config-role.button.test'),
        },
      ]),
      {
        type: ComponentType.TextDisplay,
        content: `### ${t('config-role.deassignMessage')}\n${t('config-role.deassignMessageDescription')}`,
      },
      actionrow([
        {
          type: ComponentType.Button,
          customId: modalButton.instanceId({
            data: { role, type: 'deassignMessage', editOriginal: true },
            predicate,
          }),
          style: ButtonStyle.Primary,
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
        {
          type: ComponentType.Button,
          customId: testMessageButton.instanceId({
            data: { role, type: 'deassignMessage' },
            predicate,
          }),
          style: ButtonStyle.Secondary,
          disabled: role.db.deassignMessage === '',
          label: t('config-role.button.test'),
        },
      ]),
    ],
    { accentColor: 0x01c3d9 },
  );

  return [main];
}

function getModal(
  t: TFunction<'command-content'>,
  role: RoleModel,
  type: AssignType,
  editOriginal: boolean,
): ModalComponentData {
  return {
    customId: messageModal.instanceId({ data: { type, role, editOriginal } }),
    title: t(`config-role.${type}`),
    components: [
      actionrow([
        {
          customId: 'msg-component-1',
          label:
            type === 'assignMessage'
              ? t('config-role.assignToSend')
              : t('config-role.deassignToSend'),
          type: ComponentType.TextInput,
          style: TextInputStyle.Paragraph,
          required: true,
          maxLength: 1000,
          value: role.db[type],
        },
      ]),
    ],
  };
}

const unsetMessageButton = component<{ role: RoleModel; type: AssignType }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    await interaction.deferUpdate();

    await data.role.upsert({ [data.type]: '' });

    await interaction.editReply({
      components: await renderPage(t, data.role.object.id, data.role, interaction),
    });
  },
});

const testMessageButton = component<{ role: RoleModel; type: AssignType }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    const value = data.role.db[data.type];

    await interaction.reply({
      components: [
        container(
          [
            {
              type: ComponentType.TextDisplay,
              content: `## ${t(`config-role.${data.type}`)}`,
            },
            {
              type: ComponentType.Section,
              components: [
                {
                  type: ComponentType.TextDisplay,
                  content: `-# ${t('config-role.editAgain')}`,
                },
              ],
              accessory: {
                type: ComponentType.Button,
                customId: modalButton.instanceId({
                  data: { ...data, editOriginal: false },
                  predicate: requireUser(interaction.user),
                }),
                style: ButtonStyle.Secondary,
                label: t('config-role.button.edit'),
              },
            },
            { type: ComponentType.Separator, spacing: 2 },
            { type: ComponentType.TextDisplay, content: value },
          ],
          { accentColor: 0x01c3d9 },
        ),
      ],
      flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
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

const modalButton = component<{ role: RoleModel; type: AssignType; editOriginal: boolean }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    await interaction.showModal(getModal(t, data.role, data.type, data.editOriginal));
  },
});

const messageModal = modal<{ type: AssignType; role: RoleModel; editOriginal: boolean }>({
  async callback({ interaction, data, t }) {
    await interaction.deferUpdate();

    const { role, type } = data;
    const value = interaction.fields.getTextInputValue('msg-component-1');
    await role.upsert({ [type]: value });

    const response = {
      components: [
        container(
          [
            {
              type: ComponentType.TextDisplay,
              content: `## ${t(`config-role.${data.type}Set`)}`,
            },
            {
              type: ComponentType.Section,
              components: [
                {
                  type: ComponentType.TextDisplay,
                  content: `-# ${t('config-role.editAgain')}`,
                },
              ],
              accessory: {
                type: ComponentType.Button,
                customId: modalButton.instanceId({
                  data: { ...data, editOriginal: false },
                  predicate: requireUser(interaction.user),
                }),
                style: ButtonStyle.Secondary,
                label: t('config-role.button.edit'),
              },
            },
            { type: ComponentType.Separator, spacing: 2 },
            { type: ComponentType.TextDisplay, content: value },
          ],
          { accentColor: 0x01c3d9 },
        ),
      ],
    } as const;

    if (data.editOriginal) {
      // update initial message
      await interaction.editReply({
        components: await renderPage(t, data.role.object.id, data.role, interaction),
      });
      // send a follow-up response
      await interaction.followUp({
        ...response,
        flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
      });
    } else {
      // just edit current follow up response
      await interaction.editReply(response);
    }
  },
});
