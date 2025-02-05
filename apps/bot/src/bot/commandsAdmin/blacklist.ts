import { command, permissions, subcommand } from '#bot/commands.js';
import { MODERATOR_ONLY } from '#bot/util/predicates.js';
import { ApplicationCommandOptionType } from 'discord.js';
import { getGuildModel } from '../models/guild/guildModel.js';
import { getUserModel } from '#bot/models/userModel.js';

const user = subcommand({
  data: {
    name: 'user',
    description: 'Blacklist a user from the bot.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'user',
        description: 'The user to blacklist',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },
  async execute({ interaction }) {
    const user = interaction.options.getUser('user', true);

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

const guild = subcommand({
  data: {
    name: 'guild',
    description: 'Blacklist a guild from the bot.',
    type: ApplicationCommandOptionType.Subcommand,
    options: [
      {
        name: 'id',
        description: 'The ID of the guild to blacklist',
        type: ApplicationCommandOptionType.String,
        min_length: 17,
        max_length: 20,
        required: true,
      },
    ],
  },
  async execute({ interaction, client }) {
    const guildId = interaction.options.getString('id', true);
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

export default command.parent({
  deploymentMode: 'LOCAL_ONLY',
  data: {
    name: 'blacklist',
    description: 'Blacklist a user or server from the bot.',
    default_member_permissions: permissions(permissions.KickMembers, permissions.BanMembers),
  },
  predicate: MODERATOR_ONLY,
  subcommands: [user, guild],
});
