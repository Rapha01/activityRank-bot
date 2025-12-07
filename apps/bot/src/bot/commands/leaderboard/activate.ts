import { ButtonStyle, ComponentType, MessageFlags } from 'discord.js';
import invariant from 'tiny-invariant';
import { command } from '#bot/commands.ts';
import { produceToplistMessage, serializeWebhook } from '#bot/cron/updateLeaderboards.ts';
import { getGuildModel } from '#bot/models/guild/guildModel.ts';
import { container, section, textDisplay } from '#bot/util/component.ts';
import { PREMIUM_BUTTON } from '#bot/util/constants.ts';
import { oneline } from '#bot/util/templateStrings.ts';
import { emoji } from '#const/config.ts';
import { hasValidEntitlement } from '#util/fct.ts';

export default command({
  name: 'leaderboard activate',
  async execute({ interaction, options }) {
    if (!hasValidEntitlement(interaction)) {
      await interaction.reply({
        components: [
          container(
            [
              textDisplay('## This command requires Premium!'),
              textDisplay(
                oneline`
                  ${interaction.user.toString()}, please consider helping us by becoming a Premium supporter. \
                  The bot is mostly free! Activating Premium for you or your server gives you quality of life \
                  upgrades, like the ability to host an auto-updating leaderboard.`,
              ),
              section(
                {
                  type: ComponentType.TextDisplay,
                  content: `To support a server you love and help us improve the bot for everyone, consider **activating ${emoji('store')} Premium** for your server!`,
                },
                PREMIUM_BUTTON,
              ),
              textDisplay(`### ${emoji('activityrank')} Thank you for your support!`),
            ],
            { accentColor: 0x1c3d9 },
          ),
        ],
        allowedMentions: { parse: [] },
        flags: [MessageFlags.IsComponentsV2],
      });
      return;
    }

    await interaction.deferReply();

    invariant(options.channel.isTextBased() && !options.channel.isThread());

    const hook = await options.channel.createWebhook({
      name: 'Leaderboard',
      avatar: interaction.guild.members.me?.avatarURL() ?? interaction.client.user.avatarURL(),
    });

    const guildModel = await getGuildModel(interaction.guild);
    const message = await hook.send(await produceToplistMessage(interaction.guild, guildModel));

    await guildModel.upsert({ leaderboardWebhook: serializeWebhook(hook, message.id) });

    if (message.pinnable) {
      await message.pin().catch(() => {});
    }

    await interaction.followUp({
      components: [
        {
          type: ComponentType.Section,
          components: [textDisplay('Leaderboard created.')],
          accessory: {
            type: ComponentType.Button,
            style: ButtonStyle.Link,
            url: message.url,
            label: 'Leaderboard',
          },
        },
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  },
});
