const express = require('express');
const router = express.Router();

const webhookController = require('./controllers/webhookController.js');
const textController = require('./controllers/textController.js');
const statController = require('./controllers/statController.js');
const path = require('path');

// Incoming Webhooks
router.route('/webhook/dbl/upvote/').post(webhookController.dblUpvote);
//router.route('/webhook/paypal/complete').post(webhookController.paypalComplete);

// Text
router.route('/api/texts/').get(textController.getTexts);
router.route('/api/stats/').get(statController.getShardStats);

// View
router.route('/').get(function(req, res) {
  res.send('ActivityRank Backup DB');
});

module.exports = router;
