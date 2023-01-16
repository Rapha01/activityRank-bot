const { getShardStats } = require('../models/botShardStatModel.js');
const fct = require('../util/fct.js');

exports.getShardStats = async (_, res) => {
  try {
    res.send({ stats: await getShardStats() });
  } catch (e) {
    console.log(e);
    res.send(fct.apiResponseJson([],'Could not get stats.'));
  }
}