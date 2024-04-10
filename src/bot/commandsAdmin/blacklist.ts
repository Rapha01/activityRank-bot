import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildModel } from '../models/guild/guildModel.js';
import { getUserModel } from 'bot/models/userModel.js';
import { registerAdminCommand } from 'bot/util/commandLoader.js';
import { PrivilegeLevel } from 'const/config.js';

registerAdminCommand({
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Blacklist a user or server from the bot.')
    .addSubcommand((sc) =>
      sc
        .setName('user')
        .setDescription('Blacklist a user from the bot')
        .addUserOption((o) =>
          o.setName('user').setDescription('The user to blacklist').setRequired(true),
        ),
    )
    .addSubcommand((sc) =>
      sc
        .setName('server')
        .setDescription('Blacklist a server from the bot')
        .addStringOption((o) =>
          o
            .setName('server')
            .setDescription('The ID of the server to blacklist')
            .setMinLength(17)
            .setMaxLength(19)
            .setRequired(true),
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.ManageGuild),
  requiredPrivilege: PrivilegeLevel.Developer,
  execute: async function (interaction) {
    const sc = interaction.options.getSubcommand();
    if (sc === 'user') {
      const user = await interaction.client.users.fetch(interaction.options.getUser('user')!);
      if (!user) {
        return await interaction.reply({
          content: 'This user does not exist.',
          ephemeral: true,
        });
      }

      const targetUser = await getUserModel(user);

      if (targetUser.db.isBanned) {
        await targetUser.upsert({ isBanned: 0 });
        return await interaction.reply({
          content: `Unblacklisted user ${user} (\`${user.id}\`)`,
          ephemeral: true,
        });
      } else {
        await targetUser.upsert({ isBanned: 1 });
        return await interaction.reply({
          content: `Blacklisted user ${user} (\`${user.id}\`)`,
          ephemeral: true,
        });
      }
    }

    if (sc === 'guild') {
      const guild = await interaction.client.guilds.fetch({
        guild: interaction.options.getString('guild')!,
        withCounts: false,
      });
      if (!guild) {
        return await interaction.reply({
          content: 'This guild does not exist.',
          ephemeral: true,
        });
      }

      const cachedGuild = await getGuildModel(guild);

      if (cachedGuild.db.isBanned) {
        await cachedGuild.upsert({ isBanned: 0 });
        return await interaction.reply({
          content: `Unblacklisted guild \`${guild.name}\` (\`${guild.id}\`)`,
          ephemeral: true,
        });
      } else {
        await cachedGuild.upsert({ isBanned: 1 });
        return await interaction.reply({
          content: `Blacklisted guild \`${guild.name}\` (\`${guild.id}\`)`,
          ephemeral: true,
        });
      }
    }
  },
});
