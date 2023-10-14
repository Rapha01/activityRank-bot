import guildModel from '../models/guild/guildModel.js';
import guildChannelModel from '../models/guild/guildChannelModel.js';
import guildRoleModel from '../models/guild/guildRoleModel.js';
import guildMemberModel from '../models/guild/guildMemberModel.js';
import statFlushCache from '../statFlushCache.js';
import skip from '../skip.js';
import { MessageType, ChannelType, Message, Events } from 'discord.js';
import { registerEvent } from 'bot/util/eventLoader.js';

const acceptedChannelTypes = [
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.PublicThread,
];
const acceptedMessageTypes = [MessageType.Default, MessageType.Reply];

registerEvent(Events.MessageCreate, async function (message) {
  if (
    message.author.bot == true ||
    message.system == true ||
    skip(message.guildId!) ||
    !acceptedMessageTypes.includes(message.type) ||
    !message.inGuild()
  )
    return;

  await guildModel.cache.load(message.guild);

  const mentionRegex = new RegExp(`^(<@!?${message.client.user.id}>)\\s*test\\s*$`);
  if (message.content && mentionRegex.test(message.content))
    await message.reply('This test is successful. The bot is up and running.');

  if (message.guild.appData.textXp && acceptedChannelTypes.includes(message.channel.type))
    await rankMessage(message);
});

async function rankMessage(msg: Message<true>) {
  if (!msg.channel) return;

  const channel = msg.channel.type === ChannelType.PublicThread ? msg.channel.parent : msg.channel;
  if (!channel) throw new Error('no channel defined in rankMessage second stage');

  await msg.guild.members.fetch(msg.author.id);

  if (!msg.member) return;

  await guildMemberModel.cache.load(msg.member);
  msg.member.appData.lastMessageChannelId = msg.channel.id;

  // Check noxp channel
  await guildChannelModel.cache.load(channel);

  if (channel.appData.noXp) return;

  const category = channel?.parent;
  if (category) {
    await guildChannelModel.cache.load(category);
    if (category.appData.noXp) return;
  }

  // Check noxp role
  for (const _role of msg.member.roles.cache) {
    const role = _role[1];
    await guildRoleModel.cache.load(role);

    if (role.appData.noXp) return;
  }

  // Check textmessage cooldown
  const lastMessage = msg.member.appData.lastTextMessageDate;
  if (typeof msg.guild.appData.textMessageCooldownSeconds !== 'undefined') {
    if (
      lastMessage &&
      Date.now() - lastMessage.getTime() < msg.guild.appData.textMessageCooldownSeconds * 1000
    )
      return;
    msg.member.appData.lastTextMessageDate = new Date();
  }

  msg.client.appData.botShardStat.textMessagesTotal++;

  // Add Score
  await statFlushCache.addTextMessage(msg.member, channel, 1);

  return;
}
