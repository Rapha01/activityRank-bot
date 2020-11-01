{
  $jsonSchema: {
    bsonType: "object",
    properties: {
      prefix: { bsonType: "string", minLength: 1, maxLength: 10 },
      voteTag: { bsonType: "string", maxLength: 20 },
      voteEmote: { bsonType: "string", maxLength: 64 },
      bonusTag: { bsonType: "string", maxLength: 20 },
      bonusEmote: { bsonType: "string", maxLength: 64 },
      entriesPerPage: { bsonType: "int", minimum: 4, maximum: 20},
      showVoice: { bsonType: "bool" },
      showText: { bsonType: "bool" },
      showVote: { bsonType: "bool" },
      notifyLevelupDm: { bsonType: "bool" },
      notifyLevelupChannel: { bsonType: "bool" },
      notifyLevelupOnlyWithRole: { bsonType: "bool" },
      deassignAssignedRoles: { bsonType: "bool" },
      levelFactor: { bsonType: "int", minimum: 20, maximum: 400 },
      voteCooldownSeconds: { bsonType: "int", minimum: 3, maximum: 1440 },
      textMessageCooldownSeconds: { bsonType: "int", minimum: 0, maximum: 120 },
      xpPerVoiceMinute: { bsonType: "int", minimum: 0, maximum: 5 },
      xpPerTextMessage: { bsonType: "int", minimum: 0, maximum: 10 },
      xpPerVote: { bsonType: "int", minimum: 0, maximum: 100},
      xpPerBonus: { bsonType: "int", minimum: 0, maximum: 1},
      bonusPerTextMessage: { bsonType: "int", minimum: 0, maximum: 120 },
      bonusPerVoiceMinute: { bsonType: "int", minimum: 0, maximum: 120 },
      bonusPerVote: { bsonType: "int", minimum: 0, maximum: 120 },
      bonusUntilDate: { bsonType: "number" },
      allowDownVotes: { bsonType: "bool" },
      allowVoteWithoutMention: { bsonType: "bool" },
      allowMutedXp: { bsonType: "bool" },
      allowSoloXp: { bsonType: "bool" },
      post_levelup: { bsonType: "number" },
      post_serverJoin: { bsonType: "number" },
      post_serverLeave: { bsonType: "number" },
      post_voiceChannelJoin: { bsonType: "number" },
      post_voiceChannelLeave: { bsonType: "number" },
      levelupText: { bsonType: "string", maxLength: 1000 },
      serverJoinText: { bsonType: "string", maxLength: 500 },
      serverLeaveText: { bsonType: "string", maxLength: 500 },
      voiceChannelJoinText: { bsonType: "string", maxLength: 500 },
      voiceChannelLeaveText: { bsonType: "string", maxLength: 500 },
      addDate: { bsonType: "number" },
      botJoinDate: { bsonType: "number" },
      botLeaveDate: { bsonType: "number" },
      tokens: { bsonType: "number" },
      tokensFueled: { bsonType: "number" },
      roles: {
         bsonType: "array",
         required: [ "roleId" ],
         properties: {
            roleId: { bsonType: "number" },
            assignLevel: { bsonType: "int", minimum: 0 },
            deassignLevel: { bsonType: "int", minimum: 0 },
            assignText: { bsonType: "string", maxLength: 500 },
            deassignText: { bsonType: "string", maxLength: 500 },
            noXp: { bsonType: "bool" }
         }
      },
      channels: {
         bsonType: "array",
         required: [ "channelId" ],
         properties: {
            channelId: { bsonType: "number" },
            name_totalUserCount: { bsonType: "bool" },
            name_onlineUserCount: { bsonType: "bool" },
            name_activeUsersLast24h: { bsonType: "bool" },
            name_serverJoinsLast24h: { bsonType: "bool" },
            name_serverLeavesLast24h: { bsonType: "bool" },
            name_roleUserCount: { bsonType: "number" },
            name_activityUserCount: { bsonType: "string", maxLength: 300 },
            noXp: { bsonType: "bool" }
         }
      },
      members: {
        bsonType: "array",
        required: [ "userId" ],
        properties: {
          userId: { bsonType: "number" },
          notifyLevelupDm: { bsonType: "bool" },
          lastVoteDate: { bsonType: "number" },
          userJoinDate: { bsonType: "number" },
          userLeaveDate: { bsonType: "number" },
          lastVoiceActivityDate: { bsonType: "number" },
          lastTextActivityDate: { bsonType: "number" },
          tokens: { bsonType: "number" },
          tokensFueled: { bsonType: "number" }
        }
      },
      voiceMinutes: {
        bsonType: "array",
        required: [ "userId","channelId","alltime","year","month","week","day" ],
        properties: {
          userId: { bsonType: "number" },
          channelId: { bsonType: "number" },
          alltime: { bsonType: "number" },
          year: { bsonType: "number" },
          month: { bsonType: "number" },
          week: { bsonType: "number" },
          day: { bsonType: "number" }
        }
      },
      textMessages: {
        bsonType: "array",
        required: [ "userId","channelId","alltime","year","month","week","day" ],
        properties: {
          userId: { bsonType: "number" },
          channelId: { bsonType: "number" },
          alltime: { bsonType: "number" },
          year: { bsonType: "number" },
          month: { bsonType: "number" },
          week: { bsonType: "number" },
          day: { bsonType: "number" }
        }
      },
      votes: {
        bsonType: "object",
        required: [ "userId","alltime","year","month","week","day" ],
        properties: {
          userId: { bsonType: "number" },
          alltime: { bsonType: "number" },
          year: { bsonType: "number" },
          month: { bsonType: "number" },
          week: { bsonType: "number" },
          day: { bsonType: "number" }
        }
      },
      bonus: {
        bsonType: "object",
        required: [ "userId","alltime","year","month","week","day" ],
        properties: {
          userId: { bsonType: "number" },
          alltime: { bsonType: "number" },
          year: { bsonType: "number" },
          month: { bsonType: "number" },
          week: { bsonType: "number" },
          day: { bsonType: "number" }
        }
      }
    }
  }
}
