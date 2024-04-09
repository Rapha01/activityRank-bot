import { getGuildModel } from '../models/guild/guildModel.js';
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

  const cachedGuild = await getGuildModel(message.guild);

  const mentionRegex = new RegExp(`^(<@!?${message.client.user.id}>)\\s*test\\s*$`);
  if (message.content && mentionRegex.test(message.content))
    await message.reply('This test is successful. The bot is up and running.');

  if (!message.channel) {
    // TODO: find why this might occur
    message.client.logger.warn({ message }, 'Message.channel undefined');
  }

  if (cachedGuild.db.textXp && acceptedChannelTypes.includes(message.channel.type))
    await rankMessage(message);
});

async function rankMessage(msg: Message<true>) {
  if (!msg.channel) return;

  const channel = msg.channel.type === ChannelType.PublicThread ? msg.channel.parent : msg.channel;
  if (!channel) throw new Error('no channel defined in rankMessage second stage');

  await msg.guild.members.fetch(msg.author.id);

  if (!msg.member) return;

  const cachedMember = await guildMemberModel.cache.get(msg.member);
  cachedMember.cache.lastMessageChannelId = msg.channel.id;

  // Check noxp channel
  const cachedChannel = await guildChannelModel.cache.get(channel);

  if (cachedChannel.db.noXp) return;

  const category = channel?.parent;
  if (category) {
    const cachedParent = await guildChannelModel.cache.get(category);
    if (cachedParent.db.noXp) return;
  }

  // Check noxp role
  for (const _role of msg.member.roles.cache) {
    const role = _role[1];
    const cachedRole = await guildRoleModel.cache.get(role);

    if (cachedRole.db.noXp) return;
  }

  const cachedGuild = await getGuildModel(msg.guild);

  // Check textmessage cooldown
  const lastMessage = cachedMember.cache.lastTextMessageDate;
  if (typeof cachedGuild.db.textMessageCooldownSeconds !== 'undefined') {
    if (
      lastMessage &&
      Date.now() - lastMessage.getTime() < cachedGuild.db.textMessageCooldownSeconds * 1000
    )
      return;
    cachedMember.cache.lastTextMessageDate = new Date();
  }

  msg.client.botShardStat.textMessagesTotal++;

  // Add Score
  await statFlushCache.addTextMessage(msg.member, channel, 1);

  return;
}
