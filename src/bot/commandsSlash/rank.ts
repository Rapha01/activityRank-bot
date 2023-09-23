import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  RESTJSONErrorCodes,
  ComponentType,
  type Guild,
  type User,
  type ChatInputCommandInteraction,
  type DiscordAPIError,
  type MessageComponentInteraction,
} from 'discord.js';

import cooldownUtil from '../util/cooldownUtil.js';
import guildModel, { type CachedGuildStore } from '../models/guild/guildModel.js';
import guildMemberModel from '../models/guild/guildMemberModel.js';
import rankModel from '../models/rankModel.js';
import fct from '../../util/fct.js';
import nameUtil from '../util/nameUtil.js';
import userModel from '../models/userModel.js';
import { registerComponent, registerSlashCommand } from 'bot/util/commandLoader.js';

type MyGuild = CachedGuildStore; // temp

type TimeInterval = 'Alltime' | 'Year' | 'Month' | 'Week' | 'Day';

interface CacheInstance {
  window: 'rank' | 'topChannels';
  time: TimeInterval;
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

    await guildMemberModel.cache.load(i.member);

    if (!(await cooldownUtil.checkStatCommandsCooldown(i))) return;

    const myGuild = await guildModel.storage.get(i.guild);

    const targetUser = i.options.getUser('member') ?? i.user;

    await userModel.cache.load(targetUser);

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
  async callback(interaction, data) {
    await execCacheSet(interaction, 'page', data.page);
  },
});

const windowId = registerComponent<CacheInstance['window']>({
  identifier: 'rank.window',
  type: ComponentType.Button,
  async callback(interaction, window) {
    await execCacheSet(interaction, 'window', window);
  },
});

const timeId = registerComponent({
  identifier: 'rank.time',
  type: ComponentType.StringSelect,
  async callback(interaction) {
    const time = interaction.values[0];
    await execCacheSet(interaction, 'time', time as TimeInterval);
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

  if (cachedMessage.owner !== interaction.user.id) {
    await interaction.reply({
      content: "Sorry, this menu isn't for you.",
      ephemeral: true,
    });
    return;
  }

  const myGuild = await guildModel.storage.get(interaction.guild);

  activeCache.set(interaction.message.id, { ...cachedMessage, [key]: value });

  await interaction.deferUpdate();

  const state = activeCache.get(interaction.message.id);
  await state.interaction.editReply(await generateCard(state, interaction.guild, myGuild));
}

async function generateCard(
  cache: CacheInstance,
  guild: Guild,
  myGuild: MyGuild,
  disabled = false,
) {
  if (cache.window === 'rank') return await generateRankCard(cache, guild, myGuild, disabled);
  if (cache.window === 'topChannels')
    return await generateChannelCard(cache, guild, myGuild, disabled);
}

const _prettifyTime = {
  Day: 'Today',
  Week: 'This week',
  Month: 'This month',
  Year: 'This year',
  Alltime: 'Forever',
};

async function generateChannelCard(
  state: CacheInstance,
  guild: Guild,
  myGuild: MyGuild,
  disabled: boolean,
) {
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

function getChannelComponents(state: CacheInstance, disabled: boolean) {
  return [
    ...getGlobalComponents(state.window, state.time, disabled),
    getPaginationComponents(state.page, disabled),
  ];
}

function getPaginationComponents(page: number, disabled: boolean) {
  return new ActionRowBuilder().setComponents(
    new ButtonBuilder()
      .setEmoji('⬅')
      // TODO: use ownerId here
      .setCustomId(pageId({ page: page - 1 }))
      // .setCustomId(`rank page ${page - 1}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1 || disabled),
    new ButtonBuilder()
      .setLabel(page.toString())
      .setCustomId('__THROW__')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setEmoji('➡️')
      .setCustomId(pageId({ page: page + 1 }))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );
}

async function getTopChannels(
  page: { from: number; to: number },
  guild: Guild,
  memberId: string,
  time: TimeInterval,
  type,
) {
  const guildMemberTopChannels = await rankModel.getGuildMemberTopChannels(
    guild,
    memberId,
    type,
    time,
    page.from,
    page.to,
  );

  if (!guildMemberTopChannels || guildMemberTopChannels.length == 0)
    return 'No entries found for this page.';

  const channelMention = (index) =>
    nameUtil.getChannelMention(guild.channels.cache, guildMemberTopChannels[index].channelId);
  const emoji = type === 'voiceMinute' ? ':microphone2:' : ':writing_hand:';
  const channelValue = (index) =>
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
  myGuild: MyGuild,
  disabled = false,
) {
  const rank = await rankModel.getGuildMemberRank(guild, state.targetUser.id);
  const positions = await getPositions(
    guild,
    state.targetUser.id,
    getTypes(guild.appData),
    state.time,
  );

  const guildMemberInfo = await nameUtil.getGuildMemberInfo(guild, state.targetUser.id);
  const levelProgression = fct.getLevelProgression(
    rank.totalScoreAlltime,
    guild.appData.levelFactor,
  );

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${state.time} stats on server ${guild.name}` })
    .setColor('#4fd6c8')
    .setThumbnail(state.targetUser.avatarURL({ dynamic: true }));

  if (myGuild.bonusUntilDate > Date.now() / 1000) {
    embed.setDescription(
      `**!! Bonus XP Active !!** (${Math.round(
        (((myGuild.bonusUntilDate - Date.now() / 1000) / 60 / 60) * 10) / 10,
      )}h left) \n`,
    );
  }

  const infoStrings = [
    `Total XP: ${Math.round(rank['totalScore' + state.time])} (#${positions.totalScore})`,
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
      value: getScoreStrings(guild.appData, myGuild, rank, positions, state.time),
    },
  );

  return {
    embeds: [embed],
    components: getRankComponents(state, disabled),
  };
}

function ParsedButton(selected: boolean, disabled: boolean) {
  return new ButtonBuilder()
    .setStyle(selected ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setDisabled(disabled || selected);
}

function getGlobalComponents(
  window: CacheInstance['window'],
  time: TimeInterval,
  disabled: boolean,
) {
  return [
    new ActionRowBuilder().setComponents(
      ParsedButton(window === 'rank', disabled)
        // .setCustomId('rank window rank')
        .setCustomId(windowId('rank'))
        .setLabel('Stats'),
      ParsedButton(window === 'topChannels', disabled)
        .setCustomId(windowId('topChannels'))
        .setLabel('Top Channels'),
    ),
    new ActionRowBuilder().setComponents(
      new StringSelectMenuBuilder()
        .setCustomId(timeId())
        .setDisabled(disabled)
        .setOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Alltime')
            .setValue('Alltime')
            .setDefault(time === 'Alltime'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Year')
            .setValue('Year')
            .setDefault(time === 'Year'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Month')
            .setValue('Month')
            .setDefault(time === 'Month'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Week')
            .setValue('Week')
            .setDefault(time === 'Week'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Day')
            .setValue('Day')
            .setDefault(time === 'Day'),
        ),
    ),
  ];
}

function getRankComponents(state: CacheInstance, disabled: boolean) {
  return [...getGlobalComponents(state.window, state.time, disabled)];
}

function getScoreStrings(appData, myGuild: MyGuild, ranks, positions, time: TimeInterval) {
  const scoreStrings = [];
  if (appData.textXp)
    scoreStrings.push(`:writing_hand: ${ranks['textMessage' + time]} (#${positions.textMessage})`);
  if (appData.voiceXp)
    scoreStrings.push(
      `:microphone2: ${Math.round((ranks['voiceMinute' + time] / 60) * 10) / 10} (#${
        positions.voiceMinute
      })`,
    );
  if (appData.inviteXp)
    scoreStrings.push(`:envelope: ${ranks['invite' + time]} (#${positions.invite})`);
  if (appData.voteXp)
    scoreStrings.push(`${myGuild.voteEmote} ${ranks['vote' + time]} (#${positions.vote})`);
  if (appData.bonusXp)
    scoreStrings.push(`${myGuild.bonusEmote} ${ranks['bonus' + time]} (#${positions.bonus})`);

  return scoreStrings.join('\n');
}

async function getPositions(guild: Guild, memberId: string, types, time: TimeInterval) {
  const res = {};
  for (const p of types)
    res[p] = await rankModel.getGuildMemberRankPosition(guild, memberId, p + time);
  return res;
}

function getTypes(appData) {
  return [
    appData.textXp ? 'textMessage' : null,
    appData.voiceXp ? 'voiceMinute' : null,
    appData.inviteXp ? 'invite' : null,
    appData.voteXp ? 'vote' : null,
    appData.bonusXp ? 'bonus' : null,
    'totalScore',
  ].filter((i) => i !== null);
}

export default { activeCache };
