import {
  ComponentType,
  type DiscordAPIError,
  type Guild,
  type GuildMember,
  type MessageCreateOptions,
  MessageFlags,
  PermissionFlagsBits,
  RESTJSONErrorCodes,
  type Role,
} from 'discord.js';
import invariant from 'tiny-invariant';
import { emoji } from '#const/config.js';
import fct from '../util/fct.js';
import { getMemberModel } from './models/guild/guildMemberModel.js';
import { getGuildModel } from './models/guild/guildModel.js';
import { getRoleModel } from './models/guild/guildRoleModel.js';
import nameUtil from './util/nameUtil.js';
import { difference, symmetricDifference } from './util/typescript.js';
import { warnGuild } from './util/warning.js';

/** Returns whether or not a member with the given scores would have levelled up. */
export async function checkLevelup(guild: Guild, oldTotalScore: number, newTotalScore: number) {
  const cachedGuild = await getGuildModel(guild);

  const oldLevel = fct.getLevel(fct.getLevelProgression(oldTotalScore, cachedGuild.db.levelFactor));
  const newLevel = fct.getLevel(fct.getLevelProgression(newTotalScore, cachedGuild.db.levelFactor));

  return { isLevelup: oldLevel !== newLevel, newLevel };
}

/**
 * Sends a levelup message for the member. Check {@link checkLevelup} before running this function.
 * If `newRoles` is not provided, the function will call {@link getNewMemberRoles} itself.
 */
export async function sendLevelupMessage(
  member: GuildMember,
  newLevel: number,
  newRoles?: string[],
): Promise<void> {
  const roles = newRoles ?? (await getNewMemberRoles(member, newLevel));
  // TODO?: should we require roles to be assignable in
  //     ?  `sendLevelupMessage` or just in `runRoleUpdate`?
  const canAssign = await checkRolesAreAssignable(member, newLevel, roles);
  if (canAssign.ok) {
    const messages = await getRoleAssignmentMessages(member, roles);
    await sendGratulationMessage(member, messages, newLevel);
  } else {
    // TODO: error handling
  }
}

export const alreadyWarnedGuilds = new Set();

/**
 * Checks that roles are assignable and attempts to assign roles to the given member.
 * If `newRoles` is not provided, the function will call {@link getNewMemberRoles} itself.
 */
export async function runRoleUpdate(
  member: GuildMember,
  newLevel: number,
  newRoles?: string[],
): Promise<void> {
  const roles = newRoles ?? (await getNewMemberRoles(member, newLevel));
  const canAssign = await checkRolesAreAssignable(member, newLevel, roles);
  if (canAssign.ok) {
    try {
      await member.roles.set(roles);
    } catch (err) {
      member.client.logger.warn(
        { err, memberId: member.id, guildId: member.guild.id, newLevel },
        'Failed to set member roles on role update',
      );
    }
  } else if (!alreadyWarnedGuilds.has(member.guild.id)) {
    await warnGuild(
      member.guild,
      `## Warning\n${getWarningMessage(canAssign.errors, member.guild)}`,
    );
    alreadyWarnedGuilds.add(member.guild.id);
  }
}

function getWarningMessage(errors: CheckAssignableRolesErr[], guild: Guild): string {
  const response = [];

  if (errors.some((err) => err.type === 'global')) {
    response.push('### Global Permissions');
    response.push(
      'ActivityRank does not have **Assign Roles** permissions in this server. These permissions are required to make use of its functionality.',
    );
    response.push('');
  }
  if (errors.some((err) => err.type === 'localTooLow')) {
    invariant(guild.members.me);
    const ownRole = guild.members.me.roles.botRole;
    const ownHighestRole = guild.members.me.roles.highest;
    response.push('### Insufficient Permissions');
    response.push(
      `ActivityRank does not have a high enough role to manage some levelroles. Please ensure that ActivityRank's role (<@&${ownRole?.id}>) or another of its roles (for instance, its highest role, <@&${ownHighestRole.id}>) is above all level roles.`,
    );
    response.push('ActivityRank needs to be above the following roles:');
    response.push(
      ...errors.filter((err) => err.type === 'localTooLow').map((err) => `- <@&${err.roleId}>`),
    );
    response.push('');
  }
  if (errors.some((err) => err.type === 'localDangerous')) {
    const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
    const dangerous = formatter.format(DANGEROUS_PERMISSIONS_NAMES);
    response.push('### Dangerous Permissions');
    response.push(
      `As a safety measure, ActivityRank avoids assigning "dangerous" roles. Dangerous roles are those that have permissions that may cause harm to a server, such as ${dangerous}.`,
    );
    response.push('The following level roles have dangerous permissions:');
    response.push(
      ...errors.filter((err) => err.type === 'localDangerous').map((err) => `- <@&${err.roleId}>`),
    );
  }

  return response.join('\n');
}

export const DANGEROUS_PERMISSIONS_NAMES = [
  'Administrator',
  'Ban Members',
  'Kick Members',
  'Manage Server',
  'Manage Channels',
  'Manage Roles',
  'Manage Webhooks',
];

export const DANGEROUS_PERMISSIONS =
  PermissionFlagsBits.KickMembers |
  PermissionFlagsBits.BanMembers |
  PermissionFlagsBits.Administrator |
  PermissionFlagsBits.ManageRoles |
  PermissionFlagsBits.ManageGuild |
  PermissionFlagsBits.ManageChannels |
  PermissionFlagsBits.ManageWebhooks;

export async function getRoleAssignmentMessages(member: GuildMember, newRoles: string[]) {
  const roleMessages: (string | null)[] = [];
  const guildRoles = member.guild.roles.cache;

  const rolesToCreate = difference(new Set(newRoles), new Set(member.roles.cache.keys()));
  const rolesToDelete = difference(new Set(member.roles.cache.keys()), new Set(newRoles));

  for (const roleId of rolesToCreate) {
    const role = guildRoles.get(roleId);
    if (!role) {
      // This shouldn't occur, but if it does then something odd is going on with the caller of this function.
      // newRoles should be a list of role IDs that are in the guild, so `role` should always exist.
      throw new Error(
        `Role "${roleId}" was provided via \`newRoles\` and is not a role in the guild.`,
      );
    }
    roleMessages.push(await getRoleAssignMessage(member, role));
  }

  for (const roleId of rolesToDelete) {
    const role = guildRoles.get(roleId);
    invariant(
      role,
      "`roleId` is based on `member.roles.cache`, and all the roles of a member from a guild should exist in that guild's cache.",
    );
    roleMessages.push(await getRoleDeassignMessage(member, role));
  }

  return roleMessages.filter((i) => i !== null);
}

/**
 * Returns a list of the role IDs a member should have after levelling up to level `level`.
 *
 * **A permissions check should be done after running this with {@link checkRolesAreAssignable}.**
 *
 * By default, the returned value will be a list of the roles the member currently has.
 * If there are any changes that should be made, the returned list will reflect those changes.
 */
export async function getNewMemberRoles(member: GuildMember, level: number): Promise<string[]> {
  invariant(member.guild.members.me);

  const guildRoles = member.guild.roles.cache;
  const memberRoles = new Set(member.roles.cache.keys());

  if (guildRoles.size === 0) {
    return [];
  }

  const cachedGuild = await getGuildModel(member.guild);

  for (const role of guildRoles.values()) {
    const cachedRole = await getRoleModel(role);

    if (cachedRole.db.assignLevel === 0 && cachedRole.db.deassignLevel === 0) {
      // role is not part of the levelling system (can be ignored).
      continue;
    }

    const memberHasRole = memberRoles.has(role.id);

    if (cachedRole.db.deassignLevel !== 0 && level >= cachedRole.db.deassignLevel) {
      // User is above role. Should deassign.
      if (memberHasRole) {
        memberRoles.delete(role.id);
      }
    } else if (cachedRole.db.assignLevel !== 0 && level >= cachedRole.db.assignLevel) {
      // User is within role. Try to assign.
      if (!memberHasRole) {
        memberRoles.add(role.id);
      }
    } else if (
      cachedGuild.db.takeAwayAssignedRolesOnLevelDown &&
      cachedRole.db.assignLevel !== 0 &&
      level < cachedRole.db.assignLevel
    ) {
      // User is below role. Try to deassign.
      if (memberHasRole) {
        memberRoles.delete(role.id);
      }
    }
  }

  return [...memberRoles];
}

type CheckAssignableRolesResult = { ok: true } | { errors: CheckAssignableRolesErr[]; ok: false };
type CheckAssignableRolesErr =
  | { type: 'global'; description: string }
  | { type: 'localTooLow'; roleId: string; description: string }
  | { type: 'localDangerous'; roleId: string; description: string };

/**
 * Checks that the roles listed are assignable to the given member, if they are being updated at the listed level.
 *
 * This DOES NOT check all levelroles, just the ones that are going to be modified.
 *
 * If there are any invalid permissions (or other errors) found,
 * `errors` will be populated and `ok` will be set to false.
 */
async function checkRolesAreAssignable(
  member: GuildMember,
  level: number,
  roleIds: string[],
): Promise<CheckAssignableRolesResult> {
  invariant(member.guild.members.me);

  const guildRoles = member.guild.roles.cache;
  // const memberRoles = new Set(member.roles.cache.keys());

  const modifiedRoles = symmetricDifference(new Set(roleIds), new Set(member.roles.cache.keys()));

  const cachedGuild = await getGuildModel(member.guild);

  const errors: CheckAssignableRolesErr[] = [];

  if (!member.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    errors.push({
      type: 'global',
      description: 'The bot does not have Manage Roles permissions across the server.',
    });
  }

  for (const role of guildRoles.values()) {
    if (!modifiedRoles.has(role.id)) {
      // role is not being edited right now (can be ignored).
      continue;
    }

    const cachedRole = await getRoleModel(role);

    if (role.comparePositionTo(member.guild.members.me.roles.highest) > 0) {
      errors.push({
        type: 'localTooLow',
        roleId: role.id,
        description: 'The bot does not have a high enough role to manage this role.',
      });
      continue;
    }

    if (cachedRole.db.deassignLevel !== 0 && level >= cachedRole.db.deassignLevel) {
      // User is above role. Should deassign.
    } else if (cachedRole.db.assignLevel !== 0 && level >= cachedRole.db.assignLevel) {
      // User is within role. Try to assign.
      if (role.permissions.any(DANGEROUS_PERMISSIONS)) {
        member.client.logger.debug(
          {
            guild: role.guild.id,
            permissions: role.permissions,
            id: role.id,
            memberId: member.id,
            cachedRole,
          },
          'attempted to assign dangerous role',
        );
        errors.push({
          type: 'localDangerous',
          roleId: role.id,
          description: 'This role has dangerous permissions that the bot refuses to assign.',
        });
        continue;
      }
    } else if (
      cachedGuild.db.takeAwayAssignedRolesOnLevelDown &&
      cachedRole.db.assignLevel !== 0 &&
      level < cachedRole.db.assignLevel
    ) {
      // User is below role. Try to deassign.
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}

async function sendGratulationMessage(member: GuildMember, roleMessages: string[], level: number) {
  const messages = [];

  const cachedGuild = await getGuildModel(member.guild);
  const cachedMember = await getMemberModel(member);

  // `notifyLevelupWithRole`: when a role message is sent, also send the levelup
  // message (otherwise the role message overwrites the levelup message).
  if (
    cachedGuild.db.levelupMessage !== '' &&
    (cachedGuild.db.notifyLevelupWithRole || roleMessages.length === 0)
  ) {
    messages.push(cachedGuild.db.levelupMessage);
  }

  if (roleMessages.length > 0) {
    messages.push(...roleMessages);
  }

  if (messages.length === 0) {
    return;
  }

  let content = messages.join('\n');
  content = replaceTagsLevelup(content, member, level);

  const message = (isDMs = false): MessageCreateOptions => ({
    components: [
      {
        type: ComponentType.Container,
        accentColor: 0x01c3d9,
        components: [
          {
            type: ComponentType.Section,
            components: [
              {
                type: ComponentType.TextDisplay,
                content: `## ${nameUtil.getGuildMemberAlias(member, cachedGuild.db.showNicknames === 1)} ${emoji('level')}${level}`,
              },
            ],
            accessory: { type: ComponentType.Thumbnail, media: { url: member.displayAvatarURL() } },
          },
          { type: ComponentType.TextDisplay, content },
        ],
      },
      ...(isDMs
        ? [
            { type: ComponentType.Separator },
            {
              type: ComponentType.TextDisplay,
              content:
                '-# To disable direct messages from me, type `/config-member` in the server.',
            },
          ]
        : []),
    ],
    allowedMentions: { parse: ['users'], users: [member.id] },
    flags: [MessageFlags.IsComponentsV2],
  });

  function handleGratulationMessageError(_err: unknown) {
    const err = _err as DiscordAPIError;
    if (err.code === RESTJSONErrorCodes.MissingAccess) {
      member.client.logger.debug(
        `Missing access to send gratulationMessage in guild ${member.guild.id}`,
      );
    } else if (err.code === RESTJSONErrorCodes.MissingPermissions) {
      member.client.logger.debug(
        `Missing permissions to send gratulationMessage in guild ${member.guild.id}`,
      );
    } else if (err.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser) {
      member.client.logger.debug(
        `Cannot send gratulationMessage in guild ${member.guild.id} to user ${member.id}`,
      );
    } else {
      member.client.logger.warn(err, 'Error while sending gratulationMessage');
    }
  }

  // Active Channel
  let notified = false;
  if (!notified && cachedGuild.db.notifyLevelupCurrentChannel) {
    if (cachedMember.cache.lastMessageChannelId) {
      const channel = member.guild.channels.cache.get(cachedMember.cache.lastMessageChannelId);
      if (channel) {
        if (!channel.isTextBased()) {
          member.client.logger.warn(`lastMessageChannel ${channel.id} is not text-based`);
          return;
        }

        await channel
          .send(message())
          .then(() => {
            notified = true;
          })
          .catch(handleGratulationMessageError);
      }
    }
  }

  // Post_ Channel
  if (!notified && cachedGuild.db.autopost_levelup !== '0') {
    const channel = member.guild.channels.cache.get(cachedGuild.db.autopost_levelup);

    if (channel) {
      if (!channel.isTextBased()) {
        member.client.logger.warn(`autopost channel ${channel.id} is not text-based`);
        return;
      }

      await channel
        .send(message())
        .then(() => {
          notified = true;
        })
        .catch(handleGratulationMessageError);
    }
  }

  // Direct Message
  if (!notified && cachedMember.db.notifyLevelupDm && cachedGuild.db.notifyLevelupDm) {
    await member
      .send(message(true))
      .then(() => {
        notified = true;
      })
      .catch(handleGratulationMessageError);
  }
}

async function getRoleDeassignMessage(member: GuildMember, role: Role): Promise<string | null> {
  let message = null;

  const cachedRole = await getRoleModel(role);
  const cachedGuild = await getGuildModel(member.guild);

  if (cachedRole.db.deassignMessage !== '') message = cachedRole.db.deassignMessage;
  else if (cachedGuild.db.roleDeassignMessage !== '') message = cachedGuild.db.roleDeassignMessage;

  if (message) return replaceTagsRole(message, role);
  return null;
}

async function getRoleAssignMessage(member: GuildMember, role: Role): Promise<string | null> {
  let message = null;

  const cachedRole = await getRoleModel(role);
  const cachedGuild = await getGuildModel(member.guild);

  if (cachedRole.db.assignMessage !== '') message = cachedRole.db.assignMessage;
  else if (cachedGuild.db.roleAssignMessage !== '') message = cachedGuild.db.roleAssignMessage;

  if (message) return replaceTagsRole(message, role);
  return null;
}

function replaceTagsRole(text: string, role: Role) {
  return text
    .replace(/<rolename>/g, role.name)
    .replace(/<role>/g, role.name)
    .replace(/<rolemention>/g, role.toString());
}

function replaceTagsLevelup(text: string, member: GuildMember, level: number) {
  return text
    .replace(/<mention>/g, `<@${member.id}>`)
    .replace(/<name>/g, member.user.username)
    .replace(/<level>/g, level.toString())
    .replace(/<servername>/g, member.guild.name);
}
