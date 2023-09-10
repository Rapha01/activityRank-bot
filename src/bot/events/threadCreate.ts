import { ChannelType, type ThreadChannel } from 'discord.js';

export default {
  name: 'threadCreate',
  async execute(thread: ThreadChannel) {
    if (thread.type == ChannelType.PublicThread) thread.join();
  },
};
