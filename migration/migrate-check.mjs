import { createConnection } from 'mysql2/promise';
import keys from '../config/keys.json' assert { type: 'json' };
import { createWriteStream, readFileSync } from 'node:fs';

async function main() {
  const sampleSize = parseInt(process.argv[2] ?? '10');

  const conn = await createConnection({
    host: process.env.HOST,
    user: keys.shardDb.dbUser,
    password: keys.shardDb.dbPassword,
    database: keys.shardDb.dbName,
    namedPlaceholders: true,
    bigNumberStrings: true,
    supportBigNumbers: true,
  });

  const logStream = createWriteStream(`migration/migrate-check-${Date.now()}.log`, { flags: 'a' });

  const getGuilds = await conn.prepare(
    'SELECT guildId FROM dbShard.guild ORDER BY RAND() LIMIT ?;',
  );

  const mainQuery = await conn.prepare(
    readFileSync('migration/guild-check-statxp-memberxp-run.sql').toString(),
  );

  let failedGuildCount = 0;
  let guildCount = 0;
  let rowCount = 0n;
  let lastTime = Date.now();

  /** @type (i: any, pad: number) => string */
  const pad = (i, pad) => i.toString().padStart(pad);

  console.log('=====               ActivityRank Migration Check Utility               =====');
  while (true) {
    const timeDiff = Date.now() - lastTime;
    console.log(`Time: ${Math.floor(timeDiff / 1000)}s`);

    const guildsRemaining = sampleSize - guildCount;

    console.log(`Processed ${guildCount} guilds and ${rowCount} members`);
    console.log(`${failedGuildCount}/${guildCount} guilds failed (${Math.ceil(failedGuildCount/guildCount * 1000) / 10}%)`);
    console.log(`${guildsRemaining} guilds remaining`);

    /** @type {string[]} */
    const guildIds = (await getGuilds.execute([Math.min(guildsRemaining, 100).toString()]))[0].map(
      ({ guildId }) => guildId,
    );

    if (guildIds.length < 1) {
      console.log('Done!');
      break;
    }

    for (const guildId of guildIds) {
      let isGuildSuccess = true;
      const [[{ xpPerVoiceMinute, xpPerTextMessage, xpPerVote, xpPerInvite, xpPerBonus }]] =
        await conn.execute(
          'SELECT xpPerVoiceMinute, xpPerTextMessage, xpPerVote, xpPerInvite, xpPerBonus FROM dbShard.guild WHERE guildId = ?',
          [guildId],
        );

      const [res] = await mainQuery.execute(
        [
          // ! ORDER IS VERY IMPORTANT HERE
          new Array(5).fill(xpPerVoiceMinute.toString()),
          new Array(5).fill(xpPerTextMessage.toString()),
          new Array(5).fill(xpPerVote.toString()),
          new Array(5).fill(xpPerInvite.toString()),
          new Array(5).fill(xpPerBonus.toString()),
          new Array(11).fill(guildId),
        ].flat(),
      );

      for (const entry of res) {
        if (entry.checkAll !== '1') isGuildSuccess = false;
        logStream.write(`${guildId} ${entry.userId} ${entry.checkAll}\n`);
      }

      if (!isGuildSuccess) {
        console.log(`[!] Guild ${guildId} failed check`);
        failedGuildCount++;
      }

      guildCount++;
      rowCount += BigInt(res.length);
    }
  }

  await conn.end();
}

await main();
