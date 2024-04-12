import {
  SlashCommandBuilder,
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
} from 'discord.js';

import cooldownUtil from '../util/cooldownUtil.js';
import { getGuildModel, type GuildModel } from '../models/guild/guildModel.js';
import {
  getGuildMemberRank,
  getGuildMemberRankPosition,
  getGuildMemberTopChannels,
} from 'bot/models/rankModel.js';
import fct from '../../util/fct.js';
import nameUtil from '../util/nameUtil.js';
import { ComponentKey, registerComponent, registerSlashCommand } from 'bot/util/commandLoader.js';
import { statTimeIntervals, type StatTimeInterval, type StatType } from 'models/types/enums.js';
import type { GuildSchema } from 'models/types/shard.js';

interface CacheInstance {
  window: 'rank' | 'topChannels';
  time: StatTimeInterval;
  owner: string;
  targetUser: User;
  page: number;
  interaction: ChatInputCommandInteraction<'cached'>;
}

export const activeCache = new Map();

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("Find your or another member's rank")
    .addUserOption((o) => o.setName('member').setDescription('The member to check the rank of')),
  execute: async function (i) {
    await i.deferReply();

    if (!(await cooldownUtil.checkStatCommandsCooldown(i))) return;

    const cachedGuild = await getGuildModel(i.guild);
    const myGuild = await cachedGuild.fetch();

    const targetUser = i.options.getUser('member') ?? i.user;

    const initialState: CacheInstance = {
      window: 'rank',
      time: 'Alltime',
      owner: i.member.id,
      targetUser,
      page: 1,
      interaction: i,
    };

    const { id } = await i.editReply(await generateCard(initialState, i.guild, myGuild));

    const cleanCache = async () => {
      const state = activeCache.get(id);
      activeCache.delete(id);
      if (!i.guild) return i.client.logger.debug({ i }, '/rank tried to update uncached guild');
      try {
        await i.editReply(await generateCard(state, i.guild, myGuild, true));
      } catch (_err) {
        const err = _err as DiscordAPIError;
        if (err.code === RESTJSONErrorCodes.UnknownMessage)
          i.client.logger.debug({ i }, '/rank tried to update Unknown message');
        else throw err;
      }
    };
    setTimeout(cleanCache, 5 * 60 * 1_000);

    activeCache.set(id, initialState);
  },
});

const pageId = registerComponent<{ page: number }>({
  identifier: 'rank.page',
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    await execCacheSet(interaction, 'page', data.page);
  },
});

const windowId = registerComponent<CacheInstance['window']>({
  identifier: 'rank.window',
  type: ComponentType.Button,
  async callback({ interaction, data }) {
    await execCacheSet(interaction, 'window', data);
  },
});

const timeId = registerComponent({
  identifier: 'rank.time',
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
  myGuild: GuildSchema,
  disabled = false,
): Promise<InteractionEditReplyOptions> {
  if (cache.window === 'rank') return await generateRankCard(cache, guild, myGuild, disabled);
  else if (cache.window === 'topChannels')
    return await generateChannelCard(cache, guild, myGuild, disabled);
  else throw new Error();
}

const _prettifyTime: { [k in StatTimeInterval]: string } = {
  Day: 'Today',
  Week: 'This week',
  Month: 'This month',
  Year: 'This year',
  Alltime: 'Forever',
};

async function generateChannelCard(
  state: CacheInstance,
  guild: Guild,
  myGuild: GuildSchema,
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
        customId: pageId({ page: state.page - 1 }, { ownerId: state.owner }),
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
        customId: pageId({ page: state.page + 1 }, { ownerId: state.owner }),
        style: ButtonStyle.Secondary,
        disabled: disabled,
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
      ? Math.round((guildMemberTopChannels[index][time] / 60) * 10) / 10
      : guildMemberTopChannels[index][time];

  const s = [];
  for (let i = 0; i < guildMemberTopChannels.length; i++)
    s.push(`#${page.from + i} | ${channelMention(i)} ⇒ ${emoji} ${channelValue(i)}`);

  return s.join('\n');
}

async function generateRankCard(
  state: CacheInstance,
  guild: Guild,
  myGuild: GuildSchema,
  disabled = false,
): Promise<InteractionEditReplyOptions> {
  const rank = await getGuildMemberRank(guild, state.targetUser.id);
  if (!rank) throw new Error();
  const guildCache = await getGuildModel(guild);

  const positions = await getPositions(
    guild,
    state.targetUser.id,
    getTypes(guildCache),
    state.time,
  );

  const guildMemberInfo = await nameUtil.getGuildMemberInfo(guild, state.targetUser.id);
  const levelProgression = fct.getLevelProgression(
    rank.totalScoreAlltime,
    guildCache.db.levelFactor,
  );

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${state.time} stats on server ${guild.name}` })
    .setColor('#4fd6c8')
    .setThumbnail(state.targetUser.avatarURL());

  if (myGuild.bonusUntilDate > Date.now() / 1000) {
    embed.setDescription(
      `**!! Bonus XP Active !!** (${Math.round(
        (((myGuild.bonusUntilDate - Date.now() / 1000) / 60 / 60) * 10) / 10,
      )}h left) \n`,
    );
  }

  const infoStrings = [
    `Total XP: ${Math.round(rank[`totalScore${state.time}`])} (#${positions.totalScore})`,
    `Next Level: ${Math.floor((levelProgression % 1) * 100)}%`,
  ].join('\n');

  embed.addFields(
    {
      name: `#${positions.totalScore} **${guildMemberInfo.name}** 🎖 ${Math.floor(
        levelProgression,
      )}`,
      value: infoStrings,
    },
    {
      name: 'Stats',
      value: getScoreStrings(guildCache, rank, positions, state.time),
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
  return [
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          style: state.window === 'rank' ? ButtonStyle.Primary : ButtonStyle.Secondary,
          disabled: disabled || state.window === 'rank',
          customId: windowId('rank', { ownerId: state.owner }),
          label: 'Stats',
        },
        {
          type: ComponentType.Button,
          style: state.window === 'topChannels' ? ButtonStyle.Primary : ButtonStyle.Secondary,
          disabled: disabled || state.window === 'topChannels',
          customId: windowId('topChannels', { ownerId: state.owner }),
          label: 'Top Channels',
        },
      ],
    },
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.StringSelect,
          customId: timeId(null, { ownerId: state.owner }),
          disabled,
          options: statTimeIntervals.map((i) => ({
            label: i,
            value: i,
            default: state.time === i,
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

function getScoreStrings(
  myGuild: GuildModel,
  ranks: NonNullable<Awaited<ReturnType<typeof getGuildMemberRank>>>,
  positions: Record<string, number | null>,
  time: StatTimeInterval,
) {
  const scoreStrings = [];
  if (myGuild.db.textXp)
    scoreStrings.push(`:writing_hand: ${ranks[`textMessage${time}`]} (#${positions.textMessage})`);
  if (myGuild.db.voiceXp)
    scoreStrings.push(
      `:microphone2: ${Math.round((ranks[`voiceMinute${time}`] / 60) * 10) / 10} (#${
        positions.voiceMinute
      })`,
    );
  if (myGuild.db.inviteXp)
    scoreStrings.push(`:envelope: ${ranks[`invite${time}`]} (#${positions.invite})`);
  if (myGuild.db.voteXp)
    scoreStrings.push(`${myGuild.db.voteEmote} ${ranks[`vote${time}`]} (#${positions.vote})`);
  if (myGuild.db.bonusXp)
    scoreStrings.push(`${myGuild.db.bonusEmote} ${ranks[`bonus${time}`]} (#${positions.bonus})`);

  return scoreStrings.join('\n');
}

async function getPositions<T extends string>(
  guild: Guild,
  memberId: string,
  types: T[],
  time: StatTimeInterval,
) {
  const res = Object.fromEntries(
    await Promise.all(
      types.map(async (t) => [
        t,
        await getGuildMemberRankPosition(guild, memberId, t + time),
      ]) as Promise<[T, number | null]>[],
    ),
  ) as Record<T, number | null>;

  return res;
}

function getTypes(
  myGuild: GuildModel,
): ('textMessage' | 'voiceMinute' | 'invite' | 'vote' | 'bonus' | 'totalScore')[] {
  return [
    myGuild.db.textXp ? 'textMessage' : null,
    myGuild.db.voiceXp ? 'voiceMinute' : null,
    myGuild.db.inviteXp ? 'invite' : null,
    myGuild.db.voteXp ? 'vote' : null,
    myGuild.db.bonusXp ? 'bonus' : null,
    'totalScore',
  ].filter((i) => i !== null) as (
    | 'textMessage'
    | 'voiceMinute'
    | 'invite'
    | 'vote'
    | 'bonus'
    | 'totalScore'
  )[];
}

export default { activeCache };
