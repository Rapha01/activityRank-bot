import { registerEvent } from 'bot/util/eventLoader.js';
import { ChannelType, Events } from 'discord.js';

registerEvent(Events.ThreadCreate, async function (thread) {
  if (thread.type == ChannelType.PublicThread) await thread.join();
});
