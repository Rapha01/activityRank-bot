import { actionrow, useConfirm } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { command, Deploy, type BasicSlashCommandData } from '#bot/util/registry/command.js';
import {
  ApplicationCommandType,
  ButtonStyle,
  ComponentType,
  type Guild,
  WebhookClient,
  type WebhookMessageCreateOptions,
} from 'discord.js';
import { config } from '#const/config.js';

export const debugCommandData: BasicSlashCommandData = {
  name: 'debug',
  description: 'Send debug data about this server to ActivityRank Support.',
  default_member_permissions: '0',
  type: ApplicationCommandType.ChatInput,
};

const info = `If you press the **Confirm** button, ActivityRank Staff will be sent data about your server. They will receive the following information:

* General: 
  * Server ID
  * Server Name
  * Owner ID & Name
  * Approximate Member Count
  * The bot's base permissions in your server
`;
/* 
TODO:
* Channel information:
  * The ID and name of NoCommand channels
  * The ID and name of CommandOnly channels
* Role information:
  * The ID, name, and configuration of levelling roles, which include roles: 
    * with an assignLevel, 
    * with a deassignLevel, or 
    * those set as noXp
  * The hierarchal position of the bot's role, compared to any levelling roles */

async function getHookMessage(guild: Guild): Promise<WebhookMessageCreateOptions> {
  const owner = await guild.fetchOwner();
  const me = await guild.members.fetchMe();

  const fullGuild = await guild.fetch();

  const missingPermissions = me.permissions.missing(294172224721n);

  return {
    embeds: [
      {
        author: { name: `Debug information from ${guild.name}` },
        description: `* Guild ID: **\`${guild.id}\`**
* Owner: **${owner.displayName} [${owner.user.username} - \`${guild.ownerId}\`]**
* Member Count: **~${fullGuild.approximateMemberCount}**
* ${missingPermissions.length > 0 ? `Missing Permissions:\n${missingPermissions.map((p) => ` * ${p}`).join('\n')}` : 'No Missing Permissions'}
    `,
      },
    ],
  };
}

export default command.basic({
  deploymentMode: Deploy.Never,
  data: debugCommandData,
  async execute({ interaction }) {
    const predicate = requireUser(interaction.user);
    await interaction.reply({
      content: info,
      components: [
        actionrow([
          {
            type: ComponentType.Button,
            customId: confirmButton.instanceId({ predicate }),
            style: ButtonStyle.Primary,
            label: 'Confirm',
          },
          {
            type: ComponentType.Button,
            customId: denyButton.instanceId({ predicate }),
            style: ButtonStyle.Secondary,
            label: 'Deny',
          },
        ]),
      ],
    });
  },
});

const { confirmButton, denyButton } = useConfirm({
  async confirmFn({ interaction }) {
    if (!config.supportServer.supportHook) {
      await interaction.update({
        components: [],
        content: 'The /debug functionality has been disabled.',
      });
      return;
    }
    const hook = new WebhookClient({ url: config.supportServer.supportHook });

    await hook.send(await getHookMessage(interaction.guild));
    await interaction.update({ components: [] });
    await interaction.followUp({
      content: `Successfully sent debug information to support staff.\n\nYour Guild ID is \`${interaction.guild.id}\`.`,
    });
  },
  async denyFn({ interaction }) {
    await interaction.update({ components: [] });
  },
});
