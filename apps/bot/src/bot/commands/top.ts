import { Time } from '@sapphire/duration';
import {
  type ActionRowData,
  type APIEmbed,
  ButtonStyle,
  ChannelType,
  type ChatInputCommandInteraction,
  ComponentType,
  type DiscordAPIError,
  type Guild,
  type GuildChannel,
  type InteractionEditReplyOptions,
  type MessageActionRowComponentData,
  type MessageComponentInteraction,
  RESTJSONErrorCodes,
  time,
} from 'discord.js';
import { command } from '#bot/commands.js';
import {
  getChannelMemberRanks,
  getChannelRanks,
  getGuildMemberRanks,
} from '#bot/models/rankModel.js';
import { actionrow } from '#bot/util/component.js';
import { requireUser } from '#bot/util/predicates.js';
import {
  ComponentKey,
  type ComponentPredicateConfig,
  component,
} from '#bot/util/registry/component.js';
import { assertUnreachable } from '#bot/util/typescript.js';
import { emoji } from '#const/config.js';
import { type StatTimeInterval, type StatType, statTimeIntervals } from '#models/types/enums.js';
import fct, { type Pagination } from '../../util/fct.js';
import { type GuildModel, getGuildModel } from '../models/guild/guildModel.js';
import { handleStatCommandsCooldown } from '../util/cooldownUtil.js';
import { getChannelMention, getGuildMemberNamesWithRanks } from '../util/nameUtil.js';

const _prettifyTime = {
  day: 'Today',
  week: 'This week',
  month: 'This month',
  year: 'This year',
  alltime: 'Forever',
};

export const activeCache = new Map<string, CacheInstance>();

type Window = 'members' | 'channelMembers' | 'channels';
type OrderType =
  | 'allScores'
  | 'totalScore'
  | 'textMessage'
  | 'voiceMinute'
  | 'invite'
  | 'vote'
  | 'bonus';

interface CacheInstance {
  window: Window;
  time: StatTimeInterval;
  page: number;
  orderType: OrderType;
  interaction: ChatInputCommandInteraction<'cached'>;
  channel?: GuildChannel;
  componentPredicate: ComponentPredicateConfig;
}

export default command({
  name: 'top',
  async execute({ interaction, t }) {
    await interaction.deferReply();

    const cachedGuild = await getGuildModel(interaction.guild);

    if ((await handleStatCommandsCooldown(t, interaction)).denied) return;

    const initialState: CacheInstance = {
      window: 'members',
      time: 'alltime',
      componentPredicate: requireUser(interaction.user),
      page: 1,
      orderType: 'allScores',
      interaction,
    };

    const { id } = await interaction.editReply(
      await generate(initialState, interaction.guild, cachedGuild),
    );

    const cleanCache = async () => {
      const state = activeCache.get(id);
      activeCache.delete(id);

      if (!state) return;

      if (!interaction.guild) {
        interaction.client.logger.debug({ interaction }, '/top tried to update uncached guild');
        return;
      }

      try {
        await interaction.editReply(await generate(state, interaction.guild, cachedGuild, true));
      } catch (_err) {
        const err = _err as DiscordAPIError;
        if (err.code === RESTJSONErrorCodes.UnknownMessage) {
          interaction.client.logger.debug({ interaction }, '/top tried to update unknown message');
        } else {
          throw err;
        }
      }
    };
    setTimeout(cleanCache, 5 * Time.Minute);

    activeCache.set(id, initialState);
  },
});

const windowSelect = component({
  type: ComponentType.StringSelect,
  autoDestroy: true,
  async callback({ interaction }) {
    await execCacheSet(interaction, 'window', interaction.values[0] as Window);
  },
});

const timeSelect = component({
  type: ComponentType.StringSelect,
  autoDestroy: true,
  async callback({ interaction }) {
    await execCacheSet(interaction, 'time', interaction.values[0] as StatTimeInterval);
  },
});

const orderSelect = component({
  type: ComponentType.StringSelect,
  autoDestroy: true,
  async callback({ interaction }) {
    await execCacheSet(interaction, 'orderType', interaction.values[0] as OrderType);
  },
});

const channelSelect = component({
  type: ComponentType.ChannelSelect,
  autoDestroy: true,
  async callback({ interaction }) {
    await execCacheSet(interaction, 'channel', interaction.channels.first() as GuildChannel);
  },
});

const pageButton = component<{ page: number }>({
  type: ComponentType.Button,
  autoDestroy: true,
  async callback({ interaction, data: { page } }) {
    await execCacheSet(interaction, 'page', page);
  },
});

async function execCacheSet<T extends keyof CacheInstance>(
  interaction: MessageComponentInteraction<'cached'>,
  key: T,
  value: CacheInstance[T],
) {
  const cachedMessage = activeCache.get(interaction.message.id);
  if (!cachedMessage) {
    interaction.client.logger.debug(
      { interaction, id: interaction.message.id },
      'Could not find cachedMessage',
    );
    return;
  }

  const cachedGuild = await getGuildModel(interaction.guild);

  activeCache.set(interaction.message.id, { ...cachedMessage, [key]: value });

  await interaction.deferUpdate();

  const state = activeCache.get(interaction.message.id);
  if (state) {
    await state.interaction.editReply(await generate(state, interaction.guild, cachedGuild));
  }
}

async function generate(
  state: CacheInstance,
  guild: Guild,
  cachedGuild: GuildModel,
  disabled = false,
): Promise<InteractionEditReplyOptions> {
  if (state.window === 'channelMembers')
    return await generateChannelMembers(state, guild, cachedGuild, disabled);
  if (state.window === 'members')
    return await generateGuildMembers(state, guild, cachedGuild, disabled);
  if (state.window === 'channels')
    return await generateChannels(state, guild, cachedGuild, disabled);
  assertUnreachable(state.window);
}

async function generateChannels(
  state: CacheInstance,
  guild: Guild,
  cachedGuild: GuildModel,
  disabled: boolean,
) {
  const page = fct.extractPageSimple(state.page ?? 1, cachedGuild.db.entriesPerPage);

  const title = `Toplist channels in ${guild.name} | ${_prettifyTime[state.time]}`;

  const topTypeChannels = async (type: 'voiceMinute' | 'textMessage') => {
    const channels = await getTopChannels(guild, type, state.time, page);
    return channels.slice(0, 1024);
  };

  const embed = {
    title,
    color: 0x01c3d9,
    fields: [
      { name: 'Text', value: await topTypeChannels('textMessage'), inline: true },
      { name: 'Voice', value: await topTypeChannels('voiceMinute'), inline: true },
    ],
  };

  return {
    embeds: [embed],
    components: getChannelComponents(state, disabled),
  };
}

async function getTopChannels(
  guild: Guild,
  type: 'voiceMinute' | 'textMessage',
  time: StatTimeInterval,
  page: Pagination,
) {
  const channelRanks = await getChannelRanks(guild, type, time, page.from, page.to);
  if (!channelRanks || channelRanks.length === 0) return 'No entries found for this page.';

  const channelMention = (index: number) =>
    getChannelMention(guild.channels.cache, channelRanks[index].channelId);
  const label = type === 'voiceMinute' ? emoji('voice') : emoji('message');
  const channelValue = (index: number) =>
    type === 'voiceMinute'
      ? Math.round((channelRanks[index].total / 60) * 10) / 10
      : channelRanks[index].total;

  const s = [];
  for (let i = 0; i < channelRanks.length; i++)
    s.push(`#${page.from + i} | ${channelMention(i)} ⇒ ${label} ${channelValue(i)}`);

  return s.join('\n');
}

async function generateChannelMembers(
  state: CacheInstance,
  guild: Guild,
  cachedGuild: GuildModel,
  disabled: boolean,
) {
  if (!state.channel) {
    return {
      embeds: [
        {
          title: `Toplist | ${_prettifyTime[state.time]}`,
          color: 0x01c3d9,
          description: 'Select a channel.',
        },
      ],
      components: getChannelMembersComponents(state, disabled),
    };
  }

  const type = state.channel.type === ChannelType.GuildVoice ? 'voiceMinute' : 'textMessage';

  const page = fct.extractPageSimple(state.page ?? 1, cachedGuild.db.entriesPerPage);

  const title = `Toplist for channel ${state.channel.name} | ${_prettifyTime[state.time]}`;

  const channelMemberRanks = await getChannelMemberRanks(
    guild,
    state.channel.id,
    type,
    state.time,
    page.from,
    page.to,
  );

  if (!channelMemberRanks || channelMemberRanks.length === 0) {
    return {
      embeds: [{ title, color: 0x01c3d9, description: 'No entries found for this page.' }],
      components: getChannelMembersComponents(state, disabled),
    };
  }

  const ranksWithNames = await getGuildMemberNamesWithRanks(guild, channelMemberRanks);

  const embed: APIEmbed = { title, color: 0x01c3d9 };

  const bonusUntil = new Date(Number.parseInt(cachedGuild.db.bonusUntilDate) * 1000);

  if (bonusUntil.getTime() > Date.now()) {
    embed.description = `**!! Bonus XP ends ${time(bonusUntil, 'R')} !!**\n`;
  }

  for (let i = 0; i < ranksWithNames.length; i++) {
    const rank = ranksWithNames[i];

    const value =
      type === 'voiceMinute'
        ? `${emoji('voice')} ${Math.round((rank.total / 60) * 10) / 10}h`
        : `${emoji('message')} ${rank.total}`;

    embed.fields = [
      ...(embed.fields ?? []),
      { name: `#${page.from + i}  ${rank.name}`, value, inline: true },
    ];
  }

  return {
    embeds: [embed],
    components: getChannelMembersComponents(state, disabled),
  };
}

async function generateGuildMembers(
  state: CacheInstance,
  guild: Guild,
  cachedGuild: GuildModel,
  disabled: boolean,
) {
  const page = fct.extractPageSimple(state.page ?? 1, cachedGuild.db.entriesPerPage);

  let title = `Toplist for server ${guild.name} | ${_prettifyTime[state.time]}`;

  if (state.orderType === 'voiceMinute') title += ' | By voice (hours)';
  else if (state.orderType === 'textMessage') title += ' | By text (messages)';
  else if (state.orderType === 'invite') title += ' | By invites';
  else if (state.orderType === 'vote') title += ` | By ${cachedGuild.db.voteTag}`;
  else if (state.orderType === 'bonus') title += ` | By ${cachedGuild.db.bonusTag}`;
  else if (state.orderType === 'totalScore' || state.orderType === 'allScores')
    title += ' | By total XP';

  const memberRanks = await getGuildMemberRanks(
    guild,
    state.orderType === 'allScores' ? 'totalScore' : state.orderType,
    state.time,
    page.from,
    page.to,
  );

  if (!memberRanks || memberRanks.length === 0) {
    return {
      embeds: [{ title, color: 0x01c3d9, description: 'No entries found for this page.' }],
      components: getMembersComponents(state, disabled),
    };
  }

  const memberRanksWithNames = await getGuildMemberNamesWithRanks(guild, memberRanks);

  const embed: APIEmbed = { title, color: 0x01c3d9 };

  const bonusUntil = new Date(Number.parseInt(cachedGuild.db.bonusUntilDate) * 1000);

  if (bonusUntil.getTime() > Date.now()) {
    embed.description = `**!! Bonus XP ends ${time(bonusUntil, 'R')} !!**\n`;
  }

  let i = 0;
  while (memberRanksWithNames.length > 0) {
    // biome-ignore lint/style/noNonNullAssertion: `shift()`ed immediately after a `.length` check
    const memberRank = memberRanksWithNames.shift()!;

    const getScoreString = (type: StatType) => {
      if (type === 'textMessage' && cachedGuild.db.textXp)
        return `${emoji('message')} ${memberRank.textMessage}`;
      if (type === 'voiceMinute' && cachedGuild.db.voiceXp)
        return `${emoji('voice')} ${Math.round((memberRank.voiceMinute / 60) * 10) / 10}`;
      if (type === 'invite' && cachedGuild.db.inviteXp)
        return `${emoji('invite')} ${memberRank.invite}`;
      if (type === 'vote' && cachedGuild.db.voteXp)
        return `${cachedGuild.db.voteEmote} ${memberRank.vote}`;
      if (type === 'bonus' && cachedGuild.db.bonusXp)
        return `${cachedGuild.db.bonusEmote} ${memberRank.bonus}`;
      return null;
    };

    const scoreStrings = [
      getScoreString('textMessage'),
      getScoreString('voiceMinute'),
      getScoreString('invite'),
      getScoreString('vote'),
      getScoreString('bonus'),
    ].filter((s) => s !== null);

    const getFieldScoreString = (type: StatType | 'totalScore' | 'allScores') => {
      if (type === 'totalScore') return '';
      if (type === 'allScores') return `🔸 ${scoreStrings.join(' | ')}`;
      return `🔸 ${getScoreString(type)}`;
    };

    embed.fields = [
      ...(embed.fields ?? []),
      {
        name: `**#${page.from + i} ${memberRank.name}** ${emoji('level')}${Math.floor(
          memberRank.levelProgression,
        )}`,
        value: `Total: ${memberRank.totalScore} XP ${getFieldScoreString(state.orderType)}`,
      },
    ];
    i++;
  }

  return {
    embeds: [embed],
    components: getMembersComponents(state, disabled),
  };
}

function getGlobalComponents(
  state: CacheInstance,
  disabled: boolean,
): ActionRowData<MessageActionRowComponentData>[] {
  return [
    actionrow([
      {
        type: ComponentType.StringSelect,
        disabled,
        customId: windowSelect.instanceId({ predicate: state.componentPredicate }),
        options: [
          {
            label: 'Top Members',
            value: 'members',
            default: state.window === 'members',
          },
          {
            label: 'Top Members in Channel',
            value: 'channelMembers',
            default: state.window === 'channelMembers',
          },
          {
            label: 'Top Channels',
            value: 'channels',
            default: state.window === 'channels',
          },
        ],
      },
    ]),
    actionrow([
      {
        type: ComponentType.StringSelect,
        customId: timeSelect.instanceId({ predicate: state.componentPredicate }),
        options: statTimeIntervals.map((i) => ({
          label: i,
          value: i,
          default: state.time === i,
        })),
        disabled,
      },
    ]),
  ];
}

function getPaginationComponents(
  state: CacheInstance,
  disabled: boolean,
): ActionRowData<MessageActionRowComponentData> {
  return actionrow([
    {
      type: ComponentType.Button,
      emoji: { name: '⬅' },
      customId: pageButton.instanceId({
        data: { page: state.page - 1 },
        predicate: state.componentPredicate,
      }),
      style: ButtonStyle.Secondary,
      disabled: state.page <= 1 || disabled,
    },
    {
      type: ComponentType.Button,
      label: state.page.toString(),
      customId: ComponentKey.Throw,
      style: ButtonStyle.Primary,
      disabled: true,
    },
    {
      type: ComponentType.Button,
      emoji: { name: '➡️' },
      customId: pageButton.instanceId({
        data: { page: state.page + 1 },
        predicate: state.componentPredicate,
      }),
      style: ButtonStyle.Secondary,
      disabled: disabled,
    },
  ]);
}

function getMembersComponents(
  state: CacheInstance,
  disabled: boolean,
): ActionRowData<MessageActionRowComponentData>[] {
  const rowOption = (label: string, value: string) => ({
    label,
    value,
    default: state.orderType === value,
  });

  return [
    ...getGlobalComponents(state, disabled),
    actionrow([
      {
        type: ComponentType.StringSelect,
        disabled,
        customId: orderSelect.instanceId({ predicate: state.componentPredicate }),
        options: [
          rowOption('All', 'allScores'),
          rowOption('Total', 'totalScore'),
          rowOption('Messages', 'textMessage'),
          rowOption('Voice Time', 'voiceMinute'),
          rowOption('Invites', 'invite'),
          rowOption('Upvotes', 'vote'),
          rowOption('Bonus', 'bonus'),
        ],
      },
    ]),
    getPaginationComponents(state, disabled),
  ];
}

function getChannelMembersComponents(
  state: CacheInstance,
  disabled: boolean,
): ActionRowData<MessageActionRowComponentData>[] {
  return [
    ...getGlobalComponents(state, disabled),
    actionrow([
      {
        type: ComponentType.ChannelSelect,
        customId: channelSelect.instanceId({ predicate: state.componentPredicate }),
        disabled,
        minValues: 1,
        maxValues: 1,
        channelTypes: [
          ChannelType.GuildText,
          ChannelType.GuildVoice,
          ChannelType.GuildAnnouncement,
          ChannelType.GuildForum,
        ],
      },
    ]),
    getPaginationComponents(state, disabled),
  ];
}

function getChannelComponents(state: CacheInstance, disabled: boolean) {
  return [...getGlobalComponents(state, disabled), getPaginationComponents(state, disabled)];
}
