import type {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  GuildMember,
  User,
} from 'discord.js';
import {
  getStaffEntitlement,
  hasStaffEntitlement,
  type StaffEntitlementLevel,
} from '#const/config.ts';
import type { CommandPredicateConfig } from './registry/command.ts';
import type { ComponentPredicateConfig } from './registry/component.ts';
import type { Predicate } from './registry/predicate.ts';

function userHasStaffLevel(user: User, requiredLevel: StaffEntitlementLevel): Predicate {
  const { isStaff, entitlementLevel } = getStaffEntitlement(user.id);
  return isStaff && hasStaffEntitlement(requiredLevel, entitlementLevel) ? 'ALLOW' : 'DENY';
}

async function INVALID_CALLBACK(
  interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
) {
  interaction.client.logger.warn(
    { interaction },
    'Unauthorised attempt to access restricted command',
  );
  await interaction.reply({
    content:
      'Sorry! This command is only accessible to ActivityRank staff. [This incident will be reported.](https://xkcd.com/838)',
  });
}

export const DEVELOPER_ONLY: CommandPredicateConfig = {
  validate: (user) => userHasStaffLevel(user, 'DEVELOPER'),
  invalidCallback: INVALID_CALLBACK,
};

export const MODERATOR_ONLY: CommandPredicateConfig = {
  validate: (user) => userHasStaffLevel(user, 'MODERATOR'),
  invalidCallback: INVALID_CALLBACK,
};

export const HELPSTAFF_ONLY: CommandPredicateConfig = {
  validate: (user) => userHasStaffLevel(user, 'HELPSTAFF'),
  invalidCallback: INVALID_CALLBACK,
};

export const requireUserId = (memberId: string): ComponentPredicateConfig => ({
  async invalidCallback(interaction) {
    await interaction.reply({ content: 'This component is not for you!', ephemeral: true });
  },
  validate(interaction) {
    return interaction.user.id === memberId ? 'ALLOW' : 'DENY';
  },
});

export const requireUser = (member: User | GuildMember): ComponentPredicateConfig => ({
  invalidCallback: requireUserId(member.id).invalidCallback,
  validate(interaction) {
    return requireUserId(member.id).validate(interaction);
  },
});
