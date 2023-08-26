import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { PRIVILEGE_LEVELS } from '../../const/privilegedUsers';

export const requiredPrivileges = PRIVILEGE_LEVELS.HelpStaff;

export const data = new SlashCommandBuilder()
  .setName('atest')
  .setDescription('A test admin command.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export const execute = async function (i) {
  const sent = await i.deferReply({ fetchReply: true, ephemeral: true });
  const pingEmbed = new EmbedBuilder()
    .setColor(0x00ae86)
    .setTitle('🏓 Pong! 🏓')
    .addFields(
      {
        name: '🔁 Roundtrip Latency 🔁',
        value: `\`\`\`${sent.createdTimestamp - i.createdTimestamp}ms\`\`\``,
      },
      {
        name: '💗 API Heartbeat 💗',
        value: `\`\`\`${Math.round(i.client.ws.ping)}ms\`\`\``,
      }
    )
    .setTimestamp();
  await i.editReply({ embeds: [pingEmbed], ephemeral: true });
};


// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
    requiredPrivileges,
    data,
    execute,
}

// GENERATED: end of generated content by `exports-to-default`.

