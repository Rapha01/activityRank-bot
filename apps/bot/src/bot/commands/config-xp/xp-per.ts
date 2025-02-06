import { PermissionFlagsBits } from 'discord.js';
import { stripIndent } from 'common-tags';
import { getGuildModel } from '../../models/guild/guildModel.js';
import { command } from '#bot/commands.js';

export default command({
  name: 'config-xp xp-per',
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
      xpPerTextMessage: options.message,
      xpPerVoiceMinute: options.voiceminute,
      xpPerVote: options.vote,
      xpPerInvite: options.invite,
    };

    if (Object.values(items).every((x) => x === undefined)) {
      await interaction.reply({
        content: 'You must specify at least one option for this command to do anything!',
        ephemeral: true,
      });
      return;
    }

    const cachedGuild = await getGuildModel(interaction.guild);
    await cachedGuild.upsert(items);

    await interaction.reply({
      embeds: [
        {
          author: { name: 'XP Values' },
          color: 0x00ae86,
          description: stripIndent`
            Modified XP Values! New values:
      
            \`${cachedGuild.db.xpPerTextMessage} xp\` per text message
            \`${cachedGuild.db.xpPerVoiceMinute} xp\` per minute in VC
            \`${cachedGuild.db.xpPerVote} xp\` per vote
            \`${cachedGuild.db.xpPerInvite} xp\` per invite
          `,
        },
      ],
      ephemeral: true,
    });
  },
});
