import { Temporal } from 'temporal-polyfill';
import { DurationFormat } from '@formatjs/intl-durationformat';
import { PermissionFlagsBits } from 'discord.js';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { command } from '#bot/commands.js';

export default command({
  name: 'config-server cooldown',
  async execute({ interaction, options, t }) {
    if (
      interaction.channel &&
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({ content: t('missing.manageServer'), ephemeral: true });
      return;
    }

    const items = {
      textMessageCooldownSeconds: options.message,
      voteCooldownSeconds: options.vote,
    };
    if (Object.values(items).every((x) => x === undefined)) {
      await interaction.reply({ content: t('missing.option'), ephemeral: true });
      return;
    }

    const cachedGuild = await getGuildModel(interaction.guild);
    await cachedGuild.upsert(items);

    function fmtDuration(seconds: number): string {
      let dura = Temporal.Duration.from({ seconds });
      // balances `dura` up until "x days"
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration#duration_balancing
      dura = dura.round('days');

      return new DurationFormat([interaction.locale, 'en-US'], { style: 'long' }).format(dura);
    }

    const messageTime = fmtDuration(cachedGuild.db.textMessageCooldownSeconds);
    const voteTime = fmtDuration(cachedGuild.db.voteCooldownSeconds);

    await interaction.reply({
      embeds: [
        {
          author: { name: t('config-server.cooldownValues') },
          color: 0x00ae86,
          description: t('config-server.modifiedCD', { messageTime, voteTime }),
        },
      ],
      ephemeral: true,
    });
  },
  autocompletes: {
    async message({ interaction, t }) {
      await interaction.respond([
        { name: t('config-server.noCD'), value: 0 },
        { name: t('config-server.5sec'), value: 5 },
        { name: t('config-server.15sec'), value: 15 },
        { name: t('config-server.30sec'), value: 30 },
        { name: t('config-server.1min'), value: 60 },
        { name: t('config-server.2min'), value: 120 },
      ]);
    },
    async vote({ interaction, t }) {
      await interaction.respond([
        { name: t('config-server.3min'), value: 60 * 3 },
        { name: t('config-server.5min'), value: 60 * 5 },
        { name: t('config-server.10min'), value: 60 * 10 },
        { name: t('config-server.30min'), value: 60 * 30 },
        { name: t('config-server.1h'), value: 60 * 60 },
        { name: t('config-server.3h'), value: 60 * 60 * 3 },
        { name: t('config-server.6h'), value: 60 * 60 * 6 },
        { name: t('config-server.12h'), value: 60 * 60 * 12 },
        { name: t('config-server.24h'), value: 60 * 60 * 24 },
      ]);
    },
  },
});
