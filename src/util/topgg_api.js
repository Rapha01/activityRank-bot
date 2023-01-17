const axios = require('axios');
const botShardStatModel = require("../models/botShardStatModel.js");
const keys = require('../const/keys.js').get();

exports.sendServerCountToDiscordbotsOrg = async function() {
  const counts = await botShardStatModel.getShardServerCounts();

  const now = new Date().toLocaleString();

  function handleError(e) {
    console.log(`${now} [top.gg request error]`)
    if (e.response) {
      console.log(e.response.data);
      console.log(e.response.status);
      console.log(e.response.headers);
    } else {
      console.log(error.message);
    }
  }

  axios.post(
    `https://top.gg/api/bots/${keys.botId}/stats`,
    counts,
    { headers: {
      "Authorization": keys.dblApiKey,
      "Content-Type": "application/json;charset=UTF-8",
    } }
  )
    .then(() => console.log(`${now} [top.gg request success] ${res.status}`))
    .catch(handleError)
}
