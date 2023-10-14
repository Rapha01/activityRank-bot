import { registerEvent } from 'bot/util/eventLoader.js';
import { Events } from 'discord.js';

registerEvent(Events.Error, function (error) {
  console.log('Client registered an error', error);
});
