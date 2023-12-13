import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  AttachmentBuilder,
  EmbedBuilder,
  Status,
} from 'discord.js';

import { DurationFormatter } from '@sapphire/duration';
import managerDb from '../../models/managerDb/managerDb.js';
import { registerAdminCommand } from 'bot/util/commandLoader.js';
import { PrivilegeLevel } from 'const/config.js';

export const activeCache = new Map();

interface APIShard {
  shardId: number;
  status: Status;
  serverCount: number;
  uptimeSeconds: number;
  readyDate: Date;
  ip: string;
  changedHealthDate: Date;
}

registerAdminCommand({
  data: new SlashCommandBuilder()
    .setName('shard-status')
    .setDescription('Check the shard statuses')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addBooleanOption((o) => o.setName('full').setDescription('Send the full shard list'))
    .addBooleanOption((o) => o.setName('eph').setDescription('Send as an ephemeral message'))
    .addBooleanOption((o) => o.setName('filtered').setDescription('Find problematic shards'))
    .addIntegerOption((o) => o.setName('page').setDescription('Find a page').setMaxValue(200))
    .addIntegerOption((o) => o.setName('search').setDescription('Get a specific shard'))
    .addStringOption((o) =>
      o
        .setName('search-guild')
        .setDescription('Get the shard of a specific guild')
        .setMinLength(17)
        .setMaxLength(19),
    )
    .setDMPermission(false),
  requiredPrivilege: PrivilegeLevel.HelpStaff,
  execute: async function (i) {
    const ephemeral = Boolean(i.options.getBoolean('eph'));

    await i.deferReply({ ephemeral });

    const { stats }: { stats: APIShard[] } = await managerDb.fetch(null, '/api/stats/', 'get');

    const filtered = i.options.getBoolean('filtered');

    let data = stats.map(({ ip, ...keepAttrs }) => keepAttrs);

    if (filtered) data = data.filter(({ status }) => status !== Status.Ready);

    const files = i.options.getBoolean('full')
      ? [
          new AttachmentBuilder(Buffer.from(JSON.stringify(data, null, 2), 'utf8'), {
            name: 'logs.json',
          }),
        ]
      : [];

    const search = i.options.getInteger('search') ?? null;

    if (search !== null) {
      const found = data.find((s) => s.shardId === search);
      return await i.editReply({
        content: found
          ? `Shard ${found.shardId}:\n${parseShardInfoContent(found)}`
          : 'Could not find shard',
        files,
      });
    }

    const guildSearch = i.options.getString('search-guild') ?? null;

    if (guildSearch !== null) {
      const totalShards = i.client.shard!.count;
      const shardId = Number((BigInt(guildSearch) >> 22n) % BigInt(totalShards));

      const found = data.find((s) => s.shardId === shardId);
      return await i.editReply({
        content:
          `Shard ID of guild \`${guildSearch}\`: \`${shardId}\`\n\n` +
          (found
            ? `Shard ${found.shardId}:\n${parseShardInfoContent(found)}`
            : '🔴 Could not find shard'),
        files,
      });
    }

    if (!data.length) {
      console.assert(filtered, JSON.stringify(stats, null, 2));
      return await i.editReply({
        content: 'All shards are online!',
        files,
      });
    }

    const page = i.options.getInteger('page') ?? 0;

    const e = new EmbedBuilder()
      .setTitle(`Shards ${page * 15} - ${(page + 1) * 15} (total ${data.length})`)
      .setFields(
        data.slice(page * 15, (page + 1) * 15).map((shard) => ({
          name: shard.shardId.toString(),
          value: parseShardInfoContent(shard),
          inline: true,
        })),
      );

    await i.editReply({
      embeds: [e],
      files,
    });
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

export default { activeCache };
