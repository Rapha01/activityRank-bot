import { command } from 'bot/util/registry/command.js';
import { ApplicationCommandOptionType } from 'discord.js';
import { getGuildModel } from 'bot/models/guild/guildModel.js';
import { getMemberModel } from '../models/guild/guildMemberModel.js';
import statFlushCache from '../statFlushCache.js';
import fct from '../../util/fct.js';

export default command.basic({
  data: {
    name: 'inviter',
    description: 'Set a member as your inviter',
    options: [
      {
        name: 'member',
        description: 'The user that invited you to the server',
        required: true,
        type: ApplicationCommandOptionType.User,
      },
    ],
  },
  async execute({ interaction }) {
    const member = interaction.options.getMember('member');

    if (!member) {
      await interaction.reply({
        content: 'The specified member is not on the server.',
        ephemeral: true,
      });
      return;
    }

    const cachedGuild = await getGuildModel(interaction.guild);

    if (!cachedGuild.db.inviteXp) {
      await interaction.reply({
        content: 'Invite XP is disabled on this server.',
        ephemeral: true,
      });
      return;
    }

    if (member.id == interaction.member.id) {
      await interaction.reply({
        content: 'You cannot be the inviter of yourself.',
        ephemeral: true,
      });
      return;
    }

    const cachedMember = await getMemberModel(interaction.member);
    const myMember = await cachedMember.fetch();
    const cachedTarget = await getMemberModel(member);
    const myTarget = await cachedTarget.fetch();

    if (myMember.inviter !== '0') {
      await interaction.reply({
        content: 'You have already set your inviter. This setting is unchangeable.',
        ephemeral: true,
      });
      return;
    } else if (myTarget.inviter === interaction.member.id) {
      await interaction.reply({
        content: 'You cannot set your inviter to a person who has been invited by you.',
        ephemeral: true,
      });
      return;
    } else if (member.user.bot) {
      await interaction.reply({
        content: 'You cannot set a bot as your inviter.',
        ephemeral: true,
      });
      return;
    }

    if (await fct.hasNoXpRole(member)) {
      await interaction.reply({
        content:
          'The member you are trying to set as your inviter cannot be selected, because of an assigned noXP role.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    await cachedMember.upsert({ inviter: member.id });

    await statFlushCache.addInvite(member, 1);
    await statFlushCache.addInvite(interaction.member, 1);

    await interaction.editReply({
      content:
        'Your inviter has been set successfully. You will both get 1 invite added to your stats.',
    });
  },
});
