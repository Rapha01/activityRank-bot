SELECT 
  userId,
  (memberAlltime = scoreAlltime) AS checkAlltime,
  (memberYear = scoreYear) AS checkYear,
  (memberMonth = scoreMonth) AS checkMonth,
  (memberWeek = scoreWeek) AS checkWeek,
  (memberDay = scoreDay) AS checkDay,
  (memberAlltime = scoreAlltime AND memberYear = scoreYear AND memberMonth = scoreMonth AND memberWeek = scoreWeek AND memberDay = scoreDay) AS checkAll
FROM
(SELECT 
  userId,
  (voiceMinuteScoreAlltime + textMessageScoreAlltime + voteScoreAlltime + inviteScoreAlltime + bonusScoreAlltime) AS scoreAlltime,
  (voiceMinuteScoreYear + textMessageScoreYear + voteScoreYear + inviteScoreYear + bonusScoreYear) AS scoreYear,
  (voiceMinuteScoreMonth + textMessageScoreMonth + voteScoreMonth + inviteScoreMonth + bonusScoreMonth) AS scoreMonth,
  (voiceMinuteScoreWeek + textMessageScoreWeek + voteScoreWeek + inviteScoreWeek + bonusScoreWeek) AS scoreWeek,
  (voiceMinuteScoreDay + textMessageScoreDay + voteScoreDay + inviteScoreDay + bonusScoreDay) AS scoreDay,
  memberAlltime,
  memberYear,
  memberMonth,
  memberWeek,
  memberDay
FROM (SELECT
  userIds.userId AS userId,
  IFNULL(voiceMinuteAlltime,0) * ? AS voiceMinuteScoreAlltime,
  IFNULL(voiceMinuteYear,0) * ? AS voiceMinuteScoreYear,
  IFNULL(voiceMinuteMonth,0) * ? AS voiceMinuteScoreMonth,
  IFNULL(voiceMinuteWeek,0) * ? AS voiceMinuteScoreWeek,
  IFNULL(voiceMinuteDay,0) * ? AS voiceMinuteScoreDay,
  IFNULL(textMessageAlltime,0) * ? AS textMessageScoreAlltime,
  IFNULL(textMessageYear,0) * ? AS textMessageScoreYear,
  IFNULL(textMessageMonth,0) * ? AS textMessageScoreMonth,
  IFNULL(textMessageWeek,0) * ? AS textMessageScoreWeek,
  IFNULL(textMessageDay,0) * ? AS textMessageScoreDay,
  IFNULL(voteAlltime,0) * ? AS voteScoreAlltime,
  IFNULL(voteYear,0) * ? AS voteScoreYear,
  IFNULL(voteMonth,0) * ? AS voteScoreMonth,
  IFNULL(voteWeek,0) * ? AS voteScoreWeek,
  IFNULL(voteDay,0) * ? AS voteScoreDay,
  IFNULL(inviteAlltime,0) * ? AS inviteScoreAlltime,
  IFNULL(inviteYear,0) * ? AS inviteScoreYear,
  IFNULL(inviteMonth,0) * ? AS inviteScoreMonth,
  IFNULL(inviteWeek,0) * ? AS inviteScoreWeek,
  IFNULL(inviteDay,0) * ? AS inviteScoreDay,
  IFNULL(bonusAlltime,0) * ? AS bonusScoreAlltime,
  IFNULL(bonusYear,0) * ? AS bonusScoreYear,
  IFNULL(bonusMonth,0) * ? AS bonusScoreMonth,
  IFNULL(bonusWeek,0) * ? AS bonusScoreWeek,
  IFNULL(bonusDay,0) * ? AS bonusScoreDay,
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
  IFNULL(bonusDay,0) AS bonusDay,
  memberAlltime,
  memberYear,
  memberMonth,
  memberWeek,
  memberDay
  FROM ((SELECT userId FROM dbShard.voiceMinute WHERE guildId = ? AND alltime != 0)
      UNION (SELECT userId FROM dbShard.textMessage WHERE guildId = ? AND alltime != 0)
      UNION (SELECT userId FROM dbShard.vote WHERE guildId = ? AND alltime != 0)
      UNION (SELECT userId FROM dbShard.invite WHERE guildId = ? AND alltime != 0)
      UNION (SELECT userId FROM dbShard.bonus WHERE guildId = ? AND alltime != 0)) AS userIds
  LEFT JOIN (SELECT userId,
        SUM(alltime) AS voiceMinuteAlltime,
        SUM(year) AS voiceMinuteYear,
        SUM(month) AS voiceMinuteMonth,
        SUM(week) AS voiceMinuteWeek,
        SUM(day) AS voiceMinuteDay
        FROM dbShard.voiceMinute WHERE guildId = ? AND alltime != 0
        GROUP BY userId) AS voicerank ON userIds.userId = voicerank.userId
  LEFT JOIN (SELECT userId,
        SUM(alltime) AS textMessageAlltime,
        SUM(year) AS textMessageYear,
        SUM(month) AS textMessageMonth,
        SUM(week) AS textMessageWeek,
        SUM(day) AS textMessageDay
        FROM dbShard.textMessage WHERE guildId = ? AND alltime != 0
        GROUP BY userId) AS textrank ON userIds.userId = textrank.userId
  LEFT JOIN (SELECT userId,
        alltime AS voteAlltime,
        year AS voteYear,
        month AS voteMonth,
        week AS voteWeek,
        day AS voteDay
        FROM dbShard.vote WHERE guildId = ? AND alltime != 0) AS voterank ON userIds.userId = voterank.userId
  LEFT JOIN (SELECT userId,
        alltime AS inviteAlltime,
        year AS inviteYear,
        month AS inviteMonth,
        week AS inviteWeek,
        day AS inviteDay
        FROM dbShard.invite WHERE guildId = ? AND alltime != 0) AS inviterank ON userIds.userId = inviterank.userId
  LEFT JOIN (SELECT userId,
        alltime AS bonusAlltime,
        year AS bonusYear,
        month AS bonusMonth,
        week AS bonusWeek,
        day AS bonusDay
        FROM dbShard.bonus WHERE guildId = ? AND alltime != 0) AS bonusrank ON userIds.userId = bonusrank.userId
  LEFT JOIN (SELECT userId, 
        alltime as memberAlltime,
        year as memberYear,
        month as memberMonth,
        week as memberWeek,
        day as memberDay
        FROM dbShard.guildMember WHERE guildId = ?) AS memberrank ON userIds.userId = memberrank.userId)
AS memberrankraw) AS memberranks;
