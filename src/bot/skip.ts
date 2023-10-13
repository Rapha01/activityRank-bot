import fct from '../util/fct.js';
import { logger } from './util/logger.js';

let warmup: number;

if (process.env.NODE_ENV == 'production') {
  warmup = 60;
  decrementWarmup();
} else warmup = 0;

// TODO remove legacy optional parameter
export default (_guildId?: string) => warmup != 0 && Math.floor(Math.random() * warmup) != 0;

async function decrementWarmup() {
  try {
    await fct.sleep(30000);

    while (warmup > 0) {
      await fct.sleep(1000);
      warmup--;

      if (warmup % 10 == 0) logger.debug(`Warmup: ${warmup}.`);
    }

    logger.info('Warmup phase over.');
  } catch (e) {
    logger.warn(e, 'Warmup error');
  }
}
