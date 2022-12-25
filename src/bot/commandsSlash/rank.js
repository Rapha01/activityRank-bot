const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');
const cooldownUtil = require('../util/cooldownUtil.js');
const guildModel = require('../models/guild/guildModel.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const rankModel = require('../models/rankModel.js');
const fct = require('../../util/fct.js');
const nameUtil = require('../util/nameUtil.js');
const userModel = require('../models/userModel.js');

module.exports.activeCache = new Map();

module.exports.data = new SlashCommandBuilder()
  .setName('rank')
  .setDescription("Find your or another member's rank")
  .addUserOption((o) =>
    o.setName('member').setDescription('The member to check the rank of')
  );

module.exports.execute = async (i) => {
  await i.deferReply();

  await guildMemberModel.cache.load(i.member);

  if (!(await cooldownUtil.checkStatCommandsCooldown(i))) return;

  const myGuild = await guildModel.storage.get(i.guild);

  const targetUser = i.options.getUser('member') ?? i.user;

  await userModel.cache.load(targetUser);

  const initialState = {
    window: 'rank',
    time: 'Alltime',
    owner: i.member.id,
    targetUser,
    page: 1,
    interaction: i,
  };

  const { id } = await i.editReply(
    await generateCard(initialState, i.guild, myGuild)
  );

  const cleanCache = async () => {
    const state = exports.activeCache.get(id);
    exports.activeCache.delete(id);
    try {
      await i.editReply(await generateCard(state, i.guild, myGuild, true));
    } catch (err) {
      if (err.code === 10008)
        // Unknown Message
        console.log('/rank tried to update Unknown message');
      else throw err;
    }
  };
  setTimeout(cleanCache, 5 * 60 * 1_000);

  exports.activeCache.set(id, initialState);
};

module.exports.component = async (i) => {
  const action = i.customId.split(' ')[1];
  let payload = i.customId.split(' ')[2] ?? i.values[0];

  const cachedMessage = exports.activeCache.get(i.message.id);
  if (!cachedMessage)
    return console.log(`Could not find cachedMessage ${i.message.id}`);

  if (cachedMessage.owner !== i.user.id)
    return await i.reply({
      content: "Sorry, this menu isn't for you.",
      ephemeral: true,
    });

  const myGuild = await guildModel.storage.get(i.guild);

  if (action === 'page') payload = parseInt(payload);

  exports.activeCache.set(i.message.id, {
    ...cachedMessage,
    [action]: payload,
  });

  await i.deferUpdate();

  const state = exports.activeCache.get(i.message.id);
  await state.interaction.editReply(
    await generateCard(state, i.guild, myGuild)
  );
};

async function generateCard(cache, guild, myGuild, disabled = false) {
  if (cache.window === 'rank')
    return await generateRankCard(cache, guild, myGuild, disabled);
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

async function generateChannelCard(state, guild, myGuild, disabled) {
  const page = fct.extractPageSimple(state.page ?? 1, myGuild.entriesPerPage);

  const guildMemberInfo = await nameUtil.getGuildMemberInfo(
    guild,
    state.targetUser.id
  );

  const header = `Channel toplist for ${guildMemberInfo.name} | ${
    _prettifyTime[state.time]
  }`;

  const embed = new EmbedBuilder()
    .setTitle(header)
    .setColor('#4fd6c8')
    .addFields(
      {
        name: 'Text',
        value: await getTopChannels(
          page,
          guild,
          state.targetUser.id,
          state.time,
          'textMessage'
        ),
        inline: true,
      },
      {
        name: 'Voice',
        value: await getTopChannels(
          page,
          guild,
          state.targetUser.id,
          state.time,
          'voiceMinute'
        ),
        inline: true,
      }
    );

  return {
    embeds: [embed],
    components: getChannelComponents(state, disabled),
  };
}

function getChannelComponents(state, disabled) {
  return [
    ...getGlobalComponents(state.window, state.time, disabled),
    getPaginationComponents(state.page, disabled),
  ];
}

function getPaginationComponents(page, disabled) {
  return new ActionRowBuilder().setComponents(
    new ButtonBuilder()
      .setEmoji('⬅')
      .setCustomId(`rank page ${page - 1}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1 || disabled),
    new ButtonBuilder()
      .setLabel(page.toString())
      .setCustomId('rank shouldNeverCall')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setEmoji('➡️')
      .setCustomId(`rank page ${page + 1}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  );
}

async function getTopChannels(page, guild, memberId, time, type) {
  const guildMemberTopChannels = await rankModel.getGuildMemberTopChannels(
    guild,
    memberId,
    type,
    time,
    page.from,
    page.to
  );

  if (!guildMemberTopChannels || guildMemberTopChannels.length == 0)
    return 'No entries found for this page.';

  const channelMention = (index) =>
    nameUtil.getChannelMention(
      guild.channels.cache,
      guildMemberTopChannels[index].channelId
    );
  const emoji = type === 'voiceMinute' ? ':microphone2:' : ':writing_hand:';
  const channelValue = (index) =>
    type === 'voiceMinute'
      ? Math.round((guildMemberTopChannels[index][time] / 60) * 10) / 10
      : guildMemberTopChannels[index][time];

  const s = [];
  for (let i = 0; i < guildMemberTopChannels.length; i++)
    s.push(
      `#${page.from + i} | ${channelMention(i)} ⇒ ${emoji} ${channelValue(i)}`
    );

  return s.join('\n');
}

async function generateRankCard(state, guild, myGuild, disabled = false) {
  const rank = await rankModel.getGuildMemberRank(guild, state.targetUser.id);
  const positions = await getPositions(
    guild,
    state.targetUser.id,
    getTypes(guild.appData),
    state.time
  );

  const guildMemberInfo = await nameUtil.getGuildMemberInfo(
    guild,
    state.targetUser.id
  );
  const levelProgression = fct.getLevelProgression(
    rank.totalScoreAlltime,
    guild.appData.levelFactor
  );

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${state.time} stats on server ${guild.name}` })
    .setColor('#4fd6c8')
    .setThumbnail(state.targetUser.avatarURL({ dynamic: true }));

  if (myGuild.bonusUntilDate > Date.now() / 1000) {
    embed.setDescription(
      `**!! Bonus XP Active !!** (${Math.round(
        (((myGuild.bonusUntilDate - Date.now() / 1000) / 60 / 60) * 10) / 10
      )}h left) \n`
    );
  }

  const infoStrings = [
    `Total XP: ${Math.round(rank['totalScore' + state.time])} (#${
      positions.totalScore
    })`,
    `Next Level: ${Math.floor((levelProgression % 1) * 100)}%`,
  ].join('\n');

  embed.addFields(
    {
      name: `#${positions.totalScore} **${
        guildMemberInfo.name
      }** 🎖 ${Math.floor(levelProgression)}`,
      value: infoStrings,
    },
    {
      name: 'Stats',
      value: getScoreStrings(
        guild.appData,
        myGuild,
        rank,
        positions,
        state.time
      ),
    }
  );

  return {
    embeds: [embed],
    components: getRankComponents(state, disabled),
  };
}

function ParsedButton(selected, disabled) {
  return new ButtonBuilder()
    .setStyle(selected ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setDisabled(disabled ? true : selected);
}

function getGlobalComponents(window, time, disabled) {
  return [
    new ActionRowBuilder().setComponents(
      ParsedButton(window === 'rank', disabled)
        .setCustomId('rank window rank')
        .setLabel('Stats'),
      ParsedButton(window === 'topChannels', disabled)
        .setCustomId('rank window topChannels')
        .setLabel('Top Channels')
    ),
    new ActionRowBuilder().setComponents(
      new StringSelectMenuBuilder()
        .setCustomId('rank time')
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
            .setDefault(time === 'Day')
        )
    ),
  ];
}

function getRankComponents(state, disabled) {
  return [...getGlobalComponents(state.window, state.time, disabled)];
}

function getScoreStrings(appData, myGuild, ranks, positions, time) {
  const scoreStrings = [];
  if (appData.textXp)
    scoreStrings.push(
      `:writing_hand: ${ranks['textMessage' + time]} (#${
        positions.textMessage
      })`
    );
  if (appData.voiceXp)
    scoreStrings.push(
      `:microphone2: ${
        Math.round((ranks['voiceMinute' + time] / 60) * 10) / 10
      } (#${positions.voiceMinute})`
    );
  if (appData.inviteXp)
    scoreStrings.push(
      `:envelope: ${ranks['invite' + time]} (#${positions.invite})`
    );
  if (appData.voteXp)
    scoreStrings.push(
      `${myGuild.voteEmote} ${ranks['vote' + time]} (#${positions.vote})`
    );
  if (appData.bonusXp)
    scoreStrings.push(
      `${myGuild.bonusEmote} ${ranks['bonus' + time]} (#${positions.bonus})`
    );

  return scoreStrings.join('\n');
}

async function getPositions(guild, memberId, types, time) {
  const res = {};
  for (const p of types)
    res[p] = await rankModel.getGuildMemberRankPosition(
      guild,
      memberId,
      p + time
    );
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
