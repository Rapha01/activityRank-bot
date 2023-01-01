const fct = require('../util/fct.js');
const userModel = require('../models/userModel.js');
const shardDb = require('../models/shardDb.js');
const keys = require('../const/keys.js').get();
const mysql = require('promise-mysql');

exports.paypalComplete = async (req, res, next) => {
  try {
    if (req.body.event_type != 'PAYMENT.CAPTURE.COMPLETED')
      return;

    console.log('paypalComplete');
    let userId = req.body.resource.custom_id;
    const count = req.body.resource.amount.value * 1000;

    if (isNaN(userId) || isNaN(count))
      return;

    userId = mysql.escape(userId);
    await userModel.storage.get(userId);
    await userModel.storage.increment(userId,'tokens', count);
    await userModel.storage.increment(userId,'tokensBought', count);

    console.log(count + ' tokens bought and added for ' + userId);
    res.send('1');

  } catch (e) {
    console.log(e);
    res.send(fct.apiResponseJson([],'Could not process paypal payment.'));
  }
}

exports.dblUpvote = async (req, res, next) => {
  try {
    if (typeof req.body.user !== 'undefined') {
      const userId = req.body.user;

      if (req.headers.authorization != keys.dblAuth)
        return;
      if (isNaN(userId))
        return;

      //await userModel.storage.get(userId);
      //await userModel.storage.increment(userId,'tokens',3);

      await userModel.storage.set(i.user, 'voteMultiplierUntil', (Date.now() / 1000) + 259200);
      await userModel.storage.set(i.user, 'voteMultiplier', 2);

      console.log('Received Upvote from user ' + userId);
      res.send('1');
    }
  } catch (e) {
    console.log(e);
    res.send(fct.apiResponseJson([],'Could not get guildchannel by guildId.'));
  }
}
