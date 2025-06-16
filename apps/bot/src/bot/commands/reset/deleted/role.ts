import { command } from '#bot/commands.js';
import { getGuildModel } from '#bot/models/guild/guildModel.js';
import { shards } from '#models/shardDb/shardDb.js';

export default command({
  name: 'reset deleted role',
  async execute({ interaction, options, t }) {
    const roleId = options.id;
    if (!/^\d*$/.test(roleId)) {
      await interaction.reply({ content: 'Discord IDs are always numbers.', ephemeral: true });
      return;
    }

    if (await interaction.guild.roles.fetch(roleId)) {
      await interaction.reply({ content: 'This role still exists.', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const { dbHost } = await getGuildModel(interaction.guild);

    await shards
      .get(dbHost)
      .db.deleteFrom('guildRole')
      .where('guildId', '=', interaction.guild.id)
      .where('roleId', '=', roleId)
      .executeTakeFirstOrThrow();

    await interaction.followUp({ content: `Reset deleted role with ID \`${roleId}\`` });
  },
});
