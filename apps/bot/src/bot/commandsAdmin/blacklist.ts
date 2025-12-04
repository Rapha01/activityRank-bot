import { command } from '#bot/commands.ts';
import { getUserModel } from '#bot/models/userModel.ts';
import { MODERATOR_ONLY } from '#bot/util/predicates.ts';
import { getGuildModel } from '../models/guild/guildModel.ts';

const user = command({
  name: 'blacklist user',
  predicate: MODERATOR_ONLY,
  async execute({ interaction, options }) {
    const user = options.user;

    const targetUser = await getUserModel(user);

    if (targetUser.db.isBanned) {
      await targetUser.upsert({ isBanned: 0 });
      await interaction.reply({
        content: `Unblacklisted user ${user} (\`${user.id}\`)`,
        ephemeral: true,
      });
    } else {
      await targetUser.upsert({ isBanned: 1 });
      await interaction.reply({
        content: `Blacklisted user ${user} (\`${user.id}\`)`,
        ephemeral: true,
      });
    }
  },
});

const guild = command({
  name: 'blacklist guild',
  predicate: MODERATOR_ONLY,
  async execute({ interaction, client, options }) {
    const guildId = options.id;
    const guild = await client.guilds.fetch(guildId);

    const targetGuild = await getGuildModel(guild);

    if (targetGuild.db.isBanned) {
      await targetGuild.upsert({ isBanned: 0 });
      await interaction.reply({
        content: `Unblacklisted guild ${guild} (\`${guild.id}\`)`,
        ephemeral: true,
      });
    } else {
      await targetGuild.upsert({ isBanned: 1 });
      await interaction.reply({
        content: `Blacklisted guild ${guild} (\`${guild.id}\`)`,
        ephemeral: true,
      });
    }
  },
});

export default [user, guild];
