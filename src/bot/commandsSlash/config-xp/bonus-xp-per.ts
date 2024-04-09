import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { registerSubCommand } from 'bot/util/commandLoader.js';

registerSubCommand({
  async execute(interaction) {
    // TODO (old permissions) deprecate
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
      bonusPerTextMessage: interaction.options.getInteger('message') ?? undefined,
      bonusPerVoiceMinute: interaction.options.getInteger('voiceminute') ?? undefined,
      bonusPerVote: interaction.options.getInteger('vote') ?? undefined,
      bonusPerInvite: interaction.options.getInteger('invite') ?? undefined,
    };
    if (Object.values(items).every((x) => x === undefined)) {
      return await interaction.reply({
        content: 'You must specify at least one option for this command to do anything!',
        ephemeral: true,
      });
    }

    const cachedGuild = await getGuildModel(interaction.guild);
    cachedGuild.upsert(items);

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setAuthor({ name: 'Bonus XP Values' }).setColor(0x00ae86)
          .setDescription(stripIndent`
        Modified Bonus XP Values! New values:
  
        \`${cachedGuild.db.bonusPerTextMessage} xp\` per text message
        \`${cachedGuild.db.bonusPerVoiceMinute} xp\` per minute in VC
        \`${cachedGuild.db.bonusPerVote} xp\` per vote
        \`${cachedGuild.db.bonusPerInvite} xp\` per invite
        `),
      ],
      ephemeral: true,
    });
  },
});
