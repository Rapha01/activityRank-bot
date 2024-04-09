import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { registerSubCommand } from 'bot/util/commandLoader.js';

registerSubCommand({
  async execute(interaction) {
    if (
      !interaction.channel ||
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
    }
    const items = {
      xpPerTextMessage: interaction.options.getInteger('message') ?? undefined,
      xpPerVoiceMinute: interaction.options.getInteger('voiceminute') ?? undefined,
      xpPerVote: interaction.options.getInteger('vote') ?? undefined,
      xpPerInvite: interaction.options.getInteger('invite') ?? undefined,
    };
    if (Object.values(items).every((x) => x === undefined)) {
      return await interaction.reply({
        content: 'You must specify at least one option for this command to do anything!',
        ephemeral: true,
      });
    }

    const cachedGuild = await getGuildModel(interaction.guild);
    await cachedGuild.upsert(items);

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setAuthor({ name: 'XP Values' }).setColor(0x00ae86)
          .setDescription(stripIndent`
        Modified XP Values! New values:
  
        \`${cachedGuild.db.xpPerTextMessage} xp\` per text message
        \`${cachedGuild.db.xpPerVoiceMinute} xp\` per minute in VC
        \`${cachedGuild.db.xpPerVote} xp\` per vote
        \`${cachedGuild.db.xpPerInvite} xp\` per invite
        `),
      ],
      ephemeral: true,
    });
  },
});
