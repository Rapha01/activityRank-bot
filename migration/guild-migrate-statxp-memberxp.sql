-- > SCRIPTED_FILE
-- > EXPECTED_ARGS: guildId

-- This script will migrate all XP calculated into stored guildMember XP for all members in a guild.
-- The script is based on src/bot/models/rankModel.ts (getGuildMemberRanksSql) and migrate-statxp-memberxp.sql.

-- **It does not conform to the SQL syntax**: variables are replaced with the following:
-- {{guildId}}: the ID of the queried guild


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

INSERT INTO guildMember (guildId, userId, alltime, year, month, week, day)
SELECT
  {{guildId}},
  userId,
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
  IFNULL(bonusDay,0) * @xpPerBonus AS bonusScoreDay
  FROM ((SELECT userId FROM voiceMinute WHERE guildId = {{guildId}} AND alltime != 0)
      UNION (SELECT userId FROM textMessage WHERE guildId = {{guildId}} AND alltime != 0)
      UNION (SELECT userId FROM vote WHERE guildId = {{guildId}} AND alltime != 0)
      UNION (SELECT userId FROM bonus WHERE guildId = {{guildId}} AND alltime != 0)) AS userIds
  LEFT JOIN (SELECT userId,
        SUM(alltime) AS voiceMinuteAlltime,
        SUM(year) AS voiceMinuteYear,
        SUM(month) AS voiceMinuteMonth,
        SUM(week) AS voiceMinuteWeek,
        SUM(day) AS voiceMinuteDay
        FROM voiceMinute WHERE guildId = {{guildId}} AND alltime != 0
        GROUP BY userId) AS voicerank ON userIds.userId = voicerank.userId
  LEFT JOIN (SELECT userId,
        SUM(alltime) AS textMessageAlltime,
        SUM(year) AS textMessageYear,
        SUM(month) AS textMessageMonth,
        SUM(week) AS textMessageWeek,
        SUM(day) AS textMessageDay
        FROM textMessage WHERE guildId = {{guildId}} AND alltime != 0
        GROUP BY userId) AS textrank ON userIds.userId = textrank.userId
  LEFT JOIN (SELECT userId,
        alltime AS voteAlltime,
        year AS voteYear,
        month AS voteMonth,
        week AS voteWeek,
        day AS voteDay
        FROM vote WHERE guildId = {{guildId}} AND alltime != 0) AS voterank ON userIds.userId = voterank.userId
  LEFT JOIN (SELECT userId,
        alltime AS inviteAlltime,
        year AS inviteYear,
        month AS inviteMonth,
        week AS inviteWeek,
        day AS inviteDay
        FROM invite WHERE guildId = {{guildId}} AND alltime != 0) AS inviterank ON userIds.userId = inviterank.userId
  LEFT JOIN (SELECT userId,
        alltime AS bonusAlltime,
        year AS bonusYear,
        month AS bonusMonth,
        week AS bonusWeek,
        day AS bonusDay
        FROM bonus WHERE guildId = {{guildId}} AND alltime != 0) AS bonusrank ON userIds.userId = bonusrank.userId)
AS memberrankraw
ON DUPLICATE KEY UPDATE alltime = (voiceMinuteScoreAlltime + textMessageScoreAlltime + voteScoreAlltime + inviteScoreAlltime + bonusScoreAlltime),
year = (voiceMinuteScoreYear + textMessageScoreYear + voteScoreYear + inviteScoreYear + bonusScoreYear),
month = (voiceMinuteScoreMonth + textMessageScoreMonth + voteScoreMonth + inviteScoreMonth + bonusScoreMonth),
week = (voiceMinuteScoreWeek + textMessageScoreWeek + voteScoreWeek + inviteScoreWeek + bonusScoreWeek),
day = (voiceMinuteScoreDay + textMessageScoreDay + voteScoreDay + inviteScoreDay + bonusScoreDay);

SELECT ROW_COUNT();
