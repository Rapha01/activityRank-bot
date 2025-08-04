import { Events } from 'discord.js';
import { event } from '#bot/util/registry/event.js';

export default event(Events.Error, (error) => {
  console.log('Client registered an error', error);
});
