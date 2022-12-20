const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  AttachmentBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  Status,
} = require('discord.js');
const { PRIVILEGE_LEVELS } = require('../../const/privilegedUsers');

module.exports.activeCache = new Map();

module.exports.requiredPrivileges = PRIVILEGE_LEVELS.HelpStaff;

module.exports.data = new SlashCommandBuilder()
  .setName('shard-status')
  .setDescription('Check the shard statuses')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addBooleanOption((o) =>
    o.setName('full').setDescription('Send the full shard list')
  )
  .addBooleanOption((o) =>
    o.setName('eph').setDescription('Send as an ephemeral message')
  )
  .addBooleanOption((o) =>
    o.setName('filtered').setDescription('Find problematic shards')
  )
  .addIntegerOption((o) =>
    o.setName('page').setDescription('Find a page').setMaxValue(200)
  )
  .addIntegerOption((o) =>
    o.setName('search').setDescription('Get a specific shard').setMaxValue(200)
  )
  .setDMPermission(false);

module.exports.execute = async function (i) {
  await i.deferReply();

  const filtered = i.options.getBoolean('filtered');

  let data = await i.client.shard.broadcastEval((client) => [
    client.shard.ids,
    client.ws.status,
    client.ws.ping,
    client.guilds.cache.size,
  ]);
  data = data.map((shard) => ({
    ids: shard[0],
    status: shard[1] === 0 ? '🟢 Online' : `🔴 ${Status[shard[1]]}`,
    ping: shard[2],
    guilds: shard[3],
  }));

  if (filtered) data = data.filter(({ status }) => status !== '🟢 Online');

  const ephemeral = i.options.getBoolean('eph');

  const files = i.options.getBoolean('full')
    ? [
        new AttachmentBuilder(
          Buffer.from(JSON.stringify(data, null, 2), 'utf8'),
          { name: 'logs.json' }
        ),
      ]
    : [];

  const page = i.options.getInteger('page');
  const search = i.options.getInteger('search');

  if (Number.isInteger(search)) {
    const found = data.find((s) => s.ids.includes(search));
    return await i.editReply({
      content: found
        ? `Shard ${found.ids}:\n  **Status:** ${found.status}\n  **Ping:** ${found.ping}ms\n  **Guilds:** ${found.guilds}`
        : 'Could not find shard',
      ephemeral,
      files,
    });
  }

  if (!data.length)
    return await i.editReply({
      content: 'Could not find shards matching the filter',
      ephemeral,
      files,
    });

  const e = new EmbedBuilder()
    .setTitle(`Shards ${page * 15} - ${(page + 1) * 15} (total ${data.length})`)
    .setFields(
      data.slice(page * 15, (page + 1) * 15).map((s) => ({
        name: s.ids.join(', '),
        value: `**Status:** ${s.status}\n**Ping:** ${s.ping}ms\n**Guilds:** ${s.guilds}`,
        inline: true,
      }))
    );

  await i.editReply({
    embeds: [e],
    ephemeral,
    files,
  });
};
