import { PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { command } from '#bot/commands.js';

export default command({
  name: 'config-xp bonus-xp-per',
  async execute({ interaction, options }) {
    if (
      !interaction.channel ||
      !interaction.member.permissionsIn(interaction.channel).has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: 'You need the permission to manage the server in order to use this command.',
        ephemeral: true,
      });
      return;
    }

    const items = {
      bonusPerTextMessage: options.message,
      bonusPerVoiceMinute: options.voiceminute,
      bonusPerVote: options.vote,
      bonusPerInvite: options.invite,
    };
    if (Object.values(items).every((x) => x === undefined)) {
      await interaction.reply({
        content: 'You must specify at least one option for this command to do anything!',
        ephemeral: true,
      });
      return;
    }

    const cachedGuild = await getGuildModel(interaction.guild);
    cachedGuild.upsert(items);

    await interaction.reply({
      embeds: [
        {
          author: { name: 'Bonus XP Values' },
          color: 0x00ae86,
          description: stripIndent`
            Modified Bonus XP Values! New values:
      
            \`${cachedGuild.db.bonusPerTextMessage} xp\` per text message
            \`${cachedGuild.db.bonusPerVoiceMinute} xp\` per minute in VC
            \`${cachedGuild.db.bonusPerVote} xp\` per vote
            \`${cachedGuild.db.bonusPerInvite} xp\` per invite
          `,
        },
      ],
      ephemeral: true,
    });
  },
});
