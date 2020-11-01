const fct = require('../util/fct.js');
let warump;

if (process.env.NODE_ENV == 'production') {
  warmup = 60;
  decrementWarmup();
} else
  warmup = 0;


module.exports = (guildId) => {
  if (warmup != 0) {
    if(Math.floor(Math.random() * warmup) != 0)
      return true;
  }

  return false;
}

async function decrementWarmup() {
  try {
    await fct.sleep(30000);

    while (warmup > 0) {
      await fct.sleep(1000);
      warmup--;
      
      if (warmup % 10 == 0)
        console.log('Warmup: ' + warmup + '.');
    }

    console.log('Warmup phase over.');
  } catch (e) { console.log(e); }
}
