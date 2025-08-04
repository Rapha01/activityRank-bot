import { ChannelType, Events, type Message, MessageType } from 'discord.js';
import { getRoleModel } from '#bot/models/guild/guildRoleModel.js';
import { event } from '#bot/util/registry/event.js';
import guildChannelModel from '../models/guild/guildChannelModel.js';
import { getMemberModel } from '../models/guild/guildMemberModel.js';
import { getGuildModel } from '../models/guild/guildModel.js';
import skip from '../skip.js';
import statFlushCache from '../statFlushCache.js';

const acceptedChannelTypes = [
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.AnnouncementThread,
];
const acceptedMessageTypes = [MessageType.Default, MessageType.Reply];

export default event(Events.MessageCreate, async (message) => {
  if (
    message.author.bot ||
    message.system ||
    skip() ||
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

  const channel = msg.channel.isThread() ? msg.channel.parent : msg.channel;
  if (!channel) throw new Error('no channel defined in rankMessage second stage');

  await msg.guild.members.fetch(msg.author.id);

  if (!msg.member) return;

  const cachedMember = await getMemberModel(msg.member);
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
  for (const role of msg.member.roles.cache.values()) {
    const cachedRole = await getRoleModel(role);

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
