import guildMemberModel from '../models/guild/guildMemberModel.js';
import guildModel from '../models/guild/guildModel.js';
import rankModel from '../models/rankModel.js';
import fct, { type Pagination } from '../../util/fct.js';
import cooldownUtil from '../util/cooldownUtil.js';
import nameUtil, { getGuildMemberNamesWithRanks } from '../util/nameUtil.js';

import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonStyle,
  ChannelType,
  RESTJSONErrorCodes,
  ComponentType,
  type DiscordAPIError,
  type MessageComponentInteraction,
  type ChatInputCommandInteraction,
  type Guild,
  type InteractionEditReplyOptions,
  type GuildChannel,
  type ActionRowData,
  type MessageActionRowComponentData,
} from 'discord.js';
import { ComponentKey, registerComponent, registerSlashCommand } from 'bot/util/commandLoader.js';
import { statTimeIntervals, type StatTimeInterval, type StatType } from 'models/types/enums.js';
import type { guild } from 'models/types/shard.js';

const _prettifyTime = {
  Day: 'Today',
  Week: 'This week',
  Month: 'This month',
  Year: 'This year',
  Alltime: 'Forever',
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
  owner: string;
  page: number;
  orderType: OrderType;
  interaction: ChatInputCommandInteraction<'cached'>;
  channel?: GuildChannel;
}

registerSlashCommand({
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Toplists for the server')
    .setDMPermission(false),
  async execute(interaction) {
    await interaction.deferReply();

    await guildModel.cache.load(interaction.guild);
    await guildMemberModel.cache.load(interaction.member);

    const myGuild = await guildModel.storage.get(interaction.guild);

    if (!(await cooldownUtil.checkStatCommandsCooldown(interaction))) return;

    const initialState: CacheInstance = {
      window: 'members',
      time: 'Alltime',
      owner: interaction.member.id,
      page: 1,
      orderType: 'allScores',
      interaction,
    };

    const { id } = await interaction.editReply(
      await generate(initialState, interaction.guild, myGuild!),
    );

    const cleanCache = async () => {
      const state = activeCache.get(id);
      activeCache.delete(id);
      if (!interaction.guild)
        return interaction.client.logger.debug(
          { interaction },
          '/top tried to update uncached guild',
        );
      try {
        await interaction.editReply(await generate(state!, interaction.guild, myGuild!, true));
      } catch (_err) {
        const err = _err as DiscordAPIError;
        if (err.code === RESTJSONErrorCodes.UnknownMessage)
          interaction.client.logger.debug({ interaction }, '/top tried to update unknown message');
        else throw err;
      }
    };
    setTimeout(cleanCache, 5 * 60 * 1_000);

    activeCache.set(id, initialState);
  },
});

const setWindow = registerComponent({
  identifier: 'top.window',
  type: ComponentType.StringSelect,
  async callback(interaction) {
    await execCacheSet(interaction, 'window', interaction.values[0] as Window);
  },
});

const setTime = registerComponent({
  identifier: 'top.time',
  type: ComponentType.StringSelect,
  async callback(interaction) {
    await execCacheSet(interaction, 'time', interaction.values[0] as StatTimeInterval);
  },
});

const setOrdertype = registerComponent({
  identifier: 'top.otype',
  type: ComponentType.StringSelect,
  async callback(interaction) {
    await execCacheSet(interaction, 'orderType', interaction.values[0] as OrderType);
  },
});

const setChannel = registerComponent({
  identifier: 'top.channel',
  type: ComponentType.ChannelSelect,
  async callback(interaction) {
    await execCacheSet(interaction, 'channel', interaction.channels.first() as GuildChannel);
  },
});

const setPage = registerComponent<{ page: number }>({
  identifier: 'top.page',
  type: ComponentType.Button,
  async callback(interaction, { page }) {
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

  const myGuild = await guildModel.storage.get(interaction.guild);

  activeCache.set(interaction.message.id, { ...cachedMessage, [key]: value });

  await interaction.deferUpdate();

  const state = activeCache.get(interaction.message.id);
  await state!.interaction.editReply(await generate(state!, interaction.guild, myGuild!));
}

async function generate(
  state: CacheInstance,
  guild: Guild,
  myGuild: guild,
  disabled = false,
): Promise<InteractionEditReplyOptions> {
  if (state.window === 'channelMembers')
    return await generateChannelMembers(state, guild, myGuild, disabled);
  if (state.window === 'members')
    return await generateGuildMembers(state, guild, myGuild, disabled);
  if (state.window === 'channels') return await generateChannels(state, guild, myGuild, disabled);
  throw new Error('unknown window');
}

async function generateChannels(
  state: CacheInstance,
  guild: Guild,
  myGuild: guild,
  disabled: boolean,
) {
  const page = fct.extractPageSimple(state.page ?? 1, myGuild.entriesPerPage);

  const header = `Toplist channels in ${guild.name} | ${_prettifyTime[state.time]}`;

  const embed = new EmbedBuilder()
    .setTitle(header)
    .setColor('#4fd6c8')
    .addFields(
      {
        name: 'Text',
        value: (await getTopChannels(guild, 'textMessage', state.time, page)).slice(0, 1024),
        inline: true,
      },
      {
        name: 'Voice',
        value: (await getTopChannels(guild, 'voiceMinute', state.time, page)).slice(0, 1024),
        inline: true,
      },
    );

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
  const channelRanks = await rankModel.getChannelRanks(guild, type, time, page.from, page.to);
  if (!channelRanks || channelRanks.length == 0) return 'No entries found for this page.';

  const channelMention = (index: number) =>
    nameUtil.getChannelMention(guild.channels.cache, channelRanks[index].channelId);
  const emoji = type === 'voiceMinute' ? ':microphone2:' : ':writing_hand:';
  const channelValue = (index: number) =>
    type === 'voiceMinute'
      ? Math.round((channelRanks[index][time] / 60) * 10) / 10
      : channelRanks[index][time];

  const s = [];
  for (let i = 0; i < channelRanks.length; i++)
    s.push(`#${page.from + i} | ${channelMention(i)} ⇒ ${emoji} ${channelValue(i)}`);

  return s.join('\n');
}

async function generateChannelMembers(
  state: CacheInstance,
  guild: Guild,
  myGuild: guild,
  disabled: boolean,
) {
  if (!state.channel) {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`Toplist | ${_prettifyTime[state.time]}`)
          .setColor('#4fd6c8')
          .setDescription('Select a channel.')
          .toJSON(),
      ],
      components: getChannelMembersComponents(state, disabled),
    };
  }

  const type = state.channel.type === ChannelType.GuildVoice ? 'voiceMinute' : 'textMessage';

  const page = fct.extractPageSimple(state.page ?? 1, myGuild.entriesPerPage);

  const header = `Toplist for channel ${state.channel.name} | ${_prettifyTime[state.time]}`;

  const channelMemberRanks = await rankModel.getChannelMemberRanks(
    guild,
    state.channel.id,
    type,
    state.time,
    page.from,
    page.to,
  );

  if (!channelMemberRanks || channelMemberRanks.length == 0) {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(header)
          .setColor('#4fd6c8')
          .setDescription('No entries found for this page.'),
      ],
      components: getChannelMembersComponents(state, disabled),
    };
  }

  await nameUtil.addGuildMemberNamesToRanks(guild, channelMemberRanks);

  const e = new EmbedBuilder().setTitle(header).setColor('#4fd6c8');

  if (guild.appData.bonusUntilDate > Date.now() / 1000)
    e.setDescription(`**!! Bonus XP Active !!** (ends <t:${guild.appData.bonusUntilDate}:R>)`);

  let str = '',
    guildMemberName;

  for (let i = 0; i < channelMemberRanks.length; i++) {
    if (type == 'voiceMinute')
      str = ':microphone2: ' + Math.round((channelMemberRanks[i][state.time] / 60) * 10) / 10;
    else str = ':writing_hand: ' + channelMemberRanks[i][state.time];

    guildMemberName = (await nameUtil.getGuildMemberInfo(guild, channelMemberRanks[i].userId)).name;
    e.addFields({
      name: `#${page.from + i}  ${guildMemberName}`,
      value: str,
      inline: true,
    });
  }

  return {
    embeds: [e.toJSON()],
    components: getChannelMembersComponents(state, disabled),
  };
}

async function generateGuildMembers(
  state: CacheInstance,
  guild: Guild,
  myGuild: guild,
  disabled: boolean,
) {
  const page = fct.extractPageSimple(state.page ?? 1, myGuild.entriesPerPage);

  let header = `Toplist for server ${guild.name} | ${_prettifyTime[state.time]}`;

  if (state.orderType === 'voiceMinute') header += ' | By voice (hours)';
  else if (state.orderType === 'textMessage') header += ' | By text (messages)';
  else if (state.orderType === 'invite') header += ' | By invites';
  else if (state.orderType === 'vote') header += ' | By ' + myGuild.voteTag;
  else if (state.orderType === 'bonus') header += ' | By ' + myGuild.bonusTag;
  else if (state.orderType === 'totalScore' || state.orderType === 'allScores')
    header += ' | By total XP';

  const memberRanks = await rankModel.getGuildMemberRanks(
    guild,
    state.orderType === 'allScores' ? 'totalScore' : state.orderType,
    state.time,
    page.from,
    page.to,
  );

  if (!memberRanks || memberRanks.length === 0) {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(header)
          .setColor('#4fd6c8')
          .setDescription('No entries found for this page.'),
      ],
      components: getMembersComponents(state, disabled),
    };
  }

  const memberRanksWithNames = await getGuildMemberNamesWithRanks(guild, memberRanks);

  const e = new EmbedBuilder().setTitle(header).setColor('#4fd6c8');

  if (guild.appData.bonusUntilDate > Date.now() / 1000)
    e.setDescription(`**!! Bonus XP Active !!** (ends <t:${guild.appData.bonusUntilDate}:R>)`);

  let i = 0;
  while (memberRanksWithNames.length > 0) {
    const memberRank = memberRanksWithNames.shift()!;

    const getScoreString = (type: StatType, time: StatTimeInterval) => {
      if (type === 'textMessage' && guild.appData.textXp)
        return `:writing_hand: ${memberRank[`textMessage${time}`]}`;
      if (type === 'voiceMinute' && guild.appData.voiceXp)
        return `:microphone2: ${Math.round((memberRank[`voiceMinute${time}`] / 60) * 10) / 10}`;
      if (type === 'invite' && guild.appData.inviteXp)
        return `:envelope: ${memberRank[`invite${time}`]}`;
      if (type === 'vote' && guild.appData.voteXp)
        return `${myGuild.voteEmote} ${memberRank[`vote${time}`]}`;
      if (type === 'bonus' && guild.appData.bonusXp)
        return `${myGuild.bonusEmote} ${memberRank[`bonus${time}`]}`;
      return null;
    };

    const scoreStrings = [
      getScoreString('textMessage', state.time),
      getScoreString('voiceMinute', state.time),
      getScoreString('invite', state.time),
      getScoreString('vote', state.time),
      getScoreString('bonus', state.time),
    ].filter((s) => s);

    const getFieldScoreString = (
      type: StatType | 'totalScore' | 'allScores',
      time: StatTimeInterval,
    ) => {
      if (type === 'totalScore') return '';
      else if (type === 'allScores') return `🔸 ${scoreStrings.join(' | ')}`;
      else return `🔸 ${getScoreString(type, time)}`;
    };

    e.addFields({
      name: `**#${page.from + i} ${memberRank.name}** \\🎖 ${Math.floor(
        memberRank.levelProgression,
      )}`,
      value: `Total: ${memberRank[`totalScore${state.time}`]} XP ${getFieldScoreString(
        state.orderType,
        state.time,
      )}`,
    });
    i++;
  }

  return {
    embeds: [e],
    components: getMembersComponents(state, disabled),
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
          type: ComponentType.StringSelect,
          disabled,
          customId: setWindow(null, { ownerId: state.owner }),
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
      ],
    },
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.StringSelect,
          disabled,
          customId: setTime(null, { ownerId: state.owner }),
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
        customId: setPage({ page: state.page - 1 }, { ownerId: state.owner }),
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
        customId: setPage({ page: state.page + 1 }, { ownerId: state.owner }),
        style: ButtonStyle.Secondary,
        disabled: disabled,
      },
    ],
  };
}

function getMembersComponents(
  state: CacheInstance,
  disabled: boolean,
): ActionRowData<MessageActionRowComponentData>[] {
  return [
    ...getGlobalComponents(state, disabled),
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.StringSelect,
          disabled,
          customId: setOrdertype(null, { ownerId: state.owner }),
          options: [
            { label: 'All', value: 'allScores', default: state.orderType === 'allScores' },
            { label: 'Total', value: 'totalScore', default: state.orderType === 'totalScore' },
            { label: 'Messages', value: 'textMessage', default: state.orderType === 'textMessage' },
            {
              label: 'Voice time',
              value: 'voiceMinute',
              default: state.orderType === 'voiceMinute',
            },
            { label: 'Invites', value: 'invite', default: state.orderType === 'invite' },
            { label: 'Upvotes', value: 'vote', default: state.orderType === 'vote' },
            { label: 'Bonus', value: 'bonus', default: state.orderType === 'bonus' },
          ],
        },
      ],
    },
    getPaginationComponents(state, disabled),
    /*
    TODO
    BLOCKED(d.js 14.8): Deselection kills bot process
    new ActionRowBuilder().setComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('top channel')
        .setDisabled(disabled)
        .setChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildVoice,
          ChannelType.GuildAnnouncement,
          ChannelType.GuildForum,
        )
        .setMinValues(0)
        .setMaxValues(1),
    ), */
  ];
}

function getChannelMembersComponents(
  state: CacheInstance,
  disabled: boolean,
): ActionRowData<MessageActionRowComponentData>[] {
  return [
    ...getGlobalComponents(state, disabled),
    {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.ChannelSelect,
          customId: setChannel(null, { ownerId: state.owner }),
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
      ],
    },
    getPaginationComponents(state, disabled),
  ];
}

function getChannelComponents(state: CacheInstance, disabled: boolean) {
  return [...getGlobalComponents(state, disabled), getPaginationComponents(state, disabled)];
}

export const sendMembersEmbed = async (
  i: ChatInputCommandInteraction<'cached'>,
  type: StatType,
) => {
  await i.deferReply();
  await guildMemberModel.cache.load(i.member);
  const guild = await guildModel.storage.get(i.guild);

  if (!(await cooldownUtil.checkStatCommandsCooldown(i))) return;

  const page = fct.extractPageSimple(i.options.getInteger('page') || 1, guild!.entriesPerPage);
  const time = (i.options.getString('period') || 'Alltime') as keyof typeof _prettifyTime;

  let header = `Toplist for server ${i.guild.name} from ${page.from} to ${page.to} | ${_prettifyTime[time]}`;

  if (type === 'voiceMinute') header += ' | By voice (hours)';
  else if (type === 'textMessage') header += ' | By text (messages)';
  else if (type === 'invite') header += ' | By invites';
  else if (type === 'vote') header += ' | By ' + guild!.voteTag;
  else if (type === 'bonus') header += ' | By ' + guild!.bonusTag;
  else header += ' | By total XP';

  const memberRanks = await rankModel.getGuildMemberRanks(i.guild, type, time, page.from, page.to);
  if (!memberRanks || memberRanks.length == 0) {
    return await i.editReply({ content: 'No entries found for this page.' });
  }

  const memberRanksWithNames = await getGuildMemberNamesWithRanks(i.guild, memberRanks);

  const e = new EmbedBuilder().setTitle(header).setColor('#4fd6c8');

  if (guild!.bonusUntilDate > Date.now() / 1000)
    e.setDescription(`**!! Bonus XP Active !!** (ends <t:${guild!.bonusUntilDate}:R> \n`);

  if (i.client.appData.settings.footer) e.setFooter({ text: i.client.appData.settings.footer });

  let iter = 0;
  while (memberRanksWithNames.length > 0) {
    const scoreStrings = [];
    const memberRank = memberRanksWithNames.shift()!;

    if (i.guild.appData.textXp)
      scoreStrings.push(`:writing_hand: ${memberRank[`textMessage${time}`]}`);
    if (i.guild.appData.voiceXp)
      scoreStrings.push(
        `:microphone2: ${Math.round((memberRank[`voiceMinute${time}`] / 60) * 10) / 10}`,
      );
    if (i.guild.appData.inviteXp) scoreStrings.push(`:envelope: ${memberRank[`invite${time}`]}`);
    if (i.guild.appData.voteXp)
      scoreStrings.push(guild!.voteEmote + ' ' + memberRank[`vote${time}`]);
    if (i.guild.appData.bonusXp)
      scoreStrings.push(guild!.bonusEmote + ' ' + memberRank[`bonus${time}`]);
    e.addFields({
      name: `**#${page.from + iter} ${memberRank.name}** \\🎖 ${Math.floor(
        memberRank.levelProgression,
      )}`,
      value: `${memberRank[`totalScore${time}`]} XP \\⬄ ${scoreStrings.join(
        ':black_small_square:',
      )}`,
    });
    iter++;
  }

  await i.editReply({
    embeds: [e],
  });
};
