import { SlashCommandBuilder } from 'discord.js';
import { getMemberModel } from '../models/guild/guildMemberModel.js';
import statFlushCache from '../statFlushCache.js';
import fct from '../../util/fct.js';
import { registerSlashCommand } from 'bot/util/commandLoader.js';
import { getGuildModel } from 'bot/models/guild/guildModel.js';

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('inviter')
    .setDescription('Set a member as your inviter')
    .addUserOption((o) =>
      o
        .setName('member')
        .setDescription('The user that invited you to the server')
        .setRequired(true),
    ),
  execute: async (interaction) => {
    const member = interaction.options.getMember('member')!;
    const cachedGuild = await getGuildModel(interaction.guild);

    if (!cachedGuild.db.inviteXp) {
      return await interaction.reply({
        content: 'The invite XP module is paused on this server.',
        ephemeral: true,
      });
    }
    if (member.id == interaction.member.id) {
      return await interaction.reply({
        content: 'You cannot be the inviter of yourself.',
        ephemeral: true,
      });
    }

    const cachedMember = await getMemberModel(interaction.member);
    const myMember = await cachedMember.fetch();
    const cachedTarget = await getMemberModel(member);
    const myTarget = await cachedTarget.fetch();

    if (myMember.inviter !== '0') {
      return await interaction.reply({
        content: 'You have already set your inviter. This setting is unchangeable.',
        ephemeral: true,
      });
    } else if (myTarget.inviter === interaction.member.id) {
      return await interaction.reply({
        content: 'You cannot set your inviter to a person who has been invited by you.',
        ephemeral: true,
      });
    } else if (member.user.bot) {
      return await interaction.reply({
        content: 'You cannot set a bot as your inviter.',
        ephemeral: true,
      });
    }

    if (await fct.hasNoXpRole(member)) {
      return await interaction.reply({
        content:
          'The member you are trying to set as your inviter cannot be selected, because of an assigned noXP role.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    await cachedMember.upsert({ inviter: member.id });

    await statFlushCache.addInvite(member, 1);
    await statFlushCache.addInvite(interaction.member, 1);

    return await interaction.editReply({
      content:
        'Your inviter has been set successfully. You will both get 1 invite added to your stats.',
    });
  },
});
