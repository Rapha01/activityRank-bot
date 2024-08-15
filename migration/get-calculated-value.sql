-- > SCRIPTED_FILE
-- > EXPECTED_ARGS: guildId, userId

-- This script executes the equivalent action to the /rank command: for a given member, 
-- it finds an integer for each of `{category}Score{timeframe}` where
-- {category} is one of `voiceMinute`, `textMessage`, `vote`, `invite`, `bonus`, or `total`, 
-- and {timeframe} is one of `Alltime`, `Year`, `Month`, `Week`, or `Day`.
-- It will also select statistic counts, in the format {category}{timeframe}` (note that there is no "Score" separator).

-- The script is based on src/bot/models/rankModel.ts (getGuildMemberRankSql).

-- **It does not conform to the SQL syntax**: variables are replaced with the following:
-- {{guildId}}: the ID of the queried guild
-- {{userId}}: the ID of the queried user


USE dbShard;

SELECT
  xpPerVoiceMinute,
  xpPerTextMessage,
  xpPerVote,
  xpPerInvite,
  xpPerBonus
FROM
  guild
WHERE
  guildId = {{guildId}} 
INTO @xpPerVoiceMinute,
  @xpPerTextMessage,
  @xpPerVote,
  @xpPerInvite,
  @xpPerBonus;

SELECT memberrankraw.*,
  (voiceMinuteScoreAlltime + textMessageScoreAlltime + voteScoreAlltime + inviteScoreAlltime + bonusScoreAlltime) AS totalScoreAlltime,
  (voiceMinuteScoreYear + textMessageScoreYear + voteScoreYear + inviteScoreYear + bonusScoreYear) AS totalScoreYear,
  (voiceMinuteScoreMonth + textMessageScoreMonth + voteScoreMonth + inviteScoreMonth + bonusScoreMonth) AS totalScoreMonth,
  (voiceMinuteScoreWeek + textMessageScoreWeek + voteScoreWeek + inviteScoreWeek + bonusScoreWeek) AS totalScoreWeek,
  (voiceMinuteScoreDay + textMessageScoreDay + voteScoreDay + inviteScoreDay + bonusScoreDay) AS totalScoreDay 
FROM (SELECT
  userIds.userId AS userId,
  IFNULL(voiceMinuteAlltime,0) * @xpPerVoiceMinute AS voiceMinuteScoreAlltime,
  IFNULL(voiceMinuteYear,0) * @xpPerVoiceMinute AS voiceMinuteScoreYear,
  IFNULL(voiceMinuteMonth,0) * @xpPerVoiceMinute AS voiceMinuteScoreMonth,
  IFNULL(voiceMinuteWeek,0) * @xpPerVoiceMinute AS voiceMinuteScoreWeek,
  IFNULL(voiceMinuteDay,0) * @xpPerVoiceMinute AS voiceMinuteScoreDay,
  IFNULL(textMessageAlltime,0) * @xpPerTextMessage AS textMessageScoreAlltime,
  IFNULL(textMessageYear,0) * @xpPerTextMessage AS textMessageScoreYear,
  IFNULL(textMessageMonth,0) * @xpPerTextMessage AS textMessageScoreMonth,
  IFNULL(textMessageWeek,0) * @xpPerTextMessage AS textMessageScoreWeek,
  IFNULL(textMessageDay,0) * @xpPerTextMessage AS textMessageScoreDay,
  IFNULL(voteAlltime,0) * @xpPerVote AS voteScoreAlltime,
  IFNULL(voteYear,0) * @xpPerVote AS voteScoreYear,
  IFNULL(voteMonth,0) * @xpPerVote AS voteScoreMonth,
  IFNULL(voteWeek,0) * @xpPerVote AS voteScoreWeek,
  IFNULL(voteDay,0) * @xpPerVote AS voteScoreDay,
  IFNULL(inviteAlltime,0) * @xpPerInvite AS inviteScoreAlltime,
  IFNULL(inviteYear,0) * @xpPerInvite AS inviteScoreYear,
  IFNULL(inviteMonth,0) * @xpPerInvite AS inviteScoreMonth,
  IFNULL(inviteWeek,0) * @xpPerInvite AS inviteScoreWeek,
  IFNULL(inviteDay,0) * @xpPerInvite AS inviteScoreDay,
  IFNULL(bonusAlltime,0) * @xpPerBonus AS bonusScoreAlltime,
  IFNULL(bonusYear,0) * @xpPerBonus AS bonusScoreYear,
  IFNULL(bonusMonth,0) * @xpPerBonus AS bonusScoreMonth,
  IFNULL(bonusWeek,0) * @xpPerBonus AS bonusScoreWeek,
  IFNULL(bonusDay,0) * @xpPerBonus AS bonusScoreDay,
  IFNULL(voiceMinuteAlltime,0) AS voiceMinuteAlltime,
  IFNULL(voiceMinuteYear,0) AS voiceMinuteYear,
  IFNULL(voiceMinuteMonth,0) AS voiceMinuteMonth,
  IFNULL(voiceMinuteWeek,0) AS voiceMinuteWeek,
  IFNULL(voiceMinuteDay,0) AS voiceMinuteDay,
  IFNULL(textMessageAlltime,0) AS textMessageAlltime,
  IFNULL(textMessageYear,0) AS textMessageYear,
  IFNULL(textMessageMonth,0) AS textMessageMonth,
  IFNULL(textMessageWeek,0) AS textMessageWeek,
  IFNULL(textMessageDay,0) AS textMessageDay,
  IFNULL(voteAlltime,0) AS voteAlltime,
  IFNULL(voteYear,0) AS voteYear,
  IFNULL(voteMonth,0) AS voteMonth,
  IFNULL(voteWeek,0) AS voteWeek,
  IFNULL(voteDay,0) AS voteDay,
  IFNULL(inviteAlltime,0) AS inviteAlltime,
  IFNULL(inviteYear,0) AS inviteYear,
  IFNULL(inviteMonth,0) AS inviteMonth,
  IFNULL(inviteWeek,0) AS inviteWeek,
  IFNULL(inviteDay,0) AS inviteDay,
  IFNULL(bonusAlltime,0) AS bonusAlltime,
  IFNULL(bonusYear,0) AS bonusYear,
  IFNULL(bonusMonth,0) AS bonusMonth,
  IFNULL(bonusWeek,0) AS bonusWeek,
  IFNULL(bonusDay,0) AS bonusDay
  FROM (SELECT {{userId}} AS userId) AS userIds
  LEFT JOIN (SELECT userId,
        SUM(alltime) AS voiceMinuteAlltime,
        SUM(year) AS voiceMinuteYear,
        SUM(month) AS voiceMinuteMonth,
        SUM(week) AS voiceMinuteWeek,
        SUM(day) AS voiceMinuteDay
        FROM voiceMinute WHERE guildId = {{guildId}} AND userId = {{userId}} AND alltime != 0
        GROUP BY userId) AS voicerank ON userIds.userId = voicerank.userId
  LEFT JOIN (SELECT userId,
        SUM(alltime) AS textMessageAlltime,
        SUM(year) AS textMessageYear,
        SUM(month) AS textMessageMonth,
        SUM(week) AS textMessageWeek,
        SUM(day) AS textMessageDay
        FROM textMessage WHERE guildId = {{guildId}} AND userId = {{userId}} AND alltime != 0
        GROUP BY userId) AS textrank ON userIds.userId = textrank.userId
  LEFT JOIN (SELECT userId,
        alltime AS voteAlltime,
        year AS voteYear,
        month AS voteMonth,
        week AS voteWeek,
        day AS voteDay
        FROM vote WHERE guildId = {{guildId}} AND userId = {{userId}} AND alltime != 0) AS voterank ON userIds.userId = voterank.userId
  LEFT JOIN (SELECT userId,
        alltime AS inviteAlltime,
        year AS inviteYear,
        month AS inviteMonth,
        week AS inviteWeek,
        day AS inviteDay
        FROM invite WHERE guildId = {{guildId}} AND userId = {{userId}} AND alltime != 0) AS inviterank ON userIds.userId = inviterank.userId
  LEFT JOIN (SELECT userId,
        alltime AS bonusAlltime,
        year AS bonusYear,
        month AS bonusMonth,
        week AS bonusWeek,
        day AS bonusDay
        FROM bonus WHERE guildId = {{guildId}} AND userId = {{userId}} AND alltime != 0) AS bonusrank ON userIds.userId = bonusrank.userId)
AS memberrankraw;
