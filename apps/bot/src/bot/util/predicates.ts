import { hasPrivilege, privileges, type PrivilegeLevel } from '#const/config.js';
import type { CommandPredicateConfig } from './registry/command.js';
import { Predicate } from './registry/predicate.js';
import type {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  GuildMember,
  User,
} from 'discord.js';
import type { ComponentPredicateConfig } from './registry/component.js';

function userHasPrivilege(user: User, privilege: PrivilegeLevel): Predicate {
  const userPrivileges = privileges[user.id];
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
    content:
      'Sorry! This command is only accessible to ActivityRank staff. [This incident will be reported.](https://xkcd.com/838)',
  });
}

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

export const requireUserId = (memberId: string): ComponentPredicateConfig => ({
  async invalidCallback(interaction) {
    await interaction.reply({ content: 'This component is not for you!', ephemeral: true });
  },
  validate(interaction) {
    return interaction.user.id === memberId ? Predicate.Allow : Predicate.Deny;
  },
});

export const requireUser = (member: User | GuildMember): ComponentPredicateConfig => ({
  invalidCallback: requireUserId(member.id).invalidCallback,
  validate(interaction) {
    return requireUserId(member.id).validate(interaction);
  },
});
