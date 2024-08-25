import { createConnection } from 'mysql2/promise';
import keys from '../config/keys.json' assert { type: 'json' };
import { createWriteStream, readFileSync } from 'node:fs';

async function main() {
  const conn = await createConnection({
    host: process.env.HOST,
    user: keys.managerDb.dbUser,
    password: keys.managerDb.dbPassword,
    database: keys.managerDb.dbName,
    namedPlaceholders: true,
    bigNumberStrings: true,
    supportBigNumbers: true,
  });

  const logStream = createWriteStream('migration/migrate-set.log', { flags: 'a' });

  const getGuildInfo = await conn.prepare(
    'SELECT xpPerVoiceMinute, xpPerTextMessage, xpPerVote, xpPerInvite, xpPerBonus FROM dbShard.guild WHERE guildId = ?;',
  );

  const mainQuery = await conn.prepare(
    readFileSync('migration/guild-migrate-statxp-memberxp-condensed.sql').toString(),
  );

  let highestId = 0n;
  let guildCount = 0;
  let rowCount = 0n;
  let lastTime = Date.now();

  /** @type (i: any, pad: number) => string */
  const pad = (i, pad) => i.toString().padStart(pad);

  console.log('=====                  ActivityRank Migration Utility                  =====');
  console.log('+-----------------------+------------------+------------------+------------+');
  console.log('| Next Guild ID         | Guilds Processed | Rows Changed     | Time Taken |');
  console.log('+-----------------------+------------------+------------------+------------+');
  while (true) {
    const timeDiff = Date.now() - lastTime;
    console.log(
      `| ${pad(highestId, 21)} | ${pad(guildCount, 16)} | ${pad(rowCount, 16)} | ${pad(`${Math.floor(timeDiff / 1000)}s`, 10)} |`,
    );
    console.log('+-----------------------+------------------+------------------+------------+');
    // get all guild IDs managed by the bot, cursor-paginated by ID
    /** @type {string[]} */
    const guildIds = (
      await conn.query(
        `SELECT guildId FROM guild WHERE guildId > ${highestId} ORDER BY guildId ASC LIMIT 1000;`,
      )
    )[0].map(({ guildId }) => guildId);

    if (guildIds.length < 1) {
      console.log('Done!');
      break;
    }

    highestId = BigInt(guildIds.at(-1));

    for (const guildId of guildIds) {
      // destructure getGuildInfo result
      const [[{ xpPerVoiceMinute, xpPerTextMessage, xpPerVote, xpPerInvite, xpPerBonus }]] =
        await getGuildInfo.execute([guildId]);

      const [{ affectedRows }] = await mainQuery.execute(
        [
          // ! ORDER IS VERY IMPORTANT HERE
          guildId,
          new Array(5).fill(xpPerVoiceMinute),
          new Array(5).fill(xpPerTextMessage),
          new Array(5).fill(xpPerVote),
          new Array(5).fill(xpPerInvite),
          new Array(5).fill(xpPerBonus),
          new Array(9).fill(guildId),
        ].flat(),
      );

      logStream.write(`${guildId} ${affectedRows}\n`, (err) => {
        if (err) throw err;
      });

      guildCount++;
      rowCount += BigInt(affectedRows);
    }
  }

  await conn.end();
}

await main();
