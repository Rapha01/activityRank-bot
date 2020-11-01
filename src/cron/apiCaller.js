const request = require('request');
const botShardStatModel = require("../models/botShardStatModel.js");
const keys = require('../const/keys.js').get();

exports.sendServerCountToDiscordbotsOrg = function() {
  return new Promise(async function (resolve, reject) {
    const counts = await botShardStatModel.getShardServerCounts();
    console.log(counts);

    const options = {
      uri: 'https://discordbots.org/api/bots/' + keys.botId + '/stats',
      method: 'POST',
      json: {
        "server_count": counts
      },
      headers: {
        'Authorization': keys.dblApiKey
      }
    };

    request(options, function (error, response, body) {
      const now = new Date(Date.now()).toLocaleString();

      if (!error && response.statusCode == 200) {
        console.log(now + ' Successfully sent servercount to discordbots.org');
      } else {
        console.log(now + ' Request error sending servercount to discordbots.org. \nerr:' + error + '\nresponse:' + JSON.stringify(response.body));
      }
    });
    resolve();
  });
}
