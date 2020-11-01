const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes');
const managerDb = require('./models/managerDb.js');
const shardDb = require('./models/shardDb.js');

const cron = require('node-cron');
const fct = require('./util/fct.js');
const scheduler = require('./cron/scheduler.js');

process.env.UV_THREADPOOL_SIZE = 80;
process.env.PORT = 3005;

app.use(express.static(path.join(__dirname, '/client/build/')));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true, parameterLimit: 100000 }));
app.use(routes);

let server;
const start = async () => {
  try {
    const resetModel = require('./models/resetModel.js');
    await scheduler.start();

    server = app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}...`));

  } catch (e) { console.log(e); }
}

start().catch(async (e) => {
  console.log(e);
  await fct.waitAndReboot(3000);
});
