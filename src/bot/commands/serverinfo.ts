import {
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
  type ActionRowData,
  type MessageActionRowComponentData,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';

import { getGuildModel, type GuildModel } from '../models/guild/guildModel.js';
import { stripIndent } from 'common-tags';
import guildChannelModel from '../models/guild/guildChannelModel.js';
import guildRoleModel from '../models/guild/guildRoleModel.js';
import fct from '../../util/fct.js';
import nameUtil from '../util/nameUtil.js';
import type { GuildRoleSchema } from 'models/types/shard.js';
import { command } from 'bot/util/registry/command.js';
import { component, ComponentKey } from 'bot/util/registry/component.js';
import { requireUserId } from 'bot/util/predicates.js';

export default command.basic({
  data: {
    name: 'serverinfo',
    description: 'Get information about your server.',
  },
  async execute({ interaction }) {
    const cachedGuild = await getGuildModel(interaction.guild);

    const page = fct.extractPageSimple(
      interaction.options.getInteger('page') ?? 1,
      cachedGuild.db.entriesPerPage,
    );

    const embed = await embeds.general({
      interaction,
      cachedGuild,
      from: page.from,
      to: page.to,
    });

    await interaction.reply({
      embeds: [embed],
      components: rows('general', 1, interaction.member.id),
    });
  },
});

type WindowFn = (args: {
  interaction:
    | ChatInputCommandInteraction<'cached'>
    | ButtonInteraction<'cached'>
    | StringSelectMenuInteraction<'cached'>;
  cachedGuild: GuildModel;
  from: number;
  to: number;
}) => Promise<EmbedBuilder>;

const windowSelect = component<{ window: string; page: number }>({
  type: ComponentType.StringSelect,
  async callback({ interaction, data }) {
    const cachedGuild = await getGuildModel(interaction.guild);
    const page = fct.extractPageSimple(data.page, cachedGuild.db.entriesPerPage);

    const embed = await embeds[interaction.values[0]]({
      interaction,
      cachedGuild,
      from: page.from,
      to: page.to,
    });

    await interaction.update({
      embeds: [embed],
      components: rows(interaction.values[0], data.page, interaction.user.id),
    });
  },
});

const pageButton = component<{ window: string; page: number }>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    const cachedGuild = await getGuildModel(interaction.guild);
    const page = fct.extractPageSimple(data.page, cachedGuild.db.entriesPerPage);

    const embed = await embeds[data.window]({
      interaction,
      cachedGuild,
      from: page.from,
      to: page.to,
    });

    await interaction.update({
      embeds: [embed],
      components: rows(data.window, data.page, interaction.user.id),
    });
  },
});

const closeButton = component({
  type: ComponentType.Button,
  async callback({ interaction, drop }) {
    await interaction.deferUpdate();
    await interaction.deleteReply();
    drop();
  },
});

const rows = (
  window: string,
  page: number,
  ownerId: string,
): ActionRowData<MessageActionRowComponentData>[] => {
  const paginationDisabled = ['general', 'messages'].includes(window);
  const predicate = requireUserId(ownerId);

  return [
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.StringSelect,
          customId: windowSelect.instanceId({ data: { window, page }, predicate }),
          options: [
            { label: 'General', value: 'general' },
            { label: 'Levels', value: 'levels' },
            { label: 'Roles', value: 'roles' },
            { label: 'No Command Channels', value: 'nocommandchannels' },
            { label: 'Noxp Channels', value: 'noxpchannels' },
            { label: 'Noxp Roles', value: 'noxproles' },
            { label: 'Autosend Messages', value: 'messages' },
          ],
        },
      ],
    },
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          customId: pageButton.instanceId({ data: { window, page: page - 1 }, predicate }),
          style: ButtonStyle.Primary,
          emoji: '⬅',
          disabled: paginationDisabled || page < 2,
        },
        {
          type: ComponentType.Button,
          customId: ComponentKey.Throw,
          style: ButtonStyle.Secondary,
          label: page.toString(),
          disabled: true,
        },
        {
          type: ComponentType.Button,
          customId: pageButton.instanceId({ data: { window, page: page + 1 }, predicate }),
          style: ButtonStyle.Primary,
          emoji: '➡️',
          disabled: paginationDisabled || page > 100,
        },
      ],
    },
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          customId: closeButton.instanceId({ predicate }),
          style: ButtonStyle.Danger,
          label: 'Close',
        },
      ],
    },
  ];
};

const info: WindowFn = async function ({ interaction, cachedGuild }) {
  const e = new EmbedBuilder()
    .setAuthor({ name: `Info for server ${interaction.guild.name}` })
    .setColor('#4fd6c8')
    .setThumbnail(interaction.guild.iconURL());

  const notifyLevelupType = cachedGuild.db.notifyLevelupDm
    ? 'DM'
    : cachedGuild.db.notifyLevelupCurrentChannel
      ? 'Current Channel'
      : cachedGuild.db.autopost_levelup
        ? '#' +
          nameUtil.getChannelName(interaction.guild.channels.cache, cachedGuild.db.autopost_levelup)
        : 'None';

  e.addFields({
    name: '**General**',
    value: stripIndent`
  Tracking since: <t:${cachedGuild.db.addDate}>
  Tracking stats: ${
    (cachedGuild.db.textXp ? ':writing_hand: ' : '') +
    (cachedGuild.db.voiceXp ? ':microphone2: ' : '') +
    (cachedGuild.db.inviteXp ? ':envelope: ' : '') +
    (cachedGuild.db.voteXp ? cachedGuild.db.voteEmote + ' ' : '') +
    (cachedGuild.db.bonusXp ? cachedGuild.db.bonusEmote + ' ' : '')
  }
  Notify levelup: ${notifyLevelupType}
  Include levelup message: ${cachedGuild.db.notifyLevelupWithRole ? 'Yes' : 'No'}
  Take away assigned roles on level down: ${cachedGuild.db.takeAwayAssignedRolesOnLevelDown ? 'Yes' : 'No'}
  List entries per page: ${cachedGuild.db.entriesPerPage}
  Status: ${(await fct.getPatreonTiers(interaction)).ownerTier == 3 ? 'Premium' : 'Not Premium'}`,
  });

  let bonusTimeString = '';
  if (parseInt(cachedGuild.db.bonusUntilDate) > Date.now() / 1000) {
    bonusTimeString = `**!! Bonus XP Active !!** (ends <t:${cachedGuild.db.bonusUntilDate}:R>)
    ${cachedGuild.db.bonusPerTextMessage * cachedGuild.db.xpPerBonus} Bonus XP per textmessage
    ${cachedGuild.db.bonusPerVoiceMinute * cachedGuild.db.xpPerBonus} Bonus XP per voiceminute
    ${cachedGuild.db.bonusPerVote * cachedGuild.db.xpPerBonus} Bonus XP for ${cachedGuild.db.voteTag}`;
  }

  let xpPerString = '';
  if (cachedGuild.db.textXp)
    xpPerString += `${cachedGuild.db.xpPerTextMessage} XP per textmessage\n`;
  if (cachedGuild.db.voiceXp)
    xpPerString += `${cachedGuild.db.xpPerVoiceMinute} XP per voiceminute\n`;
  if (cachedGuild.db.voteXp)
    xpPerString += `${cachedGuild.db.xpPerVote} XP per ${cachedGuild.db.voteTag}\n`;
  if (cachedGuild.db.inviteXp) xpPerString += `${cachedGuild.db.xpPerInvite} XP per invite\n`;

  const textmessageCooldownString = cachedGuild.db.textMessageCooldownSeconds
    ? `max every ${cachedGuild.db.textMessageCooldownSeconds} seconds`
    : ' without any cooldown';

  e.addFields({
    name: '**Points**',
    value: stripIndent`
    Vote Cooldown: A user has to wait ${Math.round(
      cachedGuild.db.voteCooldownSeconds / 60,
    )} minutes between each vote
    Text Message Cooldown: Messages give XP ${textmessageCooldownString}
    Muted voice XP allowed: ${cachedGuild.db.allowMutedXp ? 'Yes' : 'No'}
    Solo voice XP allowed: ${cachedGuild.db.allowSoloXp ? 'Yes' : 'No'}
    Deafened voice XP allowed: ${cachedGuild.db.allowDeafenedXp ? 'Yes' : 'No'}
    Levelfactor: ${cachedGuild.db.levelFactor} XP
    ${xpPerString} ${bonusTimeString}`,
  });

  return e;
};

const levels: WindowFn = async function ({ cachedGuild, from, to }) {
  const e = new EmbedBuilder()
    .setAuthor({ name: `Levels info from ${from + 1} to ${to + 1}` })
    .setColor('#4fd6c8')
    .setDescription(
      `XP needed to reach next level (total XP).\nLevelfactor: ${cachedGuild.db.levelFactor}.`,
    );

  let recordingLevels = [],
    localXp = 100,
    totalXp = 0;
  for (let iter = 2; iter < to + 2; iter++) {
    localXp = 100 + (iter - 1) * cachedGuild.db.levelFactor;
    totalXp += localXp;
    recordingLevels.push({ nr: iter, totalXp: totalXp, localXp: localXp });
  }

  recordingLevels = recordingLevels.slice(from - 1, to);

  for (const level of recordingLevels)
    e.addFields({
      name: `🎖${level.nr}`,
      value: `${level.localXp}(${level.totalXp})`,
      inline: true,
    });

  return e;
};

const roles: WindowFn = async function ({ interaction, from, to }) {
  const e = new EmbedBuilder()
    .setAuthor({ name: 'Roles info' })
    .setDescription("This server's activity roles and their respective levels.")
    .setColor('#4fd6c8');

  let roleAssignments = await guildRoleModel.storage.getRoleAssignments(interaction.guild);
  roleAssignments = roleAssignments.slice(from - 1, to);

  for (const myRole of roleAssignments)
    e.addFields({
      name: nameUtil.getRoleName(interaction.guild.roles.cache, myRole.roleId),
      value: getlevelString(myRole)!,
      inline: true,
    });

  if (roleAssignments.length == 0) e.setDescription('No roles to show here.');

  return e;
};

function getlevelString(myRole: GuildRoleSchema) {
  if (myRole.assignLevel != 0 && myRole.deassignLevel != 0)
    return 'From ' + myRole.assignLevel + ' to ' + myRole.deassignLevel;
  else if (myRole.assignLevel != 0) return 'From ' + myRole.assignLevel;
  else if (myRole.deassignLevel != 0) return 'Until ' + myRole.deassignLevel;
}

// TODO: deprecate noCommandChannels in favour of Discord's native Integrations
const noCommandChannels: WindowFn = async function ({ interaction, from, to }) {
  const cachedGuild = await getGuildModel(interaction.guild);

  let description = '';
  if (cachedGuild.db.commandOnlyChannel !== '0') {
    description +=
      ':warning: The commandOnly channel is set. The bot will respond only in channel ' +
      nameUtil.getChannelName(interaction.guild.channels.cache, cachedGuild.db.commandOnlyChannel) +
      '. \n \n';
  }

  description += 'NoCommand channels (does not affect users with manage server permission): \n';
  const e = new EmbedBuilder().setAuthor({ name: 'NoCommand channels info' }).setColor('#4fd6c8');

  let noCommandChannelIds = await guildChannelModel.getNoCommandChannelIds(interaction.guild);
  noCommandChannelIds = noCommandChannelIds.slice(from - 1, to);

  for (const channelId of noCommandChannelIds) {
    e.addFields({
      name: nameUtil.getChannelTypeIcon(interaction.guild.channels.cache, channelId),
      value: nameUtil.getChannelName(interaction.guild.channels.cache, channelId),
      inline: true,
    });
  }

  if (noCommandChannelIds.length == 0) description += 'No channels to show here.';

  e.setDescription(description);

  return e;
};

const noXpChannels: WindowFn = async function ({ interaction, from, to }) {
  const e = new EmbedBuilder()
    .setAuthor({ name: 'NoXP channels info' })
    .setColor('#4fd6c8')
    .setDescription('Activity in these channels will not give xp.');

  let noXpChannelIds = await guildChannelModel.getNoXpChannelIds(interaction.guild);
  noXpChannelIds = noXpChannelIds.slice(from - 1, to);

  for (const channelId of noXpChannelIds) {
    e.addFields({
      name: nameUtil.getChannelTypeIcon(interaction.guild.channels.cache, channelId),
      value: nameUtil.getChannelName(interaction.guild.channels.cache, channelId),
      inline: true,
    });
  }

  if (noXpChannelIds.length == 0) e.setDescription('No channels to show here.');

  return e;
};

const noXpRoles: WindowFn = async function ({ interaction, from, to }) {
  const e = new EmbedBuilder()
    .setAuthor({ name: 'NoXP roles info' })
    .setColor('#4fd6c8')
    .setDescription('Activity from users with these roles will not give xp.');

  let noXpRoleIds = await guildRoleModel.getNoXpRoleIds(interaction.guild);
  noXpRoleIds = noXpRoleIds.slice(from - 1, to);

  for (const roleId of noXpRoleIds)
    e.addFields({
      name: '⛔️',
      value: nameUtil.getRoleName(interaction.guild.roles.cache, roleId),
      inline: true,
    });

  if (noXpRoleIds.length == 0) e.setDescription('No roles to show here.');

  return e;
};

const messages: WindowFn = async function ({ interaction, cachedGuild, from, to }) {
  let entries = [];

  entries.push({ title: 'levelupMessage', desc: cachedGuild.db.levelupMessage });
  entries.push({ title: 'serverJoinMessage', desc: cachedGuild.db.serverJoinMessage });
  entries.push({ title: 'roleAssignMessage', desc: cachedGuild.db.roleAssignMessage });
  entries.push({
    title: 'roleDeassignMessage',
    desc: cachedGuild.db.roleDeassignMessage,
  });

  for (const role of interaction.guild.roles.cache.values()) {
    const cachedRole = await guildRoleModel.cache.get(role);

    if (cachedRole.db.assignMessage.trim() != '')
      entries.push({
        title: 'Assignment of ' + role.name,
        desc: cachedRole.db.assignMessage,
      });
    if (cachedRole.db.deassignMessage.trim() != '')
      entries.push({
        title: 'Deassignment of ' + role.name,
        desc: cachedRole.db.deassignMessage,
      });
  }

  const e = new EmbedBuilder()
    .setAuthor({ name: 'Messages info' })
    .setColor('#4fd6c8')
    .setDescription('Review the set messages and texts for the bot.');

  entries = entries.slice(from - 1, to);
  for (const entry of entries)
    e.addFields({
      name: entry.title,
      value: entry.desc != '' ? entry.desc : 'Not set.',
    });

  return e;
};

const embeds: Record<string, WindowFn> = {
  general: info,
  levels: levels,
  roles: roles,
  nocommandchannels: noCommandChannels,
  noxpchannels: noXpChannels,
  noxproles: noXpRoles,
  messages: messages,
};
