import type { pino } from 'pino';
import 'discord.js';

declare module 'discord.js' {
  export interface Client {
    logger: pino.Logger;
  }
}
