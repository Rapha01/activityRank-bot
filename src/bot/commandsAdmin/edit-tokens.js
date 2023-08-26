import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { PRIVILEGE_LEVELS } from '../../const/privilegedUsers';
import userModel from '../models/userModel';

const authorizedUsers = [
  '270273690074087427', // Wolf
  '370650814223482880', // Rapha
  '774660568728469585', // 01
];

export const requiredPrivileges = PRIVILEGE_LEVELS.Moderator;

export const data = new SlashCommandBuilder()
  .setName('edit-tokens')
  .setDescription("Edit a user's tokens.")
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .setDMPermission(false)
  /* .addSubcommand(sc => sc
    .setName('set')
    .setDescription('Set a user\'s tokens to a value')
    .addUserOption(o => o
      .setName('user')
      .setDescription('The user to modify the tokens of')
      .setRequired(true))
    .addIntegerOption(o => o
      .setName('amount')
      .setDescription('The amount to set the user\'s tokens to')
      .setRequired(true))) */
  .addSubcommand((sc) =>
    sc
      .setName('modify')
      .setDescription('Give or take tokens from a user')
      .addUserOption((o) =>
        o
          .setName('user')
          .setDescription('The user to modify the tokens of')
          .setRequired(true)
      )
      .addIntegerOption((o) =>
        o
          .setName('amount')
          .setDescription('The amount of tokens to give/take from the user')
          .setRequired(true)
      )
      .addBooleanOption((o) =>
        o
          .setName('independent')
          .setDescription(
            'If selected, will not count tokens as purchased. Also applies for negative changes.'
          )
      )
  );

export const execute = async function (i) {
  if (!authorizedUsers.includes(i.user.id)) {
    i.client.logger.warn(
      `Unauthorized command attempt in editTokens command by user ${i.user.tag} [${i.user.id}]`
    );
    return;
  }

  const target = i.options.getUser('user', true);

  const value = i.options.getInteger('amount', true);
  if (!value)
    return await i.reply({
      content: 'Invalid `amount` param',
      ephemeral: true,
    });

  const indep = i.options.getBoolean('independent');

  await userModel.cache.load(target);
  await userModel.storage.increment(target, 'tokens', value);
  if (!indep) await userModel.storage.increment(target, 'tokensBought', value);

  await i.reply({
    content: `<@${
      target.id
    }>'s tokens were changed by \`${value.toLocaleString()}\`. \n*This process __${
      indep ? 'did not' : 'did'
    }__ affect their \`tokensBought\` value.*`,
  });
};


// GENERATED: start of generated content by `exports-to-default`.
// [GENERATED: exports-to-default:v0]

export default {
    requiredPrivileges,
    data,
    execute,
}

// GENERATED: end of generated content by `exports-to-default`.

