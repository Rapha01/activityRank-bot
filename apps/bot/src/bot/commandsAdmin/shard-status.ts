import { command, permissions } from '#bot/commands.js';
import { HELPSTAFF_ONLY } from '#bot/util/predicates.js';
import { AttachmentBuilder, EmbedBuilder, Status, ApplicationCommandOptionType } from 'discord.js';
import { DurationFormatter } from '@sapphire/duration';
import { managerFetch } from '../../models/managerDb/managerDb.js';

interface APIShard {
  shardId: number;
  status: Status;
  serverCount: number;
  uptimeSeconds: number;
  readyDate: Date;
  ip: string;
  changedHealthDate: Date;
}

export default command.basic({
  deploymentMode: 'LOCAL_ONLY',
  data: {
    name: 'shard-status',
    description: 'Check the status of each shard.',
    default_member_permissions: permissions(permissions.ModerateMembers),
    options: [
      {
        name: 'full',
        description: 'Send the full shard list',
        type: ApplicationCommandOptionType.Boolean,
      },
      {
        name: 'eph',
        description: 'Send as an ephemeral message',
        type: ApplicationCommandOptionType.Boolean,
      },
      {
        name: 'filtered',
        description: 'Find problematic shards',
        type: ApplicationCommandOptionType.Boolean,
      },
      {
        name: 'page',
        description: 'Find a page',
        max_value: 200,
        type: ApplicationCommandOptionType.Integer,
      },
      {
        name: 'search',
        description: 'Get a specific shard',
        type: ApplicationCommandOptionType.Integer,
      },
      {
        name: 'search-guild',
        description: 'Get the shard of a specific guild',
        min_length: 17,
        max_length: 20,
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  predicate: HELPSTAFF_ONLY,
  async execute({ interaction }) {
    const ephemeral = interaction.options.getBoolean('eph') ?? false;

    await interaction.deferReply({ ephemeral });

    const { stats }: { stats: APIShard[] } = await managerFetch('api/stats/', { method: 'GET' });

    const filtered = interaction.options.getBoolean('filtered');

    let data = stats.map(({ ip, ...keepAttrs }) => keepAttrs);

    if (filtered) data = data.filter(({ status }) => status !== Status.Ready);

    const files = interaction.options.getBoolean('full')
      ? [
          new AttachmentBuilder(Buffer.from(JSON.stringify(data, null, 2), 'utf8'), {
            name: 'logs.json',
          }),
        ]
      : [];

    const search = interaction.options.getInteger('search') ?? null;

    if (search !== null) {
      const found = data.find((s) => s.shardId === search);
      await interaction.editReply({
        content: found
          ? `Shard ${found.shardId}:\n${parseShardInfoContent(found)}`
          : `Could not find shard with id \`${search}\``,
        files,
      });
      return;
    }

    const guildSearch = interaction.options.getString('search-guild') ?? null;

    if (guildSearch !== null) {
      const totalShards = interaction.client.shard?.count ?? 0;
      const shardId = Number((BigInt(guildSearch) >> 22n) % BigInt(totalShards));

      const found = data.find((s) => s.shardId === shardId);
      await interaction.editReply({
        content: `Shard ID of guild \`${guildSearch}\`: \`${shardId}\`\n\n${
          found
            ? `Shard ${found.shardId}:\n${parseShardInfoContent(found)}`
            : '🔴 Could not find shard'
        }`,
        files,
      });
      return;
    }

    if (!data.length) {
      await interaction.editReply({
        content: 'All shards are online!',
        files,
      });
      return;
    }

    const page = interaction.options.getInteger('page') ?? 0;

    const e = new EmbedBuilder()
      .setTitle(`Shards ${page * 15} - ${(page + 1) * 15} (total ${data.length})`)
      .setFields(
        data.slice(page * 15, (page + 1) * 15).map((shard) => ({
          name: shard.shardId.toString(),
          value: parseShardInfoContent(shard),
          inline: true,
        })),
      );

    await interaction.editReply({ embeds: [e], files });
  },
});

const durationFormatter = new DurationFormatter();

function parseShardInfoContent(shard: Omit<APIShard, 'ip'>) {
  return [
    `  **Status**: \`${shard.status === 0 ? '🟢 Online' : `🔴 ${Status[shard.status]}`}\``,
    `  **Guilds**: \`${shard.serverCount.toLocaleString()}\``,
    `  **Uptime**: \`${durationFormatter.format(shard.uptimeSeconds * 1000, 3)}\` since <t:${
      shard.readyDate
    }:f>, <t:${shard.readyDate}:R>`,
    `  **Last updated**: <t:${shard.changedHealthDate}:T>, <t:${shard.changedHealthDate}:R>`,
  ].join('\n');
}
