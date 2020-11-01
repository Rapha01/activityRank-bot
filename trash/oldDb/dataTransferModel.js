//const managerDb = require('../managerDb.js');
const shardDb = require('../shardDb.js');
const oldDb = require('./oldDb.js');
const guildRouteModel = require('../guildRouteModel.js');
const mysql = require('promise-mysql');

exports.loadshardDbTable = () => {
  return new Promise(async function (resolve, reject) {
    let guildIds,alreadyLoadedGuildIds,alreadyLoadedGuildIdsTemp,guildRows,guildmemberRows,guildchannelRows,guildroleRows,textmessageRows,voiceminuteRows,voteRows,bonusRows,commandRows;
    console.log('loadshardDbTable');
    const batchsize = 150;
    let conn = await shardDb.getConnection('');
    await oldDb.getConnection('');

    while (true) {
      guildIds = [];
      alreadyLoadedGuildIds = [];
      try {

        //await conn.query('set innodb_lock_wait_timeout=300;');



        alreadyLoadedGuildIdsTemp = await conn.query('SELECT guildid FROM guild WHERE 1');
        for (alreadyLoadedGuildId of alreadyLoadedGuildIdsTemp)
          alreadyLoadedGuildIds.push(alreadyLoadedGuildId.guildid);
        alreadyLoadedGuildIds.push(0);

        //console.log(alreadyLoadedGuildIds);
        let res = await oldDb.query(`(SELECT guildid FROM command WHERE datechanged > (NOW() - INTERVAL 90 DAY) AND guildid NOT IN (${'\'' + alreadyLoadedGuildIds.join('\',\'') + '\''}) GROUP BY guildid)`);
        console.log('Remaining: ' + res.length);

        res = res.splice(0,batchsize);
        for (guildId of res) {
          await guildRouteModel.get(guildId.guildid);
          guildIds.push(guildId.guildid);
        }
        //console.log(guildIds);
        if (guildIds.length == 0) {
          console.log('Nothing left to transfer.');
          return resolve();
        }

        // channel: AND channelid NOT REGEXP ' ' AND channelid NOT REGEXP '\n' AND channelid != '' AND concat('',channelid * 1) = channelid
        // text:  AND channelid != '693177065192816640' AND channelid !='696534912618201118' AND channelid !='691429243250409495' AND channelid != '693140118843818079' ANd channelid != '705947062604267540' AND channelid != '710342651689566214' AND channelid != '543089048374214663' AND channelid != '719163228898459688' AND channelid != '708710845735108678' AND guildid != '712425217036648458' AND guildid != '719692903525646448'
        // voice: AND channelid != '280493084393996289'
        // role: AND roleid NOT LIKE '%625365155773022228%'
        // vote: AND guildid != '719692903525646448'
        // AND channelid NOT REGEXP '\n' AND channelid != '' AND channelid NOT REGEXP ' ' AND concat('',channelid * 1) = channelid AND userid != '' AND userid NOT REGEXP ' ' AND concat('',userid * 1) = userid AND guildid != '' AND guildid NOT REGEXP ' ' AND concat('',guildid * 1) = guildid
        console.log('Getting guild');
        guildRows = await oldDb.query(`SELECT * FROM guild WHERE guildid IN (${guildIds.join(',')})`); console.log('Getting guildmember');
        guildmemberRows = await oldDb.query(`SELECT * FROM guildmember WHERE guildid IN (${guildIds.join(',')}) AND notifylevelupdm = 0 AND userid != ''`); console.log('Getting guildchannel');
        guildchannelRows = await oldDb.query(`SELECT * FROM guildchannel WHERE guildid IN (${guildIds.join(',')})  AND noxp != 0`); console.log('Getting guildrole');
        guildroleRows = await oldDb.query(`SELECT * FROM guildrole WHERE guildid IN (${guildIds.join(',')})`); console.log('Getting textmessage');
        textmessageRows = await oldDb.query(`SELECT * FROM textmessage WHERE guildid IN (${guildIds.join(',')}) AND alltime != 0 `); console.log('Getting voiceminute');
        voiceminuteRows = await oldDb.query(`SELECT * FROM voiceminute WHERE guildid IN (${guildIds.join(',')}) AND alltime != 0 `); console.log('Getting vote');
        voteRows = await oldDb.query(`SELECT * FROM vote WHERE guildid IN (${guildIds.join(',')}) AND alltime != 0 `); console.log('Getting bonus');
        bonusRows = await oldDb.query(`SELECT * FROM bonus WHERE guildid IN (${guildIds.join(',')}) AND alltime != 0 `);

        console.log('Fetched ' + guildIds.length + ' guilds. Starting insertion.');

      } catch (e) { return reject(e); }

      try {
        await conn.beginTransaction();

        let insertValuesSqls = [];
        for (row of guildRows)
          insertValuesSqls.push(`(
              ${row.guildid},${mysql.escape(row.votetag)},${mysql.escape(row.voteemote)},${mysql.escape(row.bonusemote)},${row.deassignassignedroles},${row.pointspervoiceminute},${row.pointspertextmessage},${row.pointspervote},${row.pointsperbonus},${row.bonuspertextmessage},
              ${row.bonuspervoiceminute},${row.bonuspervote},${row.levelfactor},${mysql.escape(row.prefix)},${row.voteinterval},${row.post_levelup},${row.post_serverjoin},
              ${mysql.escape(row.text_levelup)},${mysql.escape(row.text_serverjoin)},${mysql.escape(row.text_roleassignment)},${mysql.escape(row.text_roledeassignment)},${row.notifylevelupdm},${row.notifylevelupchannel},
              ${row.notifyleveluponlywithrole},${row.textmessagecooldown},${row.entriesperpage},${row.allowmutedxp},UNIX_TIMESTAMP(${mysql.escape(row.dateadded)}),UNIX_TIMESTAMP(${mysql.escape(row.botjoindate)}),UNIX_TIMESTAMP(${mysql.escape(row.botleavedate)}),
              ${mysql.escape(row.bonustag)})`);
        console.log('Inserting guild. ' + insertValuesSqls.length);
        if (insertValuesSqls.length > 0)
          await conn.query(`INSERT INTO guild
              (guildId,voteTag,voteEmote,bonusEmote,takeAwayAssignedRolesOnLevelDown,xpPerVoiceMinute,xpPerTextMessage,xpPerVote,xpPerBonus,bonusPerTextMessage,
              bonusPerVoiceMinute,bonusPerVote,levelFactor,prefix,voteCooldownSeconds,autopost_levelup,autopost_serverJoin,
              levelupMessage,serverJoinMessage,roleAssignmentMessage,roleDeassignmentMessage,notifyLevelupDm,notifyLevelupCurrentChannel,
              notifyLevelupOnlyWithRole,textMessageCooldownSeconds,entriesPerPage,allowMutedXp,addDate,joinedAtDate,leftAtDate,
              bonusTag) VALUES ${insertValuesSqls.join(',')}`);

        //console.log('Inserting guildmember ' + guildmemberRows.length);
        insertValuesSqls = [];
        for (row of guildmemberRows)
          insertValuesSqls.push(`(${row.guildid},${row.userid},${row.notifylevelupdm})`);
        if (insertValuesSqls.length > 0)
          await conn.query(`INSERT IGNORE INTO guildMember
              (guildId,userId,notifyLevelupDm) VALUES ${insertValuesSqls.join(',')}`);

        insertValuesSqls = [];
        for (row of guildchannelRows)
          insertValuesSqls.push(`(${row.guildid},${row.channelid},${row.noxp})`);
        console.log('Inserting guildChannel. ' + insertValuesSqls.length);
        while (insertValuesSqls.length > 0)
          await conn.query(`INSERT IGNORE INTO guildChannel (guildId,channelId,noXp) VALUES ${insertValuesSqls.splice(0,10000).join(',')}`);

        insertValuesSqls = [];
        for (row of guildroleRows)
          insertValuesSqls.push(`(${row.guildid},${mysql.escape(row.roleid)},${mysql.escape(row.assignlevel)},${mysql.escape(row.deassignlevel)},${mysql.escape(row.assignmessage)},${mysql.escape(row.deassignmessage)},${mysql.escape(row.noxp)})`);
        console.log('Inserting guildRole. ' + insertValuesSqls.length);
        while (insertValuesSqls.length > 0)
          await conn.query(`INSERT IGNORE INTO guildRole (guildId,roleId,assignLevel,deassignLevel,assignMessage,deassignMessage,noXp) VALUES ${insertValuesSqls.splice(0,10000).join(',')}`);

        insertValuesSqls = [];
        for (row of textmessageRows)
          insertValuesSqls.push(`(${row.guildid},${row.userid},${row.channelid},${row.alltime},${row.year},${row.month},${row.week},${row.day},UNIX_TIMESTAMP(${mysql.escape(row.datechanged)}),UNIX_TIMESTAMP(${mysql.escape(row.dateadded)}))`);
        console.log('Inserting textMessage. ' + insertValuesSqls.length);
        while (insertValuesSqls.length > 0)
          await conn.query(`INSERT IGNORE INTO textMessage (guildId,userId,channelId,alltime,year,month,week,day,changeDate,addDate) VALUES ${insertValuesSqls.splice(0,10000).join(',')}`);

        insertValuesSqls = [];
        for (row of voiceminuteRows)
          insertValuesSqls.push(`(${row.guildid},${row.userid},${row.channelid},${row.alltime},${row.year},${row.month},${row.week},${row.day},UNIX_TIMESTAMP(${mysql.escape(row.datechanged)}),UNIX_TIMESTAMP(${mysql.escape(row.dateadded)}))`);
        console.log('Inserting voiceMinute. ' + insertValuesSqls.length);
        while (insertValuesSqls.length > 0)
          await conn.query(`INSERT IGNORE INTO voiceMinute (guildId,userId,channelId,alltime,year,month,week,day,changeDate,addDate) VALUES ${insertValuesSqls.splice(0,10000).join(',')}`);

        insertValuesSqls = [];
        for (row of voteRows)
          insertValuesSqls.push(`(${row.guildid},${row.userid},${row.alltime},${row.year},${row.month},${row.week},${row.day},UNIX_TIMESTAMP(${mysql.escape(row.datechanged)}),UNIX_TIMESTAMP(${mysql.escape(row.dateadded)}))`);
        console.log('Inserting vote. ' + insertValuesSqls.length);
        while (insertValuesSqls.length > 0)
          await conn.query(`INSERT IGNORE INTO vote (guildId,userId,alltime,year,month,week,day,changeDate,addDate) VALUES ${insertValuesSqls.splice(0,10000).join(',')}`);

        insertValuesSqls = [];
        for (row of bonusRows)
          insertValuesSqls.push(`(${row.guildid},${row.userid},${row.alltime},${row.year},${row.month},${row.week},${row.day},UNIX_TIMESTAMP(${mysql.escape(row.datechanged)}),UNIX_TIMESTAMP(${mysql.escape(row.dateadded)}))`);
        console.log('Inserting bonus. ' + insertValuesSqls.length);
        while (insertValuesSqls.length > 0)
          await conn.query(`INSERT IGNORE INTO bonus (guildId,userId,alltime,year,month,week,day,changeDate,addDate) VALUES ${insertValuesSqls.splice(0,10000).join(',')}`);

        await conn.commit();

        console.log('Insert finished.');
      } catch (e) { conn.rollback(); return reject('' + e); }
    }

    return resolve();
  });
}

/*
exports.loadManagerTables = () => {
  return new Promise(async function (resolve, reject) {
    try {
      console.log('Getting externUpvote');
      const externUpvoteRows = await oldDb.query(`SELECT * FROM gl_externupvote`); console.log('Getting product');
      const productRows = await oldDb.query(`SELECT * FROM gl_product`);

      let insertValuesSqls = [];
      for (row of externUpvoteRows)
        insertValuesSqls.push(`(${row.userid},${mysql.escape(row.source)},${mysql.escape(row.dateadded)})`);
      if (insertValuesSqls.length > 0)
        await managerDb.query(`INSERT IGNORE INTO wh_externUpvote (userid,source,dateadded) VALUES ${insertValuesSqls.join(',')}`);

      insertValuesSqls = [];
      for (row of productRows)
        insertValuesSqls.push(`(${mysql.escape(row.type)},${mysql.escape(row.typeid)},${mysql.escape(row.plan)},${mysql.escape(row.until)},${mysql.escape(row.txnplatform)},${mysql.escape(row.txnid)},${mysql.escape(row.dateadded)})`);
      if (insertValuesSqls.length > 0)
        await managerDb.query(`INSERT IGNORE INTO wh_product (type,typeid,plan,until,txnplatform,txnid,dateadded) VALUES ${insertValuesSqls.join(',')}`);

      //managerDb.conn.commit();

      return resolve();
    } catch (e) { reject(e); }
  });
}*/
