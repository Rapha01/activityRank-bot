import { Events } from 'discord.js';
import { event } from '#bot/util/registry/event.ts';

export default event(Events.Error, (error) => {
  console.log('Client registered an error', error);
});
