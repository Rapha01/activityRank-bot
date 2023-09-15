import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { registerAdminCommand } from 'bot/util/commandLoader.js';
import { PrivilegeLevel } from 'const/privilegeLevels.js';

registerAdminCommand({
  data: new SlashCommandBuilder()
    .setName('atest')
    .setDescription('A test admin command.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  execute: async function (interaction) {
    const sent = await interaction.deferReply({ fetchReply: true, ephemeral: true });
    const pingEmbed = new EmbedBuilder()
      .setColor(0x00ae86)
      .setTitle('🏓 Pong! 🏓')
      .addFields(
        {
          name: '🔁 Roundtrip Latency 🔁',
          value: `\`\`\`${sent.createdTimestamp - interaction.createdTimestamp}ms\`\`\``,
        },
        {
          name: '💗 API Heartbeat 💗',
          value: `\`\`\`${Math.round(interaction.client.ws.ping)}ms\`\`\``,
        },
      )
      .setTimestamp();
    await interaction.editReply({ embeds: [pingEmbed] });
  },
  requiredPrivilege: PrivilegeLevel.HelpStaff,
});
