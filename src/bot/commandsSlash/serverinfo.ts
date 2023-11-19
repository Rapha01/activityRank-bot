import {
  ButtonStyle,
  SlashCommandBuilder,
  EmbedBuilder,
  ComponentType,
  type Interaction,
  type ActionRowData,
  type MessageActionRowComponentData,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';

import guildModel from '../models/guild/guildModel.js';
import { stripIndent } from 'common-tags';
import guildChannelModel from '../models/guild/guildChannelModel.js';
import guildRoleModel from '../models/guild/guildRoleModel.js';
import fct from '../../util/fct.js';
import nameUtil from '../util/nameUtil.js';
import { ComponentKey, registerComponent, registerSlashCommand } from 'bot/util/commandLoader.js';
import type { GuildSchema, GuildRoleSchema } from 'models/types/shard.js';

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Information about your server!'),
  execute: async function (interaction) {
    const myGuild = await guildModel.storage.get(interaction.guild);
    const page = fct.extractPageSimple(
      interaction.options.getInteger('page') ?? 1,
      myGuild!.entriesPerPage,
    );

    const embed = await embeds['general']({
      interaction,
      myGuild: myGuild!,
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
  myGuild: GuildSchema;
  from: number;
  to: number;
}) => Promise<EmbedBuilder>;

const setWindow = registerComponent<{ window: string; page: number }>({
  identifier: 'serverinfo.window',
  type: ComponentType.StringSelect,
  async callback(interaction, data) {
    const myGuild = await guildModel.storage.get(interaction.guild);
    const page = fct.extractPageSimple(data.page, myGuild!.entriesPerPage);

    const embed = await embeds[interaction.values[0]]({
      interaction,
      myGuild: myGuild!,
      from: page.from,
      to: page.to,
    });

    await interaction.update({
      embeds: [embed],
      components: rows(interaction.values[0], data.page, interaction.user.id),
    });
  },
});

const setPage = registerComponent<{ window: string; page: number }>({
  identifier: 'serverinfo.page',
  type: ComponentType.Button,
  async callback(interaction, data) {
    const myGuild = await guildModel.storage.get(interaction.guild);
    const page = fct.extractPageSimple(data.page, myGuild!.entriesPerPage);

    const embed = await embeds[data.window]({
      interaction,
      myGuild: myGuild!,
      from: page.from,
      to: page.to,
    });

    await interaction.update({
      embeds: [embed],
      components: rows(data.window, data.page, interaction.user.id),
    });
  },
});

const closeMsg = registerComponent({
  identifier: 'serverinfo.close',
  type: ComponentType.Button,
  async callback(interaction) {
    await interaction.deferUpdate();
    await interaction.deleteReply();
  },
});

const rows = (
  window: string,
  page: number,
  ownerId: string,
): ActionRowData<MessageActionRowComponentData>[] => {
  const paginationDisabled = ['general', 'messages'].includes(window);
  return [
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.StringSelect,
          customId: setWindow({ window, page }, { ownerId }),
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
          customId: setPage({ window, page: page - 1 }, { ownerId }),
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
          customId: setPage({ window, page: page + 1 }, { ownerId }),
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
          customId: closeMsg(null, { ownerId }),
          style: ButtonStyle.Danger,
          label: 'Close',
        },
      ],
    },
  ];
};

const info: WindowFn = async ({ interaction, myGuild }) => {
  const e = new EmbedBuilder()
    .setAuthor({ name: `Info for server ${interaction.guild.name}` })
    .setColor('#4fd6c8')
    .setThumbnail(interaction.guild.iconURL());

  const notifyLevelupType = myGuild.notifyLevelupDm
    ? 'DM'
    : myGuild.notifyLevelupCurrentChannel
    ? 'Current Channel'
    : myGuild.autopost_levelup
    ? '#' + nameUtil.getChannelName(interaction.guild.channels.cache, myGuild.autopost_levelup)
    : 'None';

  e.addFields({
    name: '**General**',
    value: stripIndent`
  Tracking since: <t:${myGuild.addDate}>
  Tracking stats: ${
    (myGuild.textXp ? ':writing_hand: ' : '') +
    (myGuild.voiceXp ? ':microphone2: ' : '') +
    (myGuild.inviteXp ? ':envelope: ' : '') +
    (myGuild.voteXp ? myGuild.voteEmote + ' ' : '') +
    (myGuild.bonusXp ? myGuild.bonusEmote + ' ' : '')
  }
  Notify levelup: ${notifyLevelupType}
  Include levelup message: ${myGuild.notifyLevelupWithRole ? 'Yes' : 'No'}
  Take away assigned roles on level down: ${myGuild.takeAwayAssignedRolesOnLevelDown ? 'Yes' : 'No'}
  List entries per page: ${myGuild.entriesPerPage}
  Status: ${(await fct.getPatreonTiers(interaction)).ownerTier == 3 ? 'Premium' : 'Not Premium'}`,
  });

  let bonusTimeString = '';
  if (myGuild.bonusUntilDate > Date.now() / 1000) {
    bonusTimeString = `**!! Bonus XP Active !!** (ends <t:${myGuild.bonusUntilDate}:R>)
    ${myGuild.bonusPerTextMessage * myGuild.xpPerBonus} Bonus XP per textmessage
    ${myGuild.bonusPerVoiceMinute * myGuild.xpPerBonus} Bonus XP per voiceminute
    ${myGuild.bonusPerVote * myGuild.xpPerBonus} Bonus XP for ${myGuild.voteTag}`;
  }

  let xpPerString = '';
  if (myGuild.textXp) xpPerString += `${myGuild.xpPerTextMessage} XP per textmessage\n`;
  if (myGuild.voiceXp) xpPerString += `${myGuild.xpPerVoiceMinute} XP per voiceminute\n`;
  if (myGuild.voteXp) xpPerString += `${myGuild.xpPerVote} XP per ${myGuild.voteTag}\n`;
  if (myGuild.inviteXp) xpPerString += `${myGuild.xpPerInvite} XP per invite\n`;

  const textmessageCooldownString = myGuild.textMessageCooldownSeconds
    ? `max every ${myGuild.textMessageCooldownSeconds} seconds`
    : ' without any cooldown';

  e.addFields({
    name: '**Points**',
    value: stripIndent`
    Vote Cooldown: A user has to wait ${Math.round(
      myGuild.voteCooldownSeconds / 60,
    )} minutes between each vote
    Text Message Cooldown: Messages give XP ${textmessageCooldownString}
    Muted voice XP allowed: ${myGuild.allowMutedXp ? 'Yes' : 'No'}
    Solo voice XP allowed: ${myGuild.allowSoloXp ? 'Yes' : 'No'}
    Deafened voice XP allowed: ${myGuild.allowDeafenedXp ? 'Yes' : 'No'}
    Levelfactor: ${myGuild.levelFactor} XP
    ${xpPerString} ${bonusTimeString}`,
  });

  return e;
};

const levels: WindowFn = async ({ interaction, myGuild, from, to }) => {
  const e = new EmbedBuilder()
    .setAuthor({ name: `Levels info from ${from + 1} to ${to + 1}` })
    .setColor('#4fd6c8')
    .setDescription(
      `XP needed to reach next level (total XP).\nLevelfactor: ${myGuild.levelFactor}.`,
    );

  let recordingLevels = [],
    localXp = 100,
    totalXp = 0;
  for (let iter = 2; iter < to + 2; iter++) {
    localXp = 100 + (iter - 1) * myGuild.levelFactor;
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

const roles: WindowFn = async ({ interaction, from, to }) => {
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
const noCommandChannels: WindowFn = async ({ interaction, from, to }) => {
  const cachedGuild = await guildModel.cache.get(interaction.guild);

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

const noXpChannels: WindowFn = async ({ interaction, from, to }) => {
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

const noXpRoles: WindowFn = async ({ interaction, from, to }) => {
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

const messages: WindowFn = async ({ interaction, myGuild, from, to }) => {
  let entries = [];

  entries.push({ title: 'levelupMessage', desc: myGuild.levelupMessage });
  entries.push({ title: 'serverJoinMessage', desc: myGuild.serverJoinMessage });
  entries.push({ title: 'roleAssignMessage', desc: myGuild.roleAssignMessage });
  entries.push({
    title: 'roleDeassignMessage',
    desc: myGuild.roleDeassignMessage,
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
