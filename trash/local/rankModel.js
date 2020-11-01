const db = require('./db.js');
const mysql = require('mysql');
const fct = require('../../fct.js');

// Toplist
exports.getGuildMemberRanks = (myGuild,type,time,from,to) => {
  return new Promise(async function (resolve, reject) {

    const memberRanksSql = `SELECT * FROM ${getGuildMemberRanksSql(myGuild)} AS memberranks
        ORDER BY ${type+time} DESC LIMIT ` + (from-1) + `,` + (to-(from-1));

    db.query(`${memberRanksSql}`, function (err, ranks, fields) {
      if (err) return reject(err)

      for (rank of ranks)
        rank.levelProgression = fct.getLevelProgression(rank['totalscorealltime'],myGuild);

      return resolve(ranks);
    });
  });
}

// All scores for one member
exports.getGuildMemberRank = function(myGuild,userId) {
  return new Promise(async function (resolve, reject) {

    db.query(`SELECT * FROM ${getGuildMemberRankSql(myGuild,userId)}
        AS memberrank`, function (err, results, fields) {
      if (err) return reject(err);
      if (results.length == 0)
        return resolve(null);

      return resolve(results[0]);
    });
  });
}

// Positions of every type of one member within a guild
exports.getGuildMemberRankPosition = function(myGuild,userId,type,time) {
  return new Promise(async function (resolve, reject) {
    db.query(`SELECT (COUNT(*) + 1) AS count FROM ${getGuildMemberRanksSql(myGuild)}
        AS memberranks WHERE memberranks.${type+time} >
        (SELECT ${type+time} FROM ${getGuildMemberRankSql(myGuild,userId)} AS alias2)
        `, function (err, results, fields) {
      if (err) return reject(err);
      if (results.length == 0)
        return resolve(null);

      return resolve(results[0].count);
    });
  });
}

// Most active channels within a guild
exports.getChannelRanks = (myGuild,type,time,from,to) => {
  return new Promise(async function (resolve, reject) {
      sql = `SELECT channelid,
          SUM(${time}) AS ${time} FROM ${type}
          WHERE guildid = '${myGuild.guildid}' AND alltime != 0 GROUP BY channelid
          ORDER BY ${time} DESC LIMIT ` + (from-1) + `,` + (to-(from-1));

    db.query(`${sql}`, function (err, ranks, fields) {
      if (err) return reject(err)

      return resolve(ranks);
    });
  });
}

// Most active Members of a specific channel
exports.getChannelMemberRanks = (myGuild,channelId,type,time,from,to) => {
  return new Promise(async function (resolve, reject) {
    sql = `SELECT userid,${time} FROM ${type}
        WHERE guildid = '${myGuild.guildid}' AND channelid = '${channelId}' AND alltime != 0
        ORDER BY ${time} DESC LIMIT ` + (from-1) + `,` + (to-(from-1));

    db.query(`${sql}`, function (err, ranks, fields) {
      if (err) return reject(err)

      return resolve(ranks);
    });
  });
}

// Most active channels of a certain member
exports.getGuildMemberChannelRanks = function(myGuild,userId,type,time,from,to) {
  return new Promise(async function (resolve, reject) {
    db.query(`SELECT channelid,${time} FROM ${type}
        WHERE guildid = '${myGuild.guildid}' AND userid = '${userId}' AND alltime != 0
        ORDER BY ${time} DESC
        LIMIT ` + (from-1) + `,` + (to-(from-1)), function (err, results, fields) {
      if (err) return reject(err);
      if (results.length == 0)
        return resolve(null);

      return resolve(results);
    });
  });
}

exports.countGuildRanks = function(myGuild) {
  return new Promise(async function (resolve, reject) {
    db.query(`SELECT COUNT(*) AS count FROM ${getGuildMemberRanksSql(myGuild)} AS alias1`, function (err, results, fields) {
      if (err) return reject(err);
      if (results.length == 0)
        return resolve(null);

      return resolve(results[0].count);
    });
  });
}

exports.getGuildMemberTotalScore = function(myGuild,userId) {
  return new Promise(async function (resolve, reject) {
    db.query(`${getGuildMemberTotalScoreSql(myGuild,userId)}`, function (err, results, fields) {
      if (err) return reject(err);
      if (results.length == 0)
        return resolve(null);

      return resolve(results[0].totalscorealltime);
    });
  });
}

/* exports.getRankedGuildMemberIds = function(guildId) {
  return new Promise(async function (resolve, reject) {
    db.query(`(SELECT userid FROM voiceminute WHERE guildid = '${guildId}' AND alltime != 0)
        UNION (SELECT userid FROM textmessage WHERE guildid = '${guildId}' AND alltime != 0)
        UNION (SELECT userid FROM vote WHERE guildid = '${guildId}' AND alltime != 0)
        UNION (SELECT userid FROM bonus WHERE guildid = '${guildId}' AND alltime != 0)`,
      function (err, results, fields) {
      if (err) return reject(err);

      return resolve(results);
    });
  });
} */

function getGuildMemberTotalScoreSql(myGuild,userId) {
  const voicerankSql = `(SELECT userid,
        SUM(alltime) AS voiceminutealltime
        FROM voiceminute WHERE guildid = '${myGuild.guildid}' AND userid = '${userId}' AND alltime != 0
        GROUP BY userid) AS voicerank`;
  const textrankSql = `(SELECT userid,
        SUM(alltime) AS textmessagealltime
        FROM textmessage WHERE guildid = '${myGuild.guildid}' AND userid = '${userId}' AND alltime != 0
        GROUP BY userid) AS textrank`;
  const voterankSql = `(SELECT userid,
        alltime AS votealltime
        FROM vote WHERE guildid = '${myGuild.guildid}' AND userid = '${userId}' AND alltime != 0) AS voterank`;
  const bonusrankSql = `(SELECT userid,
        alltime AS bonusalltime
        FROM bonus WHERE guildid = '${myGuild.guildid}' AND userid = '${userId}' AND alltime != 0) AS bonusrank`;
  const memberIdSql = `(SELECT '${userId}' AS userid) AS userids`;

  const memberRankRawSql = `(SELECT
      userids.userid AS userid,
      IFNULL(voiceminutealltime,0) * ${myGuild.pointspervoiceminute} AS voiceminutescorealltime,
      IFNULL(textmessagealltime,0) * ${myGuild.pointspertextmessage} AS textmessagescorealltime,
      IFNULL(votealltime,0) * ${myGuild.pointspervote} AS votescorealltime,
      IFNULL(bonusalltime,0) AS bonusscorealltime
      FROM ${memberIdSql}
      LEFT JOIN ${voicerankSql} ON userids.userid = voicerank.userid
      LEFT JOIN ${textrankSql} ON userids.userid = textrank.userid
      LEFT JOIN ${voterankSql} ON userids.userid = voterank.userid
      LEFT JOIN ${bonusrankSql} ON userids.userid = bonusrank.userid) AS memberrankraw`;

  const memberTotalScoreAlltimeSql = `SELECT (voiceminutescorealltime + textmessagescorealltime + votescorealltime + bonusscorealltime) AS totalscorealltime FROM ${memberRankRawSql}`;

  return memberTotalScoreAlltimeSql;
}

function getGuildMemberRanksSql(myGuild) {
  const voiceranksSql = `(SELECT userid,
      SUM(alltime) AS voiceminutealltime,
      SUM(year) AS voiceminuteyear,
      SUM(month) AS voiceminutemonth,
      SUM(week) AS voiceminuteweek,
      SUM(day) AS voiceminuteday
      FROM voiceminute WHERE guildid = '${myGuild.guildid}' AND alltime != 0
      GROUP BY userid) AS voiceranks`;
  const textranksSql = `(SELECT userid,
      SUM(alltime) AS textmessagealltime,
      SUM(year) AS textmessageyear,
      SUM(month) AS textmessagemonth,
      SUM(week) AS textmessageweek,
      SUM(day) AS textmessageday
      FROM textmessage WHERE guildid = '${myGuild.guildid}' AND alltime != 0
      GROUP BY userid) AS textranks`;
  const voteranksSql = `(SELECT userid,
      alltime AS votealltime,
      year AS voteyear,
      month AS votemonth,
      week AS voteweek,
      day AS voteday
      FROM vote WHERE guildid = '${myGuild.guildid}' AND alltime != 0) AS voteranks`;
  const bonusranksSql = `(SELECT userid,
      alltime AS bonusalltime,
      year AS bonusyear,
      month AS bonusmonth,
      week AS bonusweek,
      day AS bonusday
      FROM bonus WHERE guildid = '${myGuild.guildid}' AND alltime != 0) AS bonusranks`;
  const memberIdsSql = `((SELECT userid FROM voiceminute WHERE guildid = '${myGuild.guildid}' AND alltime != 0)
      UNION (SELECT userid FROM textmessage WHERE guildid = '${myGuild.guildid}' AND alltime != 0)
      UNION (SELECT userid FROM vote WHERE guildid = '${myGuild.guildid}' AND alltime != 0)
      UNION (SELECT userid FROM bonus WHERE guildid = '${myGuild.guildid}' AND alltime != 0)) AS userids`;

  const memberRanksRawSql = `(SELECT
      userids.userid AS userid,
      IFNULL(voiceminutealltime,0) * ${myGuild.pointspervoiceminute} AS voiceminutescorealltime,
      IFNULL(voiceminuteyear,0) * ${myGuild.pointspervoiceminute} AS voiceminutescoreyear,
      IFNULL(voiceminutemonth,0) * ${myGuild.pointspervoiceminute} AS voiceminutescoremonth,
      IFNULL(voiceminuteweek,0) * ${myGuild.pointspervoiceminute} AS voiceminutescoreweek,
      IFNULL(voiceminuteday,0) * ${myGuild.pointspervoiceminute} AS voiceminutescoreday,
      IFNULL(textmessagealltime,0) * ${myGuild.pointspertextmessage} AS textmessagescorealltime,
      IFNULL(textmessageyear,0) * ${myGuild.pointspertextmessage} AS textmessagescoreyear,
      IFNULL(textmessagemonth,0) * ${myGuild.pointspertextmessage} AS textmessagescoremonth,
      IFNULL(textmessageweek,0) * ${myGuild.pointspertextmessage} AS textmessagescoreweek,
      IFNULL(textmessageday,0) * ${myGuild.pointspertextmessage} AS textmessagescoreday,
      IFNULL(votealltime,0) * ${myGuild.pointspervote} AS votescorealltime,
      IFNULL(voteyear,0) * ${myGuild.pointspervote} AS votescoreyear,
      IFNULL(votemonth,0) * ${myGuild.pointspervote} AS votescoremonth,
      IFNULL(voteweek,0) * ${myGuild.pointspervote} AS votescoreweek,
      IFNULL(voteday,0) * ${myGuild.pointspervote} AS votescoreday,
      IFNULL(bonusalltime,0) * ${myGuild.pointsperbonus} AS bonusscorealltime,
      IFNULL(bonusyear,0) * ${myGuild.pointsperbonus} AS bonusscoreyear,
      IFNULL(bonusmonth,0) * ${myGuild.pointsperbonus} AS bonusscoremonth,
      IFNULL(bonusweek,0) * ${myGuild.pointsperbonus} AS bonusscoreweek,
      IFNULL(bonusday,0) * ${myGuild.pointsperbonus} AS bonusscoreday,
      IFNULL(voiceminutealltime,0) AS voiceminutealltime,
      IFNULL(voiceminuteyear,0) AS voiceminuteyear,
      IFNULL(voiceminutemonth,0) AS voiceminutemonth,
      IFNULL(voiceminuteweek,0) AS voiceminuteweek,
      IFNULL(voiceminuteday,0) AS voiceminuteday,
      IFNULL(textmessagealltime,0) AS textmessagealltime,
      IFNULL(textmessageyear,0) AS textmessageyear,
      IFNULL(textmessagemonth,0) AS textmessagemonth,
      IFNULL(textmessageweek,0) AS textmessageweek,
      IFNULL(textmessageday,0) AS textmessageday,
      IFNULL(votealltime,0) AS votealltime,
      IFNULL(voteyear,0) AS voteyear,
      IFNULL(votemonth,0) AS votemonth,
      IFNULL(voteweek,0) AS voteweek,
      IFNULL(voteday,0) AS voteday,
      IFNULL(bonusalltime,0) AS bonusalltime,
      IFNULL(bonusyear,0) AS bonusyear,
      IFNULL(bonusmonth,0) AS bonusmonth,
      IFNULL(bonusweek,0) AS bonusweek,
      IFNULL(bonusday,0) AS bonusday
      FROM ${memberIdsSql}
      LEFT JOIN ${voiceranksSql} ON userids.userid = voiceranks.userid
      LEFT JOIN ${textranksSql} ON userids.userid = textranks.userid
      LEFT JOIN ${voteranksSql} ON userids.userid = voteranks.userid
      LEFT JOIN ${bonusranksSql} ON userids.userid = bonusranks.userid) AS memberranksraw`;

  const memberRanksSql = `(SELECT memberranksraw.*,
      (voiceminutescorealltime + textmessagescorealltime + votescorealltime + bonusscorealltime) AS totalscorealltime,
      (voiceminutescoreyear + textmessagescoreyear + votescoreyear + bonusscoreyear) AS totalscoreyear,
      (voiceminutescoremonth + textmessagescoremonth + votescoremonth + bonusscoremonth) AS totalscoremonth,
      (voiceminutescoreweek + textmessagescoreweek + votescoreweek + bonusscoreweek) AS totalscoreweek,
      (voiceminutescoreday + textmessagescoreday + votescoreday + bonusscoreday) AS totalscoreday FROM ${memberRanksRawSql})`;

  return memberRanksSql;
}

function getGuildMemberRankSql(myGuild,userId) {
  const voicerankSql = `(SELECT userid,
        SUM(alltime) AS voiceminutealltime,
        SUM(year) AS voiceminuteyear,
        SUM(month) AS voiceminutemonth,
        SUM(week) AS voiceminuteweek,
        SUM(day) AS voiceminuteday
        FROM voiceminute WHERE guildid = '${myGuild.guildid}' AND userid = '${userId}' AND alltime != 0
        GROUP BY userid) AS voicerank`;
  const textrankSql = `(SELECT userid,
        SUM(alltime) AS textmessagealltime,
        SUM(year) AS textmessageyear,
        SUM(month) AS textmessagemonth,
        SUM(week) AS textmessageweek,
        SUM(day) AS textmessageday
        FROM textmessage WHERE guildid = '${myGuild.guildid}' AND userid = '${userId}' AND alltime != 0
        GROUP BY userid) AS textrank`;
  const voterankSql = `(SELECT userid,
        alltime AS votealltime,
        year AS voteyear,
        month AS votemonth,
        week AS voteweek,
        day AS voteday
        FROM vote WHERE guildid = '${myGuild.guildid}' AND userid = '${userId}' AND alltime != 0) AS voterank`;
  const bonusrankSql = `(SELECT userid,
        alltime AS bonusalltime,
        year AS bonusyear,
        month AS bonusmonth,
        week AS bonusweek,
        day AS bonusday
        FROM bonus WHERE guildid = '${myGuild.guildid}' AND userid = '${userId}' AND alltime != 0) AS bonusrank`;
  const memberIdSql = `(SELECT '${userId}' AS userid) AS userids`;

  const memberRankRawSql = `(SELECT
      userids.userid AS userid,
      IFNULL(voiceminutealltime,0) * ${myGuild.pointspervoiceminute} AS voiceminutescorealltime,
      IFNULL(voiceminuteyear,0) * ${myGuild.pointspervoiceminute} AS voiceminutescoreyear,
      IFNULL(voiceminutemonth,0) * ${myGuild.pointspervoiceminute} AS voiceminutescoremonth,
      IFNULL(voiceminuteweek,0) * ${myGuild.pointspervoiceminute} AS voiceminutescoreweek,
      IFNULL(voiceminuteday,0) * ${myGuild.pointspervoiceminute} AS voiceminutescoreday,
      IFNULL(textmessagealltime,0) * ${myGuild.pointspertextmessage} AS textmessagescorealltime,
      IFNULL(textmessageyear,0) * ${myGuild.pointspertextmessage} AS textmessagescoreyear,
      IFNULL(textmessagemonth,0) * ${myGuild.pointspertextmessage} AS textmessagescoremonth,
      IFNULL(textmessageweek,0) * ${myGuild.pointspertextmessage} AS textmessagescoreweek,
      IFNULL(textmessageday,0) * ${myGuild.pointspertextmessage} AS textmessagescoreday,
      IFNULL(votealltime,0) * ${myGuild.pointspervote} AS votescorealltime,
      IFNULL(voteyear,0) * ${myGuild.pointspervote} AS votescoreyear,
      IFNULL(votemonth,0) * ${myGuild.pointspervote} AS votescoremonth,
      IFNULL(voteweek,0) * ${myGuild.pointspervote} AS votescoreweek,
      IFNULL(voteday,0) * ${myGuild.pointspervote} AS votescoreday,
      IFNULL(bonusalltime,0) * ${myGuild.pointsperbonus} AS bonusscorealltime,
      IFNULL(bonusyear,0) * ${myGuild.pointsperbonus} AS bonusscoreyear,
      IFNULL(bonusmonth,0) * ${myGuild.pointsperbonus} AS bonusscoremonth,
      IFNULL(bonusweek,0) * ${myGuild.pointsperbonus} AS bonusscoreweek,
      IFNULL(bonusday,0) * ${myGuild.pointsperbonus} AS bonusscoreday,
      IFNULL(voiceminutealltime,0) AS voiceminutealltime,
      IFNULL(voiceminuteyear,0) AS voiceminuteyear,
      IFNULL(voiceminutemonth,0) AS voiceminutemonth,
      IFNULL(voiceminuteweek,0) AS voiceminuteweek,
      IFNULL(voiceminuteday,0) AS voiceminuteday,
      IFNULL(textmessagealltime,0) AS textmessagealltime,
      IFNULL(textmessageyear,0) AS textmessageyear,
      IFNULL(textmessagemonth,0) AS textmessagemonth,
      IFNULL(textmessageweek,0) AS textmessageweek,
      IFNULL(textmessageday,0) AS textmessageday,
      IFNULL(votealltime,0) AS votealltime,
      IFNULL(voteyear,0) AS voteyear,
      IFNULL(votemonth,0) AS votemonth,
      IFNULL(voteweek,0) AS voteweek,
      IFNULL(voteday,0) AS voteday,
      IFNULL(bonusalltime,0) AS bonusalltime,
      IFNULL(bonusyear,0) AS bonusyear,
      IFNULL(bonusmonth,0) AS bonusmonth,
      IFNULL(bonusweek,0) AS bonusweek,
      IFNULL(bonusday,0) AS bonusday
      FROM ${memberIdSql}
      LEFT JOIN ${voicerankSql} ON userids.userid = voicerank.userid
      LEFT JOIN ${textrankSql} ON userids.userid = textrank.userid
      LEFT JOIN ${voterankSql} ON userids.userid = voterank.userid
      LEFT JOIN ${bonusrankSql} ON userids.userid = bonusrank.userid) AS memberrankraw`;

  const memberRankSql = `(SELECT memberrankraw.*,
      (voiceminutescorealltime + textmessagescorealltime + votescorealltime + bonusscorealltime) AS totalscorealltime,
      (voiceminutescoreyear + textmessagescoreyear + votescoreyear + bonusscoreyear) AS totalscoreyear,
      (voiceminutescoremonth + textmessagescoremonth + votescoremonth + bonusscoremonth) AS totalscoremonth,
      (voiceminutescoreweek + textmessagescoreweek + votescoreweek + bonusscoreweek) AS totalscoreweek,
      (voiceminutescoreday + textmessagescoreday + votescoreday + bonusscoreday) AS totalscoreday FROM ${memberRankRawSql})`;

  return memberRankSql;
}
