import { SlashCommandBuilder } from 'discord.js';
import guildMemberModel from '../models/guild/guildMemberModel.js';
import statFlushCache from '../statFlushCache.js';
import fct from '../../util/fct.js';
import { registerSlashCommand } from 'bot/util/commandLoader.js';

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
    await guildMemberModel.cache.load(interaction.member);
    if (!interaction.guild.appData.inviteXp) {
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

    const myGuildMember = await guildMemberModel.storage.get(
      interaction.guild,
      interaction.member.id,
    );
    const myTargetGuildMember = await guildMemberModel.storage.get(interaction.guild, member.id);

    if (myGuildMember.inviter != 0) {
      return await interaction.reply({
        content: 'You have already set your inviter. This setting is final.',
        ephemeral: true,
      });
    }
    if (myTargetGuildMember.inviter != 0 && myTargetGuildMember.inviter == interaction.member.id) {
      return await interaction.reply({
        content: 'You cannot set your inviter to a person who has been invited by you.',
        ephemeral: true,
      });
    }
    if (member.user.bot) {
      return await interaction.reply({
        content: 'You cannot set a bot as your inviter.',
        ephemeral: true,
      });
    }

    await guildMemberModel.cache.load(member);

    if (await fct.hasNoXpRole(member)) {
      return await interaction.reply({
        content:
          'The member you are trying to set as your inviter cannot be selected, because of an assigned noXP role.',
        ephemeral: true,
      });
    }
    await guildMemberModel.storage.set(
      interaction.guild,
      interaction.member.id,
      'inviter',
      member.id,
    );

    await statFlushCache.addInvite(member, 1);
    await statFlushCache.addInvite(interaction.member, 1);

    return await interaction.reply({
      content:
        'Your inviter has been set successfully. You will both get 1 invite added to your stats.',
      ephemeral: true,
    });
  },
});
