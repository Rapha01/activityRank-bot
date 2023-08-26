import guildModel from '../models/guild/guildModel.js';
import guildChannelModel from '../models/guild/guildChannelModel.js';
import guildRoleModel from '../models/guild/guildRoleModel.js';
import guildMemberModel from '../models/guild/guildMemberModel.js';
import statFlushCache from '../statFlushCache.js';
import skip from '../skip.js';
import { MessageType, ChannelType } from 'discord.js';

const acceptedChannelTypes = [
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.PublicThread,
];
const acceptedMessageTypes = [MessageType.Default, MessageType.Reply];

export default {
  name: 'messageCreate',
  async execute(msg) {
    if (
      msg.author.bot == true ||
      msg.system == true ||
      skip(msg.guildId) ||
      !acceptedMessageTypes.includes(msg.type) ||
      !msg.guild
    )
      return;

    await guildModel.cache.load(msg.guild);

    const mentionRegex = new RegExp(
      `^(<@!?${msg.client.user.id}>)\\s*test\\s*$`
    );
    if (msg.content && mentionRegex.test(msg.content))
      await msg.reply('This test is successful. The bot is up and running.');
    
    if (msg.guild.appData.textXp && acceptedChannelTypes.includes(msg.channel.type) )
      await rankMessage(msg);
  },
};

async function rankMessage(msg) {
  if (!msg.channel) return;
  
  const channel =
    msg.channel.type === ChannelType.PublicThread
      ? msg.channel.parent
      : msg.channel;

  await msg.guild.members.fetch(msg.author.id);

  if (!msg.member) return;

  await guildMemberModel.cache.load(msg.member);
  msg.member.appData.lastMessageChannelId = msg.channel.id;

  // Check noxp channel
  await guildChannelModel.cache.load(channel);

  if (channel.appData.noXp) return;

  const category = channel.parent;
  if (category) {
    await guildChannelModel.cache.load(category);
    if (category.appData.noXp) return;
  }

  // Check noxp role
  for (let role of msg.member.roles.cache) {
    role = role[1];
    await guildRoleModel.cache.load(role);

    if (role.appData.noXp) return;
  }

  // Check textmessage cooldown
  const nowSec = Date.now() / 1000;

  if (typeof msg.guild.appData.textMessageCooldownSeconds !== 'undefined') {
    if (
      nowSec - msg.member.appData.lastTextMessageDate <
      msg.guild.appData.textMessageCooldownSeconds
    )
      return;
    msg.member.appData.lastTextMessageDate = nowSec;
  }

  msg.client.appData.botShardStat.textMessagesTotal++;

  // Add Score
  await statFlushCache.addTextMessage(msg.member, channel, 1);

  return;
}
