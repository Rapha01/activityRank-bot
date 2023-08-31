import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('bonus')
  .setDescription('Give/take bonus XP!')
  .addSubcommand((sc) =>
    sc
      .setName('role')
      .setDescription('Change the bonus XP of all members with a role')
      .addRoleOption((o) =>
        o.setName('role').setDescription('The role to modify').setRequired(true),
      )
      .addIntegerOption((o) =>
        o
          .setName('change')
          .setDescription('The amount of XP to change all users with the role by')
          .setMinValue(-1_000_000)
          .setMaxValue(1_000_000)
          .setRequired(true),
      )
      .addBooleanOption((o) =>
        o
          .setName('use-beta')
          .setDescription(
            'Enables the beta method of giving bonus to roles. Warning: will not send levelUpMessages',
          ),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName('member')
      .setDescription("Change a member's bonus XP")
      .addUserOption((o) =>
        o.setName('member').setDescription('The member to modify').setRequired(true),
      )
      .addIntegerOption((o) =>
        o
          .setName('change')
          .setDescription('The amount of XP to change the member by')
          .setMinValue(-1_000_000)
          .setMaxValue(1_000_000)
          .setRequired(true),
      ),
  );

// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
  data,
};

// GENERATED: end of generated content by `exports-to-default`.
