const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');
const guildModel = require('../models/guild/guildModel.js');
const { stripIndent } = require('common-tags');
const guildChannelModel = require('../models/guild/guildChannelModel.js');
const guildRoleModel = require('../models/guild/guildRoleModel.js');
const fct = require('../../util/fct.js');
const nameUtil = require('../util/nameUtil.js');
const { botInviteLink } = require('../../const/config.js');


module.exports.data = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('Information about your server!');

const embeds = {
  'general': info,
  'levels': levels,
  'roles': roles,
  'nocommandchannels': noCommandChannels,
  'noxpchannels': noXpChannels,
  'noxproles': noXpRoles,
  'messages': messages,
  'permissions': permissions,
};

const rows = (type, page, memberId) => {
  const paginationDisabled = ['general', 'permissions'].includes(type);
  page = Number(page);
  return [
    new MessageActionRow().addComponents(new MessageSelectMenu()
      .setCustomId(`commandsSlash/serverinfo.js ${type} ${page}`)
      .addOptions([
        { label: 'General', value: 'general' },
        { label: 'Levels', value: 'levels' },
        { label: 'Roles', value: 'roles' },
        { label: 'No Command Channels', value: 'nocommandchannels' },
        { label: 'Noxp Channels', value: 'noxpchannels' },
        { label: 'Noxp Roles', value: 'noxproles' },
        { label: 'Autosend Messages', value: 'messages' },
        { label: 'Permissions', value: 'permissions' },
      ])),
    new MessageActionRow().addComponents(
      new MessageButton()
        .setEmoji('⬅')
        .setCustomId('commandsSlash/serverinfo.js -1')
        .setStyle('PRIMARY')
        .setDisabled(paginationDisabled || page < 2),
      new MessageButton()
        .setLabel(paginationDisabled ? '-' : page.toString())
        .setCustomId('commandsSlash/serverinfo.js')
        .setStyle('SECONDARY')
        .setDisabled(true),
      new MessageButton()
        .setEmoji('➡️')
        .setCustomId('commandsSlash/serverinfo.js 1')
        .setStyle('PRIMARY')
        .setDisabled(paginationDisabled || page > 100),
    ),
    new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel('Close')
        .setStyle('DANGER')
        .setCustomId(`commandsSlash/serverinfo.js ${memberId} closeMenu`),
    ),
  ];
};

module.exports.execute = async (i) => {
  const myGuild = await guildModel.storage.get(i.guild);
  const page = fct.extractPageSimple(i.options.getInteger('page') ?? 1, myGuild.entriesPerPage);

  const embed = await embeds['general'](i, myGuild, page.from, page.to);

  await i.reply({
    embeds: [embed],
    components: rows('general', '1', i.member.id),
  });
};

module.exports.component = async function(i) {
  const [, memberId] = i.message.components[2].components[0].customId.split(' ');
  if (memberId !== i.member.id)
    return await i.reply({ content: 'Sorry, this menu isn\'t for you.', ephemeral: true });

  if (i.isSelectMenu()) {
    const [, , p] = i.customId.split(' ');

    const myGuild = await guildModel.storage.get(i.guild);
    const page = fct.extractPageSimple(Number(p), myGuild.entriesPerPage);

    const embed = await embeds[i.values[0]](i, myGuild, page.from, page.to);

    return await i.update({
      embeds: [embed],
      components: rows(i.values[0], p, memberId),
    });
  }
  let [, inc, close] = i.customId.split(' ');

  if (type === 'closeMenu') {
    await i.deferUpdate();
    return await i.deleteReply();
  }

  inc = Number(inc);

  const [, type, p] = i.message.components[0].components[0].customId.split(' ');

  const myGuild = await guildModel.storage.get(i.guild);
  const page = fct.extractPageSimple(Number(p) + inc, myGuild.entriesPerPage);

  const embed = await embeds[type](i, myGuild, page.from, page.to);
  return await i.update({
    embeds: [embed],
    components: rows(type, Number(p) + inc, memberId),
  });
};


async function info(i, myGuild) {
  const e = new MessageEmbed()
    .setAuthor({ name: `Info for server ${i.guild.name}` })
    .setColor('#4fd6c8')
    .setThumbnail(i.guild.iconURL)
    .setFooter(i.client.appData.settings.footer ? i.client.appData.settings.footer : '');

  e.addField('**General**',
    stripIndent`
    Tracking since: <t:${myGuild.addDate}>
    Tracking stats: ${
  (myGuild.textXp ? ':writing_hand: ' : '') +
      (myGuild.voiceXp ? ':microphone2: ' : '') +
      (myGuild.inviteXp ? ':envelope: ' : '') +
      (myGuild.voteXp ? myGuild.voteEmote + ' ' : '') +
      (myGuild.bonusXp ? myGuild.bonusEmote + ' ' : '')
}
    Notify levelup via direct message: ${myGuild.notifyLevelupDm ? 'Yes' : 'No'}
    Notify levelup in the current channel: ${myGuild.notifyLevelupCurrentChannel ? 'Yes' : 'No'}
    Notify levelup in a specific channel: ${
  myGuild.autopost_levelup ? '#' + nameUtil.getChannelName(i.guild.channels.cache, myGuild.autopost_levelup) : 'No'
}
    Notify levelup (dm and channel) with new roles: ${myGuild.notifyLevelupWithRole ? 'Yes' : 'No'}
    Take away assigned roles on level down: ${myGuild.takeAwayAssignedRolesOnLevelDown ? 'Yes' : 'No'}
    List entries per page ${myGuild.entriesPerPage}
    Status: ${fct.isPremiumGuild(i.guild) ? 'Premium' : 'Not Premium'}`,
  );
  e.addField('**Tokens**',
    stripIndent`
    Available: ${i.guild.appData.tokens} (burning ${Math.floor(fct.getTokensToBurn24h(i.guild.memberCount))} / 24h)
    Burned: ${myGuild.tokensBurned}`);

  let bonusTimeString = '';
  if (myGuild.bonusUntilDate > Date.now() / 1000) {
    bonusTimeString = `**!! Bonus XP Active !!** (ends <t:${myGuild.bonusUntilDate}:R>)
    ${myGuild.bonusPerTextMessage * myGuild.xpPerBonus} Bonus XP per textmessage
    ${myGuild.bonusPerVoiceMinute * myGuild.xpPerBonus} Bonus XP per voiceminute
    ${myGuild.bonusPerVote * myGuild.xpPerBonus} Bonus XP for ${myGuild.voteTag}`;
  }

  let xpPerString = '';
  if (i.guild.appData.textXp)
    xpPerString += `${myGuild.xpPerTextMessage} XP per textmessage\n`;
  if (i.guild.appData.voiceXp)
    xpPerString += `${myGuild.xpPerVoiceMinute} XP per voiceminute\n`;
  if (i.guild.appData.voteXp)
    xpPerString += `${myGuild.xpPerVote} XP per ${myGuild.voteTag}\n`;
  if (i.guild.appData.inviteXp)
    xpPerString += `${myGuild.xpPerInvite} XP per invite\n`;

  // eslint-disable-next-line max-len
  const textmessageCooldownString = myGuild.textMessageCooldownSeconds ? `max every ${myGuild.textMessageCooldownSeconds} seconds` : ' without any cooldown';
  e.addField('**Points**',
    stripIndent`
    Vote Cooldown: A user has to wait ${Math.round(myGuild.voteCooldownSeconds / 60)} minutes between each vote
    Text Message Cooldown: Messages give XP ${textmessageCooldownString}
    Muted voice XP allowed: ${myGuild.allowMutedXp ? 'Yes' : 'No'}
    Solo voice XP allowed: ${myGuild.allowSoloXp ? 'Yes' : 'No'}
    Deafened voice XP allowed: ${myGuild.allowDeafenedXp ? 'Yes' : 'No'}
    Levelfactor: ${myGuild.levelFactor} XP
    ${xpPerString} ${bonusTimeString}`,
  );

  return e;
}

async function levels(i, myGuild, from, to) {
  const e = new MessageEmbed()
    .setAuthor({ name: `Levels info from ${from + 1} to ${to + 1}` })
    .setColor('#4fd6c8')
    .setDescription(`XP needed to reach next level (total XP).\nLevelfactor: ${myGuild.levelFactor}.`)
    .setFooter(i.client.appData.settings.footer ? i.client.appData.settings.footer : '');


  let recordingLevels = [], localXp = 100, totalXp = 0;
  for (let iter = 2; iter < to + 2; iter++) {
    localXp = 100 + (iter - 1) * myGuild.levelFactor;
    totalXp += localXp;
    recordingLevels.push({ nr: iter, totalXp: totalXp, localXp: localXp });
  }

  recordingLevels = recordingLevels.slice(from - 1, to);

  for (const level of recordingLevels)
    e.addField(':military_medal:' + level.nr, level.localXp + ' (' + level.totalXp + ')', true);

  return e;
}

async function roles(i, myGuild, from, to) {
  const e = new MessageEmbed()
    .setAuthor({ name: 'Roles info' })
    .setDescription('This server\'s activity roles and their respective levels.')
    .setColor('#4fd6c8')
    .setFooter(i.client.appData.settings.footer ? i.client.appData.settings.footer : '');

  let roleAssignments = await guildRoleModel.storage.getRoleAssignments(i.guild);
  roleAssignments = roleAssignments.slice(from - 1, to);


  for (const myRole of roleAssignments)
    e.addField(nameUtil.getRoleName(i.guild.roles.cache, myRole.roleId), getlevelString(myRole), true);

  if (roleAssignments.length == 0)
    e.setDescription('No roles to show here.');

  return e;
}

function getlevelString(myRole) {
  if (myRole.assignLevel != 0 && myRole.deassignLevel != 0)
    return 'From ' + myRole.assignLevel + ' to ' + myRole.deassignLevel;
  else if (myRole.assignLevel != 0)
    return 'From ' + myRole.assignLevel;
  else if (myRole.deassignLevel != 0)
    return 'Until ' + myRole.deassignLevel;
}

async function noCommandChannels(i, myGuild, from, to) {
  let description = '';
  if (i.guild.appData.commandOnlyChannel != 0) {
    description += ':warning: The commandOnly channel is set. The bot will respond only in channel '
      + nameUtil.getChannelName(i.guild.channels.cache, i.guild.appData.commandOnlyChannel) + '. \n \n';
  }

  description += 'NoCommand channels (does not affect users with manage server permission): \n';
  const e = new MessageEmbed()
    .setAuthor({ name: 'NoCommand channels info' })
    .setColor('#4fd6c8')
    .setFooter(i.client.appData.settings.footer ? i.client.appData.settings.footer : '');

  let noCommandChannelIds = await guildChannelModel.getNoCommandChannelIds(i.guild);
  noCommandChannelIds = noCommandChannelIds.slice(from - 1, to);

  for (const channelId of noCommandChannelIds) {
    e.addField(nameUtil.getChannelTypeIcon(i.guild.channels.cache, channelId),
      nameUtil.getChannelName(i.guild.channels.cache, channelId), true,
    );
  }

  if (noCommandChannelIds.length == 0)
    description += 'No channels to show here.';

  e.setDescription(description);

  return e;
}

async function noXpChannels(i, myGuild, from, to) {
  const e = new MessageEmbed()
    .setAuthor({ name: 'NoXP channels info' })
    .setColor('#4fd6c8')
    .setDescription('Activity in these channels will not give xp.')
    .setFooter(i.client.appData.settings.footer ? i.client.appData.settings.footer : '');

  let noXpChannelIds = await guildChannelModel.getNoXpChannelIds(i.guild);
  noXpChannelIds = noXpChannelIds.slice(from - 1, to);

  for (const channelId of noXpChannelIds) {
    e.addField(nameUtil.getChannelTypeIcon(i.guild.channels.cache, channelId),
      nameUtil.getChannelName(i.guild.channels.cache, channelId), true);
  }

  if (noXpChannelIds.length == 0)
    e.setDescription('No channels to show here.');

  return e;
}

async function noXpRoles(i, myGuild, from, to) {
  const e = new MessageEmbed()
    .setAuthor({ name: 'NoXP roles info' })
    .setColor('#4fd6c8')
    .setDescription('Activity from users with these roles will not give xp.')
    .setFooter(i.client.appData.settings.footer ? i.client.appData.settings.footer : '');

  let noXpRoleIds = await guildRoleModel.getNoXpRoleIds(i.guild);
  noXpRoleIds = noXpRoleIds.slice(from - 1, to);

  for (const roleId of noXpRoleIds)
    e.addField(':no_entry_sign:', nameUtil.getRoleName(i.guild.roles.cache, roleId), true);

  if (noXpRoleIds.length == 0)
    e.setDescription('No roles to show here.');

  return e;
}

async function messages(i, myGuild, from, to) {
  let entries = [];

  entries.push({ title: 'levelupMessage', desc: myGuild.levelupMessage });
  entries.push({ title: 'serverJoinMessage', desc: myGuild.serverJoinMessage });
  entries.push({ title: 'roleAssignMessage', desc: myGuild.roleAssignMessage });
  entries.push({ title: 'roleDeassignMessage', desc: myGuild.roleDeassignMessage });

  for (let role of i.guild.roles.cache) {
    role = role[1];
    await guildRoleModel.cache.load(role);

    if (role.appData.assignMessage.trim() != '')
      entries.push({ title: 'Assignment of ' + role.name, desc: role.appData.assignMessage });
    if (role.appData.deassignMessage.trim() != '')
      entries.push({ title: 'Deassignment of ' + role.name, desc: role.appData.deassignMessage });
  }

  const e = new MessageEmbed()
    .setAuthor({ name: 'Messages info' })
    .setColor('#4fd6c8')
    .setDescription('Review the set messages and texts for the bot.')
    .setFooter(i.client.appData.settings.footer ? i.client.appData.settings.footer : '');

  entries = entries.slice(from - 1, to);
  for (const entry of entries)
    e.addField(entry.title, entry.desc != '' ? entry.desc : 'Not set.');

  return e;
}

async function permissions(i) {
  const embed = new MessageEmbed()
    .setAuthor({ name: 'Permission Info' })
    .setColor('#4fd6c8')
    .setThumbnail(i.guild.iconURL)
    .setFooter(i.client.appData.settings.footer ? i.client.appData.settings.footer : '');

  const missingPerms = i.guild.me.permissions.missing('294172224721');
  if (!missingPerms.length) {
    embed.addField('✅ All Permissions are Correct ✅', 'Your bot has all the permissions it needs.');
  } else {
    const botRole = i.guild.me.roles.botRole;
    embed.addField(
      `❌ Missing ${missingPerms.length} Permissions ❌`,
      `Your bot is missing the following permissions: \n${missingPerms.join(', \n')}`,
    );
    if (botRole)
      embed.addField('Solutions', `You may add the above permissions to ${botRole} or another role added to your bot. Alternatively, go to [this link](${botInviteLink}) and follow the steps provided to reinvite the bot.`);

    else
      embed.addField('Solutions', `Please add the above permissions to any role that your bot has. Alternatively, go to [this link](${botInviteLink}) and follow the steps provided to reinvite the bot.`);
  }

  return embed;
}
