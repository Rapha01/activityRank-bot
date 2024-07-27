import { getPrivileges, hasPrivilege } from 'const/config.js';
import { Predicate, type CommandPredicateConfig } from './registry/command.js';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, User } from 'discord.js';
import type { PrivilegeLevel } from 'const/config.types.js';

function userHasPrivilege(user: User, privilege: PrivilegeLevel): Predicate {
  const userPrivileges = getPrivileges()[user.id];
  return hasPrivilege(privilege, userPrivileges) ? Predicate.Allow : Predicate.Deny;
}

async function INVALID_CALLBACK(
  interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
) {
  interaction.client.logger.warn(
    { interaction },
    'Unauthorised attempt to access privileged command',
  );
  await interaction.reply({
    content: `Sorry! This command is only accessible to ActivityRank staff. [This incident will be reported.](https://xkcd.com/838)`,
  });
}

export const OWNER_ONLY: CommandPredicateConfig = {
  validate: (user) => userHasPrivilege(user, 'OWNER'),
  invalidCallback: INVALID_CALLBACK,
};

export const DEVELOPER_ONLY: CommandPredicateConfig = {
  validate: (user) => userHasPrivilege(user, 'DEVELOPER'),
  invalidCallback: INVALID_CALLBACK,
};

export const MODERATOR_ONLY: CommandPredicateConfig = {
  validate: (user) => userHasPrivilege(user, 'MODERATOR'),
  invalidCallback: INVALID_CALLBACK,
};

export const HELPSTAFF_ONLY: CommandPredicateConfig = {
  validate: (user) => userHasPrivilege(user, 'HELPSTAFF'),
  invalidCallback: INVALID_CALLBACK,
};
