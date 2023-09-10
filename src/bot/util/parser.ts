/*
.addChannelOption(o => o
  .setName('channel').setDescription('The channel to modify')
  .addChannelTypes([GuildText, GuildVoice]))
.addStringOption(o => o
  .setName('id').setDescription('The ID of the channel to modify'));
*/

import type { CommandInteraction } from 'discord.js';

export const parseChannel = async (interaction: CommandInteraction<'cached'>) => {
  let id = null;
  if (interaction.options.get('channel')) id = interaction.options.get('channel').value;
  if (interaction.options.getString('id')) id = interaction.options.getString('id');

  if (!id) return null;

  const channel = interaction.guild.channels.cache.get(id);

  return { id, channel };
};

export const parseRole = async (interaction: CommandInteraction<'cached'>) => {
  let id = null;
  if (interaction.options.get('role')) id = interaction.options.get('role').value;
  if (interaction.options.getString('id')) id = interaction.options.getString('id');

  if (!id) return null;

  const role = interaction.guild.roles.cache.get(id);

  return { id, role };
};

export const parseMember = async (interaction: CommandInteraction<'cached'>) => {
  let id = null;
  if (interaction.options.get('member')) id = interaction.options.get('member').value;
  if (interaction.options.getString('id')) id = interaction.options.getString('id');

  if (!id) return null;

  const member = null;
  try {
    const member = await interaction.guild.members.fetch(id);
  } catch (e) {}

  return { id, member };
};

export default {
  parseChannel,
  parseRole,
  parseMember,
};
