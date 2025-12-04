import type { ShardDB } from '@activityrank/database';
import {
  type ActionRowData,
  type APIContainerComponent,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
  type DiscordAPIError,
  type Guild,
  type InteractionEditReplyOptions,
  type MessageActionRowComponentData,
  type MessageComponentInteraction,
  MessageFlags,
  RESTJSONErrorCodes,
  time,
  type User,
} from 'discord.js';
import type { TFunction } from 'i18next';
import { command } from '#bot/commands.ts';
import {
  fetchGuildMemberScores,
  fetchGuildMemberStatistics,
  getGuildMemberScorePosition,
  getGuildMemberStatPosition,
  getGuildMemberTopChannels,
} from '#bot/models/rankModel.ts';
import { requireUserId } from '#bot/util/predicates.ts';
import { ComponentKey, component } from '#bot/util/registry/component.ts';
import { assertUnreachable } from '#bot/util/typescript.ts';
import { emoji } from '#const/config.ts';
import { type StatTimeInterval, type StatType, statTimeIntervals } from '#models/types/enums.ts';
import fct from '../../util/fct.ts';
import { type GuildModel, getGuildModel } from '../models/guild/guildModel.ts';
import { handleStatCommandsCooldown } from '../util/cooldownUtil.ts';
import nameUtil from '../util/nameUtil.ts';

interface CacheInstance {
  window: 'rank' | 'topChannels';
  time: StatTimeInterval;
  owner: string;
  targetUser: User;
  page: number;
  interaction: ChatInputCommandInteraction<'cached'>;
  t: TFunction<'command-content'>;
  locales: string[];
}

const activeCache = new Map();

export default command({
  name: 'rank',
  async execute({ interaction, client, options, t }) {
    await interaction.deferReply();

    if ((await handleStatCommandsCooldown(t, interaction)).denied) return;

    const cachedGuild = await getGuildModel(interaction.guild);
    const myGuild = await cachedGuild.fetch();

    const targetUser = options.member ?? interaction.user;

    const initialState: CacheInstance = {
      window: 'rank',
      time: 'alltime',
      owner: interaction.member.id,
      targetUser,
      page: 1,
      locales: [interaction.locale, 'en-US'],
      interaction,
      t,
    };

    const { id } = await interaction.editReply(
      await generateCard(initialState, interaction.guild, myGuild),
    );

    const cleanCache = async () => {
      const state = activeCache.get(id);
      activeCache.delete(id);
      if (!interaction.guild)
        return client.logger.debug({ interaction }, '/rank tried to update uncached guild');
      try {
        await interaction.editReply(await generateCard(state, interaction.guild, myGuild, true));
      } catch (_err) {
        const err = _err as DiscordAPIError;
        if (err.code === RESTJSONErrorCodes.UnknownMessage)
          client.logger.debug({ interaction }, '/rank tried to update unknown message');
        else throw err;
      }
    };
    setTimeout(cleanCache, 5 * 60 * 1_000);

    activeCache.set(id, initialState);
  },
});

const pageButton = component<{ page: number }>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    await execCacheSet(interaction, 'page', data.page);
  },
});

const windowButton = component<CacheInstance['window']>({
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    await execCacheSet(interaction, 'window', data);
  },
});

const timeSelect = component({
  type: ComponentType.StringSelect,
  async callback({ interaction }) {
    const time = interaction.values[0];
    await execCacheSet(interaction, 'time', time as StatTimeInterval);
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

  const guildModel = await getGuildModel(interaction.guild);
  const myGuild = await guildModel.fetch();

  activeCache.set(interaction.message.id, { ...cachedMessage, [key]: value });

  await interaction.deferUpdate();

  const state = activeCache.get(interaction.message.id);
  await interaction.editReply(await generateCard(state, interaction.guild, myGuild));
}

async function generateCard(
  cache: CacheInstance,
  guild: Guild,
  myGuild: ShardDB.Guild,
  disabled = false,
): Promise<InteractionEditReplyOptions> {
  if (cache.window === 'rank') {
    return await generateRankCard(cache, guild, myGuild, disabled);
  }
  if (cache.window === 'topChannels') {
    return await generateChannelCard(cache, guild, myGuild, disabled);
  }
  assertUnreachable(cache.window);
}

async function generateRankCard(
  state: CacheInstance,
  guild: Guild,
  myGuild: ShardDB.Guild,
  disabled = false,
): Promise<InteractionEditReplyOptions> {
  const scores = await fetchGuildMemberScores(guild, state.targetUser.id);
  const statistics = await fetchGuildMemberStatistics(guild, state.targetUser.id);

  const guildCache = await getGuildModel(guild);

  const positions = await getPositions(
    guild,
    state.targetUser.id,
    getTypes(guildCache),
    state.time,
  );

  const guildMemberInfo = await nameUtil.getGuildMemberInfo(guild, state.targetUser.id);
  const levelProgression = fct.getLevelProgression(scores.alltime, guildCache.db.levelFactor);

  const container: APIContainerComponent = {
    type: ComponentType.Container,
    accent_color: 0x01c3d9,
    components: [
      {
        type: ComponentType.TextDisplay,
        content: `# ${state.t(`rank.statHeaders.${state.time}`, { serverName: guild.name })}`,
      },
    ],
  };

  const bonusUntil = new Date(Number.parseInt(myGuild.bonusUntilDate) * 1000);

  if (bonusUntil.getTime() > Date.now()) {
    // TODO: add warning or "bonustime" (clock?) emoji here
    // embed.setDescription(
    //   `**!! ${state.t('rank.bonusEnds', { date: `<t:${bonusUntil}:R>` })} !!**\n`,
    // );
    container.components.push({
      type: ComponentType.TextDisplay,
      content: `**${state.t('rank.bonusEnds', { date: time(bonusUntil, 'R') })}**`,
    });
    container.components.push({ type: ComponentType.Separator });
  }

  const infoStrings = [
    positions.xp !== null
      ? state.t('rank.totalXP', {
          xp: Math.round(scores[state.time]).toLocaleString(state.locales),
          rank: positions.xp,
        })
      : state.t('rank.zeroXp'),
    // only show percentage to next level for alltime; showing it for time-based xp is misleading
    state.time === 'alltime'
      ? state.t('rank.nextLevel', { percent: Math.floor((levelProgression % 1) * 100) })
      : null,
  ]
    .filter((d) => d !== null)
    .join('\n');

  const userHeader =
    // only show level progression and position if the user has at least 1 xp
    positions.xp !== null
      ? `\\#${positions.xp} ${guildMemberInfo.name} ${emoji('level')}${Math.floor(levelProgression)}`
      : `${guildMemberInfo.name} ${emoji('level')}1`;

  container.components.push(
    {
      type: ComponentType.Section,
      components: [
        { type: ComponentType.TextDisplay, content: `## ${userHeader}\n${infoStrings}` },
      ],
      accessory: {
        type: ComponentType.Thumbnail,
        media: { url: state.targetUser.displayAvatarURL() },
        description: state.t('rank.avatarAltText', { member: state.targetUser.username }),
      },
    },
    {
      type: ComponentType.TextDisplay,
      content: `## ${state.t('rank.stats')}\n${getStatisticStrings(guildCache, statistics, positions, state.time)}`,
    },
  );

  container.components.push({
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.StringSelect,
        custom_id: timeSelect.instanceId({ predicate: requireUserId(state.owner) }),
        disabled,
        options: statTimeIntervals.map((interval) => ({
          label: state.t(`rank.${interval}`),
          value: interval,
          // TODO: add custom emojis (maybe partially filled clock? calendar?)
          default: state.time === interval,
        })),
      },
    ],
  });

  return {
    components: [container, ...getGlobalComponents(state, disabled)],
    // @ts-ignore incorrect Discord.JS typings
    flags: [MessageFlags.IsComponentsV2],
  };
}

async function generateChannelCard(
  state: CacheInstance,
  guild: Guild,
  myGuild: ShardDB.Guild,
  disabled: boolean,
): Promise<InteractionEditReplyOptions> {
  const page = fct.extractPageSimple(state.page, myGuild.entriesPerPage);

  const guildMemberInfo = await nameUtil.getGuildMemberInfo(guild, state.targetUser.id);

  const container: APIContainerComponent = {
    type: ComponentType.Container,
    accent_color: 0x01c3d9,
    components: [
      {
        type: ComponentType.TextDisplay,
        content: `# ${state.t(`rank.topChannelHeaders.${state.time}`, {
          name: guildMemberInfo.name,
        })}`,
      },
    ],
  };

  const topText = await getTopChannelStrings(
    state.t,
    page,
    guild,
    state.targetUser.id,
    state.time,
    'textMessage',
  );
  const topVoice = await getTopChannelStrings(
    state.t,
    page,
    guild,
    state.targetUser.id,
    state.time,
    'voiceMinute',
  );

  const contents = [
    [topText, 'text'],
    [topVoice, 'voice'],
  ] as const;

  const activeContent = contents
    .filter(([val, _]) => val !== null)
    .map(([val, type]) => `## ${state.t(`rank.${type}`)}\n${val}`)
    .join('\n');

  const inactiveContent = contents
    .filter(([val, _]) => val === null)
    .map(([_, type]) => `-# ${state.t(`rank.${type}Empty`)}`)
    .join('\n');

  if (activeContent.length > 0 && inactiveContent.length > 0) {
    container.components.push(
      { type: ComponentType.TextDisplay, content: activeContent },
      { type: ComponentType.Separator, divider: false },
      { type: ComponentType.TextDisplay, content: inactiveContent },
    );
  } else {
    container.components.push({
      type: ComponentType.TextDisplay,
      content: activeContent.length > 0 ? activeContent : inactiveContent,
    });
  }

  container.components.push(
    { type: ComponentType.Separator, spacing: 2 },
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.StringSelect,
          custom_id: timeSelect.instanceId({ predicate: requireUserId(state.owner) }),
          disabled,
          options: statTimeIntervals.map((interval) => ({
            label: state.t(`rank.${interval}`),
            value: interval,
            // TODO: add custom emojis (maybe partially filled clock? calendar?)
            default: state.time === interval,
          })),
        },
      ],
    },
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          emoji: { name: '⬅' },
          custom_id: pageButton.instanceId({
            data: { page: state.page - 1 },
            predicate: requireUserId(state.owner),
          }),
          style: ButtonStyle.Secondary,
          disabled: state.page <= 1 || disabled,
        },
        {
          type: ComponentType.Button,
          label: state.page.toString(),
          custom_id: ComponentKey.Throw,
          style: ButtonStyle.Primary,
          disabled: true,
        },
        {
          type: ComponentType.Button,
          emoji: { name: '➡️' },
          custom_id: pageButton.instanceId({
            data: { page: state.page + 1 },
            predicate: requireUserId(state.owner),
          }),
          style: ButtonStyle.Secondary,
          disabled,
        },
      ],
    },
  );

  return { components: [container, ...getGlobalComponents(state, disabled)] };
}

async function getTopChannelStrings(
  _t: TFunction<'command-content'>,
  page: { from: number; to: number },
  guild: Guild,
  memberId: string,
  time: StatTimeInterval,
  type: StatType,
): Promise<string | null> {
  const guildMemberTopChannels = await getGuildMemberTopChannels(
    guild,
    memberId,
    type,
    time,
    page.from,
    page.to,
  );

  if (!guildMemberTopChannels || guildMemberTopChannels.length === 0) {
    return null;
  }

  const channelMention = (index: number) =>
    nameUtil.getChannelMention(guild.channels.cache, guildMemberTopChannels[index].channelId);
  const label = type === 'voiceMinute' ? emoji('voice') : emoji('message');
  const channelValue = (index: number) =>
    type === 'voiceMinute'
      ? Math.round((guildMemberTopChannels[index].entries / 60) * 10) / 10
      : guildMemberTopChannels[index].entries;

  const s = [];
  for (let i = 0; i < guildMemberTopChannels.length; i++)
    s.push(`**#${page.from + i}** ${channelMention(i)}: ${label} ${channelValue(i)}`);

  return s.join('\n');
}

function getGlobalComponents(
  state: CacheInstance,
  disabled: boolean,
): ActionRowData<MessageActionRowComponentData>[] {
  const pageComponent = (
    id: 'rank' | 'topChannels',
    label: string,
  ): MessageActionRowComponentData => ({
    type: ComponentType.Button,
    style: state.window === id ? ButtonStyle.Primary : ButtonStyle.Secondary,
    disabled: disabled || state.window === id,
    customId: windowButton.instanceId({ data: id, predicate: requireUserId(state.owner) }),
    label,
  });

  return [
    {
      type: ComponentType.ActionRow,
      components: [
        pageComponent('rank', state.t('rank.stats')),
        pageComponent('topChannels', state.t('rank.topChannels')),
      ],
    },
  ];
}

function getStatisticStrings(
  myGuild: GuildModel,
  stats: NonNullable<Awaited<ReturnType<typeof fetchGuildMemberStatistics>>>,
  positions: Record<string, number | null>,
  time: StatTimeInterval,
) {
  const scoreStrings = [];
  if (myGuild.db.textXp) {
    scoreStrings.push(
      positions.textMessage !== null
        ? `${emoji('message')} ${stats.textMessage[time]} (#${positions.textMessage})`
        : // don't show the rank if it's 0
          `${emoji('message')} ${stats.textMessage[time]}`,
    );
  }
  if (myGuild.db.voiceXp) {
    scoreStrings.push(
      positions.voiceMinute !== null
        ? `${emoji('voice')} ${Math.round((stats.voiceMinute[time] / 60) * 10) / 10} (#${positions.voiceMinute})`
        : `${emoji('voice')} ${Math.round((stats.voiceMinute[time] / 60) * 10) / 10}`,
    );
  }
  if (myGuild.db.inviteXp) {
    scoreStrings.push(
      positions.invite !== null
        ? `${emoji('invite')} ${stats.invite[time]} (#${positions.invite})`
        : `${emoji('invite')} ${stats.invite[time]}`,
    );
  }
  if (myGuild.db.voteXp) {
    scoreStrings.push(
      positions.vote !== null
        ? `${myGuild.db.voteEmote} ${stats.vote[time]} (#${positions.vote})`
        : `${myGuild.db.voteEmote} ${stats.vote[time]}`,
    );
  }
  if (myGuild.db.bonusXp) {
    scoreStrings.push(
      positions.bonus !== null
        ? `${myGuild.db.bonusEmote} ${stats.bonus[time]} (#${positions.bonus})`
        : `${myGuild.db.bonusEmote} ${stats.bonus[time]}`,
    );
  }

  return scoreStrings.join('\n');
}

async function getPositions<T extends StatType[]>(
  guild: Guild,
  memberId: string,
  types: T,
  time: StatTimeInterval,
): Promise<Record<T[number] | 'xp', number | null>> {
  const positions = types.map(
    async (t) =>
      [t, await getGuildMemberStatPosition(guild, memberId, t, time)] as [T[number], number],
  );
  const entries = await Promise.all([
    ...positions,
    (async () => ['xp', await getGuildMemberScorePosition(guild, memberId, time)])(),
  ]);
  return Object.fromEntries(entries);
}

function getTypes(myGuild: GuildModel): StatType[] {
  return [
    myGuild.db.textXp ? ('textMessage' as const) : null,
    myGuild.db.voiceXp ? ('voiceMinute' as const) : null,
    myGuild.db.inviteXp ? ('invite' as const) : null,
    myGuild.db.voteXp ? ('vote' as const) : null,
    myGuild.db.bonusXp ? ('bonus' as const) : null,
  ].filter((i) => i !== null);
}
