import Cron from 'croner';
import {
  type ActionRowData,
  type APIEmbed,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type Client,
  ComponentType,
  type MessageActionRowComponentData,
  type StringSelectMenuInteraction,
  time,
} from 'discord.js';
import invariant from 'tiny-invariant';
import { command } from '#bot/commands.ts';
import { actionrow, closeButton } from '#bot/util/component.ts';
import { requireUser } from '#bot/util/predicates.ts';
import { ComponentKey, component } from '#bot/util/registry/component.ts';
import { emoji } from '#const/config.ts';
import { shards } from '#models/shardDb/shardDb.ts';
import fct, { getPatreonTiers, hasValidEntitlement, type Pagination } from '../../util/fct.ts';
import guildChannelModel from '../models/guild/guildChannelModel.ts';
import { type GuildModel, getGuildModel } from '../models/guild/guildModel.ts';
import {
  fetchNoXpRoleIds,
  fetchRoleAssignments,
  getRoleModel,
} from '../models/guild/guildRoleModel.ts';
import nameUtil, { getRoleMention } from '../util/nameUtil.ts';

export default command({
  name: 'serverinfo',
  async execute({ interaction }) {
    await render(interaction, 1, 'general');
  },
});

type WindowName = keyof typeof windows;

async function render(
  interaction:
    | ChatInputCommandInteraction<'cached'>
    | ButtonInteraction<'cached'>
    | StringSelectMenuInteraction<'cached'>,
  pageNumber: number,
  windowName: WindowName,
  disableComponents = false,
) {
  const window = windows[windowName];
  const cachedGuild = await getGuildModel(interaction.guild);
  const page = fct.extractPageSimple(pageNumber, cachedGuild.db.entriesPerPage);
  const predicate = requireUser(interaction.user);

  const components = [
    actionrow([
      {
        type: ComponentType.StringSelect,
        customId: windowSelect.instanceId({ data: { page: pageNumber }, predicate }),
        placeholder: 'Select a page',
        options: [
          { label: 'General', value: 'general', default: windowName === 'general' },
          { label: 'Levels', value: 'levels', default: windowName === 'levels' },
          { label: 'Roles', value: 'roles', default: windowName === 'roles' },
          { label: 'XP Settings', value: 'xpsettings', default: windowName === 'xpsettings' },
          {
            label: 'No-Xp Channels',
            value: 'noxpchannels',
            default: windowName === 'noxpchannels',
          },
          { label: 'No-Xp Roles', value: 'noxproles', default: windowName === 'noxproles' },
          { label: 'Autosend Messages', value: 'messages', default: windowName === 'messages' },
        ] satisfies { label: string; value: WindowName; default: boolean }[],
      },
    ]),
  ];

  if (window.enablePagination) {
    components.push(
      actionrow([
        {
          type: ComponentType.Button,
          customId: pageButton.instanceId({
            data: { windowName, page: pageNumber - 1 },
            predicate,
          }),
          style: ButtonStyle.Primary,
          emoji: { name: '⬅' },
          disabled: disableComponents || pageNumber < 2,
        },
        {
          type: ComponentType.Button,
          customId: ComponentKey.Throw,
          style: ButtonStyle.Secondary,
          label: page.page.toString(),
          disabled: true,
        },
        {
          type: ComponentType.Button,
          customId: pageButton.instanceId({
            data: { windowName, page: pageNumber + 1 },
            predicate,
          }),
          style: ButtonStyle.Primary,
          emoji: { name: '➡️' },
          disabled: disableComponents || pageNumber > 100,
        },
      ]),
    );
  }

  const additionalComponents = window.additionalComponents();

  if (additionalComponents) components.push(...additionalComponents);

  components.push(
    actionrow([
      {
        type: ComponentType.Button,
        customId: closeButton.instanceId({ predicate }),
        style: ButtonStyle.Danger,
        label: 'Close',
      },
    ]),
  );

  const content = {
    embeds: [await window.embed({ interaction, cachedGuild, page })],
    components,
  };

  if (interaction.isChatInputCommand()) {
    await interaction.reply(content);
  } else {
    if (interaction.replied) {
      await interaction.editReply(content);
    } else {
      await interaction.update(content);
    }
  }
}

const windowSelect = component<{ page: number }>({
  type: ComponentType.StringSelect,
  async callback({ interaction, data }) {
    // typechecked when constructed
    const windowName = interaction.values[0] as WindowName;

    await render(interaction, data.page, windowName);
  },
});

const pageButton = component<{ windowName: WindowName; page: number }>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    await render(interaction, data.page, data.windowName);
  },
});

type WindowInteraction =
  | ChatInputCommandInteraction<'cached'>
  | ButtonInteraction<'cached'>
  | StringSelectMenuInteraction<'cached'>;

interface Window {
  embed: (opts: {
    interaction: WindowInteraction;
    cachedGuild: GuildModel;
    page: Pagination;
  }) => Promise<APIEmbed>;
  additionalComponents: () => ActionRowData<MessageActionRowComponentData>[];
  enablePagination: boolean;
}

const clientURL = (client: Client): string => {
  const user = client.user;
  invariant(user, 'client.user will always exist when the bot is logged in properly');
  const avatar = user.avatarURL();
  return avatar as string;
};

const general: Window = {
  additionalComponents: () => [],
  enablePagination: false,
  async embed({ interaction, cachedGuild }) {
    let notifyLevelupType: string;

    if (cachedGuild.db.notifyLevelupDm) {
      notifyLevelupType = 'DM';
    } else if (cachedGuild.db.notifyLevelupCurrentChannel) {
      notifyLevelupType = 'Current Channel';
    } else if (cachedGuild.db.autopost_levelup !== '0') {
      const channelName = nameUtil.getChannelName(
        interaction.guild.channels.cache,
        cachedGuild.db.autopost_levelup,
      );
      notifyLevelupType = `#${channelName}`;
    } else {
      notifyLevelupType = emoji('no');
    }

    const yesno = (cond: boolean | number): string => (cond ? emoji('yes') : emoji('no'));

    const premiumStatus = await displayPremiumStatus(interaction);

    const generalValue = [
      `Tracking since: <t:${cachedGuild.db.addDate}:D>`,
      `Tracking stats: ${
        (cachedGuild.db.textXp ? `${emoji('message')} ` : '') +
        (cachedGuild.db.voiceXp ? `${emoji('voice')} ` : '') +
        (cachedGuild.db.inviteXp ? `${emoji('invite')} ` : '') +
        (cachedGuild.db.voteXp ? `${cachedGuild.db.voteEmote} ` : '') +
        (cachedGuild.db.bonusXp ? `${cachedGuild.db.bonusEmote} ` : '')
      }`,
      `Notify levelup: ${notifyLevelupType}`,
      `Include levelup message: ${yesno(cachedGuild.db.notifyLevelupWithRole)}`,
      `Take away assigned roles on level down: ${yesno(cachedGuild.db.takeAwayAssignedRolesOnLevelDown)}`,
      `List entries per page: ${cachedGuild.db.entriesPerPage}`,
      `Premium: ${premiumStatus}`,
    ].join('\n');

    const textmessageCooldownString = cachedGuild.db.textMessageCooldownSeconds
      ? `max every ${cachedGuild.db.textMessageCooldownSeconds} seconds`
      : ' without any cooldown';

    let bonusTimeString = '';
    if (Number.parseInt(cachedGuild.db.bonusUntilDate) > Date.now() / 1000) {
      bonusTimeString = `\n\n**!! Bonus XP Active !!** (ends <t:${cachedGuild.db.bonusUntilDate}:R>)
    ${cachedGuild.db.bonusPerTextMessage * cachedGuild.db.xpPerBonus} Bonus XP per textmessage
    ${cachedGuild.db.bonusPerVoiceMinute * cachedGuild.db.xpPerBonus} Bonus XP per voiceminute
    ${cachedGuild.db.bonusPerVote * cachedGuild.db.xpPerBonus} Bonus XP for ${cachedGuild.db.voteTag}`;
    }

    const pointsValue = [
      `Vote Cooldown: A user has to wait ${Math.round(cachedGuild.db.voteCooldownSeconds / 60)} minutes between each vote`,
      `Text Message Cooldown: Messages give XP ${textmessageCooldownString}`,
      `Voice XP granted when muted: ${yesno(cachedGuild.db.allowMutedXp)}`,
      `Voice XP granted when deafened: ${yesno(cachedGuild.db.allowDeafenedXp)}`,
      `Voice XP granted when alone: ${yesno(cachedGuild.db.allowSoloXp)}`,
      bonusTimeString,
    ].join('\n');

    const resetsValue = (
      [
        ['daily', new Cron('0 0 * * *').nextRun()],
        ['weekly', new Cron('30 0 * * SUN').nextRun()],
        ['monthly', new Cron('0 1 1 * *').nextRun()],
        ['yearly', new Cron('30 1 1 1 *').nextRun()],
      ] as const
    )
      .map(([label, date]) => `Next ${label} reset: ${time(date as Date, 'R')}`)
      .join('\n');

    const guildIcon = interaction.guild.iconURL();

    return {
      author: {
        name: `Info for ${interaction.guild.name}`,
        icon_url: clientURL(interaction.client),
      },
      color: 0x01c3d9,
      thumbnail: guildIcon ? { url: guildIcon } : undefined,
      fields: [
        { name: '**General**', value: generalValue },
        { name: '**Points**', value: pointsValue },
        { name: '**Resets**', value: resetsValue },
      ],
    };
  },
};

async function displayPremiumStatus(interaction: WindowInteraction): Promise<string> {
  if (hasValidEntitlement(interaction)) {
    return emoji('store');
  }

  const patreon = await getPatreonTiers(interaction);
  if (patreon.ownerTier >= 2) {
    return emoji('yes');
  } else {
    return emoji('no');
  }
}

const levels: Window = {
  additionalComponents: () => [],
  enablePagination: true,
  async embed({ interaction, cachedGuild, page }) {
    let levels = [{ number: 1, totalXp: 0, localXp: 0 }];
    let totalXp = 0;

    for (let i = 2; i < page.to + 2; i++) {
      const localXp = 100 + (i - 1) * cachedGuild.db.levelFactor;
      totalXp += localXp;
      levels.push({ number: i, totalXp, localXp });
    }

    levels = levels.slice(page.from - 1, page.to);

    const roleAssignments = await fetchRoleAssignments(interaction.guild);

    function levelValue(header: string, level: number): string {
      return [
        header,
        // TODO(style): consider replacing `-` and `+` with emojis
        roleAssignments
          .filter((r) => r.deassignLevel === level)
          .map((r) => `**-** <@&${r.roleId}>`),
        roleAssignments.filter((r) => r.assignLevel === level).map((r) => `**+** <@&${r.roleId}>`),
      ]
        .flat()
        .join('\n');
    }

    return {
      author: {
        name: `Levels from ${page.from + 1} to ${page.to + 1}`,
        icon_url: clientURL(interaction.client),
      },
      color: 0x01c3d9,
      description: `Levelfactor: ${cachedGuild.db.levelFactor}\n-# The levelfactor is the amount of extra XP each level needs.\n*XP needed to reach the next level (xp needed to reach this level from Level 1)*`,
      fields: levels.map((level) => ({
        name: `${emoji('level')}${level.number}`,
        value: levelValue(
          level.number < 2
            ? '*All members start at Level 1.*'
            : `**${level.localXp}** (${level.totalXp})`,
          level.number,
        ),
        inline: true,
      })),
    };
  },
};

const roles: Window = {
  additionalComponents: () => [],
  enablePagination: true,
  async embed({ interaction, page }) {
    const roleAssignments = await fetchRoleAssignments(interaction.guild);

    // unique array of all levels where a role is either assigned or deassigned - except for "level 0"
    // (which doesn't exist and shouldn't be included, becuase it contains all the default deassigns)
    const relevantLevels = [
      ...new Set(
        roleAssignments
          .flatMap((a) => [a.assignLevel, a.deassignLevel])
          .filter((level) => level !== 0),
      ),
    ].sort((a, b) => a - b);

    return {
      author: { name: 'Activity Roles', icon_url: clientURL(interaction.client) },
      color: 0x01c3d9,
      description: relevantLevels.length > 0 ? undefined : '-# No roles have been configured yet.',
      fields: relevantLevels
        .map((level) => ({
          name: `Level ${level}`,
          value: [
            roleAssignments
              .filter((r) => r.deassignLevel === level)
              .map((r) => `**-** ${getRoleMention(interaction.guild.roles.cache, r.roleId)}`),
            roleAssignments
              .filter((r) => r.assignLevel === level)
              .map((r) => `**+** ${getRoleMention(interaction.guild.roles.cache, r.roleId)}`),
          ]
            .flat()
            .join('\n'),
          inline: true,
        }))
        .slice(page.from - 1, page.to),
    };
  },
};

const noxpchannels: Window = {
  additionalComponents: () => [],
  enablePagination: true,
  async embed({ interaction, page }) {
    const description = ['-# Activity in these channels will not give XP.\n'];

    const noXpChannelIds = await guildChannelModel.getNoXpChannelIds(interaction.guild);

    if (noXpChannelIds.length < 1) {
      description.push('-# This server does not have any No-XP channels.');
    }

    const noXpChannels = noXpChannelIds.map((id) => ({
      id,
      channel: interaction.guild.channels.cache.get(id),
    }));

    description.push(
      ...noXpChannels
        .sort((a, b) => (a.channel ? (b.channel ? a.channel.type - b.channel.type : 0) : -1))
        .slice(page.from - 1, page.to)
        .map(
          (channel) =>
            `- ${nameUtil.getChannelMention(interaction.guild.channels.cache, channel.id)}`,
        ),
    );

    if (noXpChannelIds.length > page.to)
      description.push(`- *and ${noXpChannelIds.length - page.to} more...*`);

    return {
      author: {
        name: 'No-XP Channels',
        icon_url: clientURL(interaction.client),
      },
      color: 0x01c3d9,
      description: description.join('\n'),
    };
  },
};

const noxproles: Window = {
  additionalComponents: () => [],
  enablePagination: true,
  async embed({ interaction, page }) {
    const description = [
      '-# Activity from a user with any of these roles will not give them XP.\n',
    ];

    const noXpRoleIds = await fetchNoXpRoleIds(interaction.guild);

    if (noXpRoleIds.length < 1) {
      description.push('-# This server does not have any No-XP roles.');
    }

    description.push(
      ...noXpRoleIds
        .slice(page.from - 1, page.to)
        .map((roleId) => `- ${nameUtil.getRoleMention(interaction.guild.roles.cache, roleId)}`),
    );

    if (noXpRoleIds.length > page.to)
      description.push(`- *and ${noXpRoleIds.length - page.to} more...*`);

    return {
      author: {
        name: 'No-XP Roles',
        icon_url: clientURL(interaction.client),
      },
      color: 0x01c3d9,
      description: description.join('\n'),
    };
  },
};

const xpsettings: Window = {
  additionalComponents: () => [],
  enablePagination: true,
  async embed({ interaction, cachedGuild, page }) {
    const xpPerString = [
      cachedGuild.db.textXp && `${cachedGuild.db.xpPerTextMessage} XP per textmessage`,
      cachedGuild.db.voiceXp && `${cachedGuild.db.xpPerVoiceMinute} XP per voiceminute`,
      cachedGuild.db.voteXp && `${cachedGuild.db.xpPerVote} XP per ${cachedGuild.db.voteTag}`,
      cachedGuild.db.inviteXp && `${cachedGuild.db.xpPerInvite} XP per invite`,
    ]
      .filter((x) => x !== 0)
      .join('\n');

    const relevantRoles = await shards
      .get(cachedGuild.dbHost)
      .db.selectFrom('guildRole')
      .select(['roleId', 'xpPerTextMessage', 'xpPerVoiceMinute', 'xpPerInvite', 'xpPerVote'])
      .where('guildId', '=', interaction.guild.id)
      .where((w) =>
        w.or([
          w('xpPerTextMessage', '!=', 0),
          w('xpPerVoiceMinute', '!=', 0),
          w('xpPerInvite', '!=', 0),
          w('xpPerVote', '!=', 0),
        ]),
      )
      .execute();

    const relativeValue = (
      role: (typeof relevantRoles)[number],
      key: Exclude<keyof (typeof relevantRoles)[number], 'roleId'>,
    ): number => {
      const ratio = role[key] / cachedGuild.db[key];
      return Math.round(100 * ratio) / 100;
    };

    const roleEntries = relevantRoles
      .map((r) =>
        [
          `**${getRoleMention(interaction.guild.roles.cache, r.roleId)}**`,
          r.xpPerTextMessage > 0 &&
            `${r.xpPerTextMessage} XP per textmessage (**${relativeValue(r, 'xpPerTextMessage')}x** the default)`,
          r.xpPerVoiceMinute > 0 &&
            `${r.xpPerVoiceMinute} XP per voiceminute (**${relativeValue(r, 'xpPerVoiceMinute')}x** the default)`,
          r.xpPerVote > 0 &&
            `${r.xpPerVote} XP per ${cachedGuild.db.voteTag} (**${relativeValue(r, 'xpPerVote')}x** the default)`,
          r.xpPerInvite > 0 &&
            `${r.xpPerInvite} XP per invite (**${relativeValue(r, 'xpPerInvite')}x** the default)`,
        ]
          .filter((x) => x !== false)
          .join('\n'),
      )
      .slice(page.from - 1, page.to)
      .join('\n');

    return {
      author: { name: 'XP Settings', icon_url: clientURL(interaction.client) },
      color: 0x01c3d9,
      description: `**Default XP**\nLevelfactor: ${cachedGuild.db.levelFactor} XP\n${xpPerString}\n\n${roleEntries}`,
    };
  },
};

const messages: Window = {
  additionalComponents: () => [],
  enablePagination: true,
  async embed({ interaction, cachedGuild, page }) {
    const entries = [];

    entries.push({ name: 'Levelup', value: cachedGuild.db.levelupMessage });
    entries.push({ name: 'Server Join', value: cachedGuild.db.serverJoinMessage });
    entries.push({ name: 'Role Assign', value: cachedGuild.db.roleAssignMessage });
    entries.push({ name: 'Role Deassign', value: cachedGuild.db.roleDeassignMessage });

    for (const role of interaction.guild.roles.cache.values()) {
      // TODO: bulk fetch
      const cachedRole = await getRoleModel(role);

      if (cachedRole.db.assignMessage.trim() !== '')
        entries.push({ name: `Assignment of ${role.name}`, value: cachedRole.db.assignMessage });
      if (cachedRole.db.deassignMessage.trim() !== '')
        entries.push({
          name: `Deassignment of ${role.name}`,
          value: cachedRole.db.deassignMessage,
        });
    }

    return {
      author: { name: 'Autosend Messages', icon_url: clientURL(interaction.client) },
      color: 0x01c3d9,
      fields: entries.slice(page.from - 1, page.to),
    };
  },
};

const windows = {
  general,
  levels,
  roles,
  noxpchannels,
  noxproles,
  messages,
  xpsettings,
} as const satisfies { [k: string]: Window };
