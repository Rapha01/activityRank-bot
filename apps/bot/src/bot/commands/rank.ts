import {
  EmbedBuilder,
  ButtonStyle,
  RESTJSONErrorCodes,
  ComponentType,
  type Guild,
  type User,
  type ChatInputCommandInteraction,
  type DiscordAPIError,
  type MessageComponentInteraction,
  type InteractionEditReplyOptions,
  type ActionRowData,
  type MessageActionRowComponentData,
  time,
} from 'discord.js';
import { handleStatCommandsCooldown } from '../util/cooldownUtil.js';
import { getGuildModel, type GuildModel } from '../models/guild/guildModel.js';
import {
  fetchGuildMemberScores,
  fetchGuildMemberStatistics,
  getGuildMemberScorePosition,
  getGuildMemberStatPosition,
  getGuildMemberTopChannels,
} from 'bot/models/rankModel.js';
import fct from '../../util/fct.js';
import nameUtil from '../util/nameUtil.js';
import { statTimeIntervals, type StatTimeInterval, type StatType } from 'models/types/enums.js';
import type { Guild as DBGuild } from 'models/types/kysely/shard.js';
import { command } from 'bot/util/registry/command.js';
import { ApplicationCommandOptionType } from 'discord.js';
import { component, ComponentKey } from 'bot/util/registry/component.js';
import { requireUserId } from 'bot/util/predicates.js';

interface CacheInstance {
  window: 'rank' | 'topChannels';
  time: StatTimeInterval;
  owner: string;
  targetUser: User;
  page: number;
  interaction: ChatInputCommandInteraction<'cached'>;
}

const activeCache = new Map();

export default command.basic({
  data: {
    name: 'rank',
    description: "Find your or another member's rank",
    options: [
      {
        name: 'member',
        description: 'The member to check the rank of',
        type: ApplicationCommandOptionType.User,
      },
    ],
  },
  async execute({ interaction, client }) {
    await interaction.deferReply();

    if ((await handleStatCommandsCooldown(interaction)).denied) return;

    const cachedGuild = await getGuildModel(interaction.guild);
    const myGuild = await cachedGuild.fetch();

    const targetUser = interaction.options.getUser('member') ?? interaction.user;

    const initialState: CacheInstance = {
      window: 'rank',
      time: 'alltime',
      owner: interaction.member.id,
      targetUser,
      page: 1,
      interaction,
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
  myGuild: DBGuild,
  disabled = false,
): Promise<InteractionEditReplyOptions> {
  if (cache.window === 'rank') return await generateRankCard(cache, guild, myGuild, disabled);
  else if (cache.window === 'topChannels')
    return await generateChannelCard(cache, guild, myGuild, disabled);
  else throw new Error();
}

const _prettifyTime: { [k in StatTimeInterval]: string } = {
  day: 'Today',
  week: 'This week',
  month: 'This month',
  year: 'This year',
  alltime: 'Forever',
};

async function generateChannelCard(
  state: CacheInstance,
  guild: Guild,
  myGuild: DBGuild,
  disabled: boolean,
): Promise<InteractionEditReplyOptions> {
  const page = fct.extractPageSimple(state.page ?? 1, myGuild.entriesPerPage);

  const guildMemberInfo = await nameUtil.getGuildMemberInfo(guild, state.targetUser.id);

  const header = `Channel toplist for ${guildMemberInfo.name} | ${_prettifyTime[state.time]}`;

  const embed = new EmbedBuilder()
    .setTitle(header)
    .setColor('#4fd6c8')
    .addFields(
      {
        name: 'Text',
        value: (
          await getTopChannels(page, guild, state.targetUser.id, state.time, 'textMessage')
        ).slice(0, 1024),
        inline: true,
      },
      {
        name: 'Voice',
        value: (
          await getTopChannels(page, guild, state.targetUser.id, state.time, 'voiceMinute')
        ).slice(0, 1024),
        inline: true,
      },
    );

  return {
    embeds: [embed],
    components: getChannelComponents(state, disabled),
  };
}

function getChannelComponents(
  state: CacheInstance,
  disabled: boolean,
): ActionRowData<MessageActionRowComponentData>[] {
  return [...getGlobalComponents(state, disabled), getPaginationComponents(state, disabled)];
}

function getPaginationComponents(
  state: CacheInstance,
  disabled: boolean,
): ActionRowData<MessageActionRowComponentData> {
  return {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.Button,
        emoji: '⬅',
        customId: pageButton.instanceId({
          data: { page: state.page - 1 },
          predicate: requireUserId(state.owner),
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
        emoji: '➡️',
        customId: pageButton.instanceId({
          data: { page: state.page + 1 },
          predicate: requireUserId(state.owner),
        }),
        style: ButtonStyle.Secondary,
        disabled,
      },
    ],
  };
}

async function getTopChannels(
  page: { from: number; to: number },
  guild: Guild,
  memberId: string,
  time: StatTimeInterval,
  type: StatType,
) {
  const guildMemberTopChannels = await getGuildMemberTopChannels(
    guild,
    memberId,
    type,
    time,
    page.from,
    page.to,
  );

  if (!guildMemberTopChannels || guildMemberTopChannels.length == 0)
    return 'No entries found for this page.';

  const channelMention = (index: number) =>
    nameUtil.getChannelMention(guild.channels.cache, guildMemberTopChannels[index].channelId);
  const emoji = type === 'voiceMinute' ? ':microphone2:' : ':writing_hand:';
  const channelValue = (index: number) =>
    type === 'voiceMinute'
      ? Math.round((guildMemberTopChannels[index].entries / 60) * 10) / 10
      : guildMemberTopChannels[index].entries;

  const s = [];
  for (let i = 0; i < guildMemberTopChannels.length; i++)
    s.push(`#${page.from + i} | ${channelMention(i)} ⇒ ${emoji} ${channelValue(i)}`);

  return s.join('\n');
}

async function generateRankCard(
  state: CacheInstance,
  guild: Guild,
  myGuild: DBGuild,
  disabled = false,
): Promise<InteractionEditReplyOptions> {
  const scores = await fetchGuildMemberScores(guild, state.targetUser.id);
  const statistics = await fetchGuildMemberStatistics(guild, state.targetUser.id);

  if (!scores) throw new Error();

  const guildCache = await getGuildModel(guild);

  const positions = await getPositions(
    guild,
    state.targetUser.id,
    getTypes(guildCache),
    state.time,
  );

  const guildMemberInfo = await nameUtil.getGuildMemberInfo(guild, state.targetUser.id);
  const levelProgression = fct.getLevelProgression(scores.alltime, guildCache.db.levelFactor);

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${state.time} stats on server ${guild.name}` })
    .setColor('#4fd6c8')
    .setThumbnail(state.targetUser.avatarURL());

  const bonusUntil = new Date(parseInt(myGuild.bonusUntilDate) * 1000);

  if (bonusUntil.getTime() > Date.now()) {
    embed.setDescription(`**!! Bonus XP ends ${time(bonusUntil, 'R')} !!**\n`);
  }

  const infoStrings = [
    `Total XP: ${Math.round(scores[state.time])} (#${positions.xp})`,
    `Next Level: ${Math.floor((levelProgression % 1) * 100)}%`,
  ].join('\n');

  embed.addFields(
    {
      name: `#${positions.xp} **${guildMemberInfo.name}** 🎖 ${Math.floor(levelProgression)}`,
      value: infoStrings,
    },
    {
      name: 'Stats',
      value: getStatisticStrings(guildCache, statistics, positions, state.time),
    },
  );

  return {
    embeds: [embed],
    components: getRankComponents(state, disabled),
  };
}

function getGlobalComponents(
  state: CacheInstance,
  disabled: boolean,
): ActionRowData<MessageActionRowComponentData>[] {
  const component = (id: 'rank' | 'topChannels', label: string): MessageActionRowComponentData => ({
    type: ComponentType.Button,
    style: state.window === id ? ButtonStyle.Primary : ButtonStyle.Secondary,
    disabled: disabled || state.window === id,
    customId: windowButton.instanceId({ data: id, predicate: requireUserId(state.owner) }),
    label,
  });

  return [
    {
      type: ComponentType.ActionRow,
      components: [component('rank', 'Stats'), component('topChannels', 'Top Channels')],
    },
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.StringSelect,
          customId: timeSelect.instanceId({ predicate: requireUserId(state.owner) }),
          disabled,
          options: statTimeIntervals.map((interval) => ({
            label: interval,
            value: interval,
            default: state.time === interval,
          })),
        },
      ],
    },
  ];
}

function getRankComponents(
  state: CacheInstance,
  disabled: boolean,
): ActionRowData<MessageActionRowComponentData>[] {
  return [...getGlobalComponents(state, disabled)];
}

function getStatisticStrings(
  myGuild: GuildModel,
  stats: NonNullable<Awaited<ReturnType<typeof fetchGuildMemberStatistics>>>,
  positions: Record<string, number | null>,
  time: StatTimeInterval,
) {
  const scoreStrings = [];
  if (myGuild.db.textXp)
    scoreStrings.push(`:writing_hand: ${stats.textMessage[time]} (#${positions.textMessage})`);
  if (myGuild.db.voiceXp)
    scoreStrings.push(
      `:microphone2: ${Math.round((stats.voiceMinute[time] / 60) * 10) / 10} (#${positions.voiceMinute})`,
    );
  if (myGuild.db.inviteXp)
    scoreStrings.push(`:envelope: ${stats.invite[time]} (#${positions.invite})`);
  if (myGuild.db.voteXp)
    scoreStrings.push(`${myGuild.db.voteEmote} ${stats.vote[time]} (#${positions.vote})`);
  if (myGuild.db.bonusXp)
    scoreStrings.push(`${myGuild.db.bonusEmote} ${stats.bonus[time]} (#${positions.bonus})`);

  return scoreStrings.join('\n');
}

async function getPositions<T extends StatType[]>(
  guild: Guild,
  memberId: string,
  types: T,
  time: StatTimeInterval,
): Promise<Record<T[number] | 'xp', number>> {
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
