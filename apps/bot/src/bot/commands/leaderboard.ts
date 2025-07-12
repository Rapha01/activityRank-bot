import { command } from '#bot/commands.js';
import { getGuildModel } from '#bot/models/guild/guildModel.js';
import { container, section } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import { component } from '#bot/util/registry/component.js';
import { error } from '#bot/util/response.js';
import {
  ButtonStyle,
  type Entitlement,
  MessageFlags,
  ComponentType,
  type GuildTextBasedChannel,
  type AnyThreadChannel,
  type DMChannel,
  WebhookClient,
} from 'discord.js';
import invariant from 'tiny-invariant';

export default command({
  name: 'leaderboard',
  async execute({ interaction, t }) {
    invariant(interaction.inCachedGuild());

    const isValidEntitlement = (e: Entitlement) =>
      e.isGuildSubscription() &&
      e.isActive() &&
      e.guildId === interaction.guildId &&
      e.skuId === '1393334749568696361'; // Premium

    if (!interaction.entitlements.some(isValidEntitlement)) {
      // TODO: improve
      await interaction.reply({
        components: [
          {
            type: ComponentType.Container,
            accentColor: 0x5866f2, // Discord's "blurple" theme color
            components: [
              {
                type: ComponentType.Section,
                components: [{ type: ComponentType.TextDisplay, content: 'Get Premium!' }],
                accessory: {
                  type: ComponentType.Button,
                  style: ButtonStyle.Premium,
                  sku_id: '1393334749568696361',
                },
              },
            ],
          },
        ],
        flags: [MessageFlags.IsComponentsV2],
      });
      return;
    }

    if (!interaction.channel?.isTextBased() || interaction.channel.isThread()) {
      await error(t('leaderboard.noThread')).replyTo(interaction);
      return;
    }
    invariant(
      !interaction.channel.isDMBased(),
      'the `contexts` field of this command is set to [GUILD]',
    );

    const cachedGuild = await getGuildModel(interaction.guild);

    if (cachedGuild.db.leaderboardWebhook) {
      await interaction.reply({
        components: [
          container([
            { type: ComponentType.TextDisplay, content: `## ${t('leaderboard.header')}` },
            section(
              { type: ComponentType.TextDisplay, content: t('leaderboard.editConfirmation') },
              {
                type: ComponentType.Button,
                style: ButtonStyle.Primary,
                label: t('leaderboard.create'),
                customId: createLeaderboardButton.instanceId({
                  data: { channel: interaction.channel },
                  predicate: requireUser(interaction.user),
                }),
              },
            ),
          ]),
        ],
        flags: [MessageFlags.IsComponentsV2],
      });
      return;
    }

    await interaction.deferReply();

    const leaderhook = await interaction.channel.createWebhook({
      name: t('leaderboard.leaderboard'),
      avatar: interaction.client.user.avatarURL({ size: 2048 }),
    });
    await cachedGuild.upsert({ leaderboardWebhook: leaderhook.url });
    const message = await leaderhook.send({
      embeds: [{ color: 0x01c3d9, description: '# Leaderboard' }],
    });

    await interaction.followUp({
      components: [
        container([
          { type: ComponentType.TextDisplay, content: `## ${t('leaderboard.header')}` },
          section(
            {
              type: ComponentType.TextDisplay,
              content: t('leaderboard.confirmCreate'),
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Link,
              label: t('leaderboard.goTo'),
              url: message.url,
            },
          ),
        ]),
      ],
      flags: [MessageFlags.IsComponentsV2],
    });
  },
});

type WebhookableChannel = Exclude<GuildTextBasedChannel, AnyThreadChannel | DMChannel>;
const createLeaderboardButton = component<{ channel: WebhookableChannel }>({
  type: ComponentType.Button,
  async callback({ interaction, data, t }) {
    await interaction.deferReply();

    const cachedGuild = await getGuildModel(interaction.guild);

    if (cachedGuild.db.leaderboardWebhook) {
      try {
        const client = new WebhookClient({ url: cachedGuild.db.leaderboardWebhook });
        await client.delete();
      } catch {
        // ignore
      }
    }

    const leaderhook = await data.channel.createWebhook({
      name: t('leaderboard.leaderboard'),
      avatar: interaction.client.user.avatarURL({ size: 2048 }),
    });

    await cachedGuild.upsert({ leaderboardWebhook: leaderhook.url });

    const message = await leaderhook.send({
      embeds: [{ color: 0x01c3d9, description: '# Leaderboard' }],
    });

    await interaction.followUp({
      components: [
        container([
          { type: ComponentType.TextDisplay, content: `## ${t('leaderboard.header')}` },
          section(
            {
              type: ComponentType.TextDisplay,
              content: t('leaderboard.confirmUpdate'),
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Link,
              label: t('leaderboard.goTo'),
              url: message.url,
            },
          ),
        ]),
      ],
      flags: [MessageFlags.IsComponentsV2],
    });
  },
});
