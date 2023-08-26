import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { PRIVILEGE_LEVELS } from '../../const/privilegedUsers';
import guildModel from '../models/guild/guildModel';
import userModel from '../models/userModel';

export const requiredPrivileges = PRIVILEGE_LEVELS.Developer;

export const data = new SlashCommandBuilder()
  .setName('blacklist')
  .setDescription('Blacklist a user or server from the bot.')
  .addSubcommand((sc) =>
    sc
      .setName('user')
      .setDescription('Blacklist a user from the bot')
      .addUserOption((o) =>
        o
          .setName('user')
          .setDescription('The user to blacklist')
          .setRequired(true)
      )
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
          .setRequired(true)
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export const execute = async function (i) {
  const sc = await i.options.getSubcommand();
  if (sc === 'user') {
    const user = await i.client.users.fetch(i.options.getUser('user'));
    if (!user) {
      return await i.reply({
        content: 'This user does not exist.',
        ephemeral: true,
      });
    }

    await userModel.cache.load(user);
    const targetUser = await userModel.storage.get(user);

    if (targetUser.isBanned) {
      await userModel.storage.set(user, 'isBanned', 0);
      return await i.reply({
        content: `Unblacklisted user ${user} (\`${user.id}\`)`,
        ephemeral: true,
      });
    } else {
      await userModel.storage.set(user, 'isBanned', 1);
      return await i.reply({
        content: `Blacklisted user ${user} (\`${user.id}\`)`,
        ephemeral: true,
      });
    }
  }

  if (sc === 'guild') {
    const guild = await i.client.guilds.fetch({
      guild: i.options.getString('guild'),
      withCounts: false,
    });
    if (!guild) {
      return await i.reply({
        content: 'This guild does not exist.',
        ephemeral: true,
      });
    }

    await guildModel.cache.load(guild);
    const targetGuild = await guildModel.storage.get(guild);
    if (targetGuild.isBanned) {
      await guildModel.storage.set(guild, 'isBanned', 0);
      return await i.reply({
        content: `Unblacklisted guild \`${guild.name}\` (\`${guild.id}\`)`,
        ephemeral: true,
      });
    } else {
      await guildModel.storage.set(guild, 'isBanned', 1);
      return await i.reply({
        content: `Blacklisted guild \`${guild.name}\` (\`${guild.id}\`)`,
        ephemeral: true,
      });
    }
  }
};


// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
    requiredPrivileges,
    data,
    execute,
}

// GENERATED: end of generated content by `exports-to-default`.

