const userModel = require('../../../models/userModel.js');

module.exports.execute = async (i) => {
  await userModel.cache.load(i.user);
  const myUser = await userModel.storage.get(i.user);

  const nowDate = new Date() / 1000;

  if (myUser.voteMultiplierUntil > nowDate) {
    return await i.reply({
      content: `You already have an active votepower increase (${myUser.voteMultiplier}x). You may redeem a new one <t:${
        myUser.voteMultiplierUntil}:R>.`,
      ephemeral: true,
    });
  }

  if (myUser.tokens < 10) {
    return await i.reply({
      content: `Not enough tokens! It costs 10 tokens for 72 hours, and you only have ${
        myUser.tokens}. Use \`/token get\` to get more!`,
      ephemeral: true,
    });
  }

  await userModel.storage.increment(i.user, 'tokens', -10);
  await userModel.storage.set(i.user, 'voteMultiplierUntil', nowDate + 259_200);
  await userModel.storage.set(i.user, 'voteMultiplier', 2);

  await i.reply({
    content: 'Successfully activated 2x votePower for the next 72 hours.',
    ephemeral: true,
  });
};
