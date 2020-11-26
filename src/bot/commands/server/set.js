const guildModel = require('../../models/guild/guildModel.js');
const guildMemberModel = require('../../models/guild/guildMemberModel.js');
const resetModel = require('../../models/resetModel.js');
const fct = require('../../../util/fct.js');
const errorMsgs = require('../../../const/errorMsgs.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }
      if (args.length < 1) {
        await msg.channel.send(errorMsgs.tooFewArguments.replace('<prefix>',msg.guild.appData.prefix));
        return resolve();
      }

      let field = args[0].toLowerCase();
      const value = args.slice(1,args.length+1).join(' ');

      // SET - BASIC
      if (field == 'votetag')
        await votetag(msg,value);
      else if (field == 'voteemote')
        await voteemote(msg,value);
      else if (field == 'bonustag')
        await bonustag(msg,value);
      else if (field == 'bonusemote')
        await bonusemote(msg,value);
      else if (field == 'prefix')
        await prefix(msg,value);
      else if (field == 'textxp')
        await textxp(msg,value);
      else if (field == 'voicexp')
        await voicexp(msg,value);
      else if (field == 'invitexp')
        await invitexp(msg,value);
      else if (field == 'votexp')
        await votexp(msg,value);
      //else if (field == 'bonusxp')
        //await bonusxp(msg,value);
      else if (field == 'entriesperpage')
        await entriesperpage(msg,value);
      else if (field == 'shownicknames')
        await showNicknames(msg,value);
      else if (field == 'notifylevelupdm')
        await notifylevelupdm(msg,value);
      else if (field == 'notifylevelupcurrentchannel')
        await notifylevelupcurrentchannel(msg,value);
      else if (field == 'notifylevelupwithrole')
        await notifylevelupwithrole(msg,value);
      else if (field == 'takeawayassignedrolesonleveldown' || field == 'taarold')
        await takeawayassignedrolesonleveldown(msg,value);
      // SET - STAT
      else if (field == 'textmessagecooldown')
        await textmessagecooldown(msg,value);
      else if (field == 'xppervoiceminute')
        await xppervoiceminute(msg,value);
      else if (field == 'xppertextmessage')
        await xppertextmessage(msg,value);
      else if (field == 'xppervote')
        await xppervote(msg,value);
      else if (field == 'xpperinvite')
        await xpperinvite(msg,value);
      else if (field == 'bonuspertextmessage')
        await bonuspertextmessage(msg,value);
      else if (field == 'bonuspervoiceminute')
        await bonuspervoiceminute(msg,value);
      else if (field == 'bonuspervote')
        await bonuspervote(msg,value);
      else if (field == 'bonusperinvite')
        await bonusperinvite(msg,value);
      else if (field == 'bonusuntil')
        await bonusuntil(msg,value);
      else if (field == 'votecooldown')
        await votecooldown(msg,value);
      else if (field == 'levelfactor')
        await levelfactor(msg,value);
      else if (field == 'reactionvote')
        await reactionVote(msg,value);
      else if (field == 'allowmutedxp')
        await allowmutedxp(msg,value);
      else if (field == 'allowsoloxp')
        await allowsoloxp(msg,value);
      else if (field == 'allowinvisiblexp')
        await allowinvisiblexp(msg,value);
      else if (field == 'allowdeafenedxp')
        await allowdeafenedxp(msg,value);
      // SET - TEXT
      else if (field == 'serverjoinmessage')
        await serverjoinmessage(msg,value);
      else if (field == 'serverleavemessage')
        await serverleavemessage(msg,value);
      else if (field == 'levelupmessage')
        await levelupmessage(msg,value);
      else if (field == 'roleassignmessage')
        await roleassignmessage(msg,value);
      else if (field == 'roledeassignmessage')
        await roledeassignmessage(msg,value);
      else if (field == 'voicechanneljoinmessage')
        await voicechanneljoinmessage(msg,value);
      else if (field == 'voicechannelleavemessage')
        await voicechannelleavemessage(msg,value);

      else {
        await msg.channel.send('Invalid argument. Type ``'+msg.guild.appData.prefix+'help`` for more information');
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}

function votetag(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value.length > 20) {
        await msg.channel.send('Please use a short tag with 2 to 20 characters.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'voteTag',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function voteemote(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      //const customGuildEmoji = msg.guild.emojis.find(emoji => emoji.name == value);

      if (value.length > 64)  { // !customGuildEmoji && !emoteRegex.exec(value)) {
        await msg.channel.send('Please use a correct emote.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'voteEmote',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function bonustag(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value.length > 20) {
        await msg.channel.send('Please use a short tag with 20 characters max.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'bonusTag',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function bonusemote(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      //const customGuildEmoji = msg.guild.emojis.find(emoji => emoji.name == value);

      if (value.length > 64)  { // !customGuildEmoji && !emoteRegex.exec(value)) {
        await msg.channel.send('Please use a correct emote.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'bonusEmote',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function prefix(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value.length < 1 || value.length > 32) {
        await msg.channel.send('Please use 1 to 32 characters as prefix.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'prefix',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function entriesperpage(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value < 4 || value > 20) {
        await msg.channel.send('The entriesperpage needs to be a value within 4 and 20.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'entriesPerPage',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function showNicknames(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      const myGuild = await guildModel.storage.get(msg.guild);

      if (myGuild.showNicknames) {
        await guildModel.storage.set(msg.guild,'showNicknames',0);
        await msg.channel.send('Users *usernames* will show on all embeds and messages.');
      } else {
        await guildModel.storage.set(msg.guild,'showNicknames',1);
        await msg.channel.send('Users *nicknames* will show on all embeds and messages.');
      }
      resolve();
    } catch (e) { reject(e); }
  });
}

function textxp(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (msg.guild.appData.textXp) {
        await guildModel.storage.set(msg.guild,'textXp',0);
        await msg.channel.send('Text XP is now deactivated. It will not be shown in the stats anymore and the bot no longer counts messages in this server. Note: The already counted textmessages still add towards a user\'s totalXp - it is recommended to reset only text XP for everyone, so there is no hidden stat from the past, that is increasing a user\'s XP.');
      } else {
        await guildModel.storage.set(msg.guild,'textXp',1);
        await msg.channel.send('Text XP is now activated. It will be shown in the stats and the bot now counts messages in this server.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function voicexp(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (msg.guild.appData.voiceXp) {
        await guildModel.storage.set(msg.guild,'voiceXp',0);
        await msg.channel.send('Voice XP is now deactivated. It will not be shown in the stats anymore and the bot no longer counts voice activity in this server. Note: The already counted hours still add towards a user\'s totalXp - it is recommended to reset only voice XP for everyone, so there is no hidden stat from the past, that is increasing a user\'s XP.');
      } else {
        await guildModel.storage.set(msg.guild,'voiceXp',1);
        await msg.channel.send('Voice XP is now activated. It will be shown in the stats and the bot now counts voice activity in this server.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function invitexp(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (msg.guild.appData.inviteXp) {
        await guildModel.storage.set(msg.guild,'inviteXp',0);
        await msg.channel.send('Invite XP is now deactivated. It will not be shown in the stats anymore and the bot no longer counts invites in this server. Note: The already counted invites still add towards a user\'s totalXp - it is recommended to reset only invite XP for everyone, so there is no hidden stat from the past, that is increasing a user\'s XP.');
      } else {
        await guildModel.storage.set(msg.guild,'inviteXp',1);
        await msg.channel.send('Invite XP is now activated. It will be shown in the stats and the bot now counts invites in this server.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function votexp(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (msg.guild.appData.voteXp) {
        await guildModel.storage.set(msg.guild,'voteXp',0);
        await msg.channel.send('Vote XP is now deactivated. It will not be shown in the stats anymore and the bot no longer counts votes in this server. Note: The already counted votes still add towards a user\'s totalXp - it is recommended to reset only vote XP for everyone, so there is no hidden stat from the past, that is increasing a user\'s XP.');
      } else {
        await guildModel.storage.set(msg.guild,'voteXp',1);
        await msg.channel.send('Vote XP is now activated. It will be shown in the stats and the bot now counts votes in this server.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function bonusxp(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (msg.guild.appData.bonusXp) {
        await guildModel.storage.set(msg.guild,'bonusXp',0);
        await msg.channel.send('Bonus XP is now deactivated. It will not be shown in the stats anymore and the bot no longer counts bonus XP in this server. Note: The already counted bonus still adds towards a user\'s totalXp - it is recommended to reset only bonus XP for everyone, so there is no hidden stat from the past, that is increasing a user\'s XP.');
      } else {
        await guildModel.storage.set(msg.guild,'bonusXp',1);
        await msg.channel.send('Bonus XP is now activated. It will be shown in the stats and the bot now counts bonus XP in this server.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function notifylevelupdm(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      const myGuild = await guildModel.storage.get(msg.guild);

      if (myGuild.notifyLevelupDm) {
        await guildModel.storage.set(msg.guild,'notifyLevelupDm',0);
        await msg.channel.send('Users can no longer get notifications via direct message.');
      } else {
        await guildModel.storage.set(msg.guild,'notifyLevelupDm',1);
        await msg.channel.send('Users can now get notifications via direct message.');
      }
      resolve();
    } catch (e) { reject(e); }
  });
}

function notifylevelupcurrentchannel(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      const myGuild = await guildModel.storage.get(msg.guild);

      if (myGuild.notifyLevelupCurrentChannel) {
        await guildModel.storage.set(msg.guild,'notifyLevelupCurrentChannel',0);
        await msg.channel.send('Gratulation messages will no longer be sent in the user\'s most recent textchannel.');
      } else {
        await guildModel.storage.set(msg.guild,'notifyLevelupCurrentChannel',1);
        await msg.channel.send('Gratulation messages will now be sent in the user\'s most recent textchannel, if possible.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function notifylevelupwithrole(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      const myGuild = await guildModel.storage.get(msg.guild);

      if (myGuild.notifyLevelupWithRole) {
        await guildModel.storage.set(msg.guild,'notifyLevelupWithRole',0);
        await msg.channel.send('Levelup messages will no longer be sent together with a roleassign message.');
      } else {
        await guildModel.storage.set(msg.guild,'notifyLevelupWithRole',1);
        await msg.channel.send('Levelup messages will now be sent together with a roleassign message.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function takeawayassignedrolesonleveldown(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      const myGuild = await guildModel.storage.get(msg.guild);

      if (myGuild.takeAwayAssignedRolesOnLevelDown) {
        await guildModel.storage.set(msg.guild,'takeAwayAssignedRolesOnLevelDown',0);
        await msg.channel.send('Users will no longer lose assigned roles.');
      } else {
        await guildModel.storage.set(msg.guild,'takeAwayAssignedRolesOnLevelDown',1);
        await msg.channel.send('Users will now lose assigned roles again after dropping below the assignment level.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function textmessagecooldown(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 120 || value < 0) {
        await msg.channel.send('Message cooldown needs to be a value from 0 to 120 seconds.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'textMessageCooldownSeconds',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function xppervoiceminute(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 5 || value < 0) {
        await msg.channel.send('xpPerVoiceMinute needs to be a value within 0 and 5.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'xpPerVoiceMinute',value);
      await resetModel.cache.resetGuildMembersAll(msg.guild);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function xppertextmessage(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 10 || value < 0) {
        await msg.channel.send('xpPerTextMessage needs to be a value within 0 and 10.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'xpPerTextMessage',value);
      await resetModel.cache.resetGuildMembersAll(msg.guild);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function xppervote(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 100 || value < 0) {
        await msg.channel.send('Points per ' + msg.guild.appData.votetag + ' needs to be a value within 0 and 100.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'xpPerVote',value);
      await resetModel.cache.resetGuildMembersAll(msg.guild);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function xpperinvite(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 1000 || value < 0) {
        await msg.channel.send('xpPerInvite needs to be a value within 0 and 1000.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'xpPerInvite',value);
      await resetModel.cache.resetGuildMembersAll(msg.guild);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

/*
function xpperbonus(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 5 || value < 0) {
        await msg.channel.send('Points per ' + msg.guild.appData.bonusTag + ' needs to be a value within 0 and 5.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'xpPerBonus',value);
      await resetModel.cache.resetGuildMembersAll(msg.guild);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}*/

function bonuspertextmessage(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 20 || value < 0) {
        await msg.channel.send('bonusPerTextMessage needs to be a XP value within 0 and 20.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'bonusPerTextMessage',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function bonuspervoiceminute(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 10 || value < 0) {
        await msg.channel.send('bonusPerVoiceMinute needs to be a XP value within 0 and 10.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'bonusPerVoiceMinute',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function bonuspervote(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 100 || value < 0) {
        await msg.channel.send('bonusPerVote needs to be a XP value within 0 and 100.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'bonusPerVote',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function bonusperinvite(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 2000 || value < 0) {
        await msg.channel.send('bonusPerInvite needs to be a XP value within 0 and 2000.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'bonusPerInvite',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function bonusuntil(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 4320 || value < 0) {
        await msg.channel.send('Bonusuntil needs to be a minute value within 0 and 4320 (72 hours).');
        return resolve();
      };

      await guildModel.storage.set(msg.guild,'bonusUntilDate',(Date.now() / 1000) + value * 60);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function votecooldown(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 86400 || value < 180) {
        await msg.channel.send('Vote cooldown needs to be a value within 180 (3 minutes) and 86400 (24 hours).');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'voteCooldownSeconds',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function levelfactor(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value < 20 || value > 400) {
        await msg.channel.send('The levelfactor needs to be a value within 20 and 400.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'levelFactor',value);
      await resetModel.cache.resetGuildMembersAll(msg.guild);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function reactionVote(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (msg.guild.appData.reactionVote) {
        await guildModel.storage.set(msg.guild,'reactionVote',0);
        await msg.channel.send('Users can no longer vote via a reaction with the voteEmote.');
      } else {
        await guildModel.storage.set(msg.guild,'reactionVote',1);
        await msg.channel.send('Users can now vote via a reaction with the voteEmote.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function allowmutedxp(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      const myGuild = await guildModel.storage.get(msg.guild);

      if (myGuild.allowMutedXp) {
        await guildModel.storage.set(msg.guild,'allowMutedXp',0);
        await msg.channel.send('Users no longer gain XP while muted.');
      } else {
        await guildModel.storage.set(msg.guild,'allowMutedXp',1);
        await msg.channel.send('Users now gain XP while muted.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function allowsoloxp(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      const myGuild = await guildModel.storage.get(msg.guild);

      if (myGuild.allowSoloXp) {
        await guildModel.storage.set(msg.guild,'allowSoloXp',0);
        await msg.channel.send('Users no longer gain XP while alone in a channel (needs at least two unmuted users in the channel).');
      } else {
        await guildModel.storage.set(msg.guild,'allowSoloXp',1);
        await msg.channel.send('Users now gain XP while alone in a channel.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function allowinvisiblexp(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      const myGuild = await guildModel.storage.get(msg.guild);

      if (myGuild.allowInvisibleXp) {
        await guildModel.storage.set(msg.guild,'allowInvisibleXp',0);
        await msg.channel.send('Users no longer gain XP while invisible.');
      } else {
        await guildModel.storage.set(msg.guild,'allowInvisibleXp',1);
        await msg.channel.send('Users now gain XP while invisible.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function allowdeafenedxp(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      const myGuild = await guildModel.storage.get(msg.guild);

      if (myGuild.allowDeafenedXp) {
        await guildModel.storage.set(msg.guild,'allowDeafenedXp',0);
        await msg.channel.send('Users no longer gain XP while deafened.');
      } else {
        await guildModel.storage.set(msg.guild,'allowDeafenedXp',1);
        await msg.channel.send('Users now gain XP while deafened.');
      }

      resolve();
    } catch (e) { reject(e); }
  });
}

function serverjoinmessage(msg,text) {
  return new Promise(async function (resolve, reject) {
    try {

      if (text.length > 500) {
        await msg.channel.send('Please use a welcome message with 500 characters max.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'serverJoinMessage',text);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function serverleavemessage(msg,text) {
  return new Promise(async function (resolve, reject) {
    try {

      if (text.length > 500) {
        await msg.channel.send('Please use a leave message with 500 characters max.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'serverLeaveMessage',text);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function levelupmessage(msg,text) {
  return new Promise(async function (resolve, reject) {
    try {

      if (text.length > 1000) {
        await msg.channel.send('Please use a levelup message with 1000 characters max.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'levelupMessage',text);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function roleassignmessage(msg,text) {
  return new Promise(async function (resolve, reject) {
    try {

      if (text.length > 500) {
        await msg.channel.send('Please use a roleassignment message with 500 characters max.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'roleAssignMessage',text);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function roledeassignmessage(msg,text) {
  return new Promise(async function (resolve, reject) {
    try {

      if (text.length > 500) {
        await msg.channel.send('Please use a roledeassignment message with 500 characters max.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'roleDeassignMessage',text);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function voicechanneljoinmessage(msg,text) {
  return new Promise(async function (resolve, reject) {
    try {

      if (text.length > 500) {
        await msg.channel.send('Please use a voicechanneljoin message with 500 characters max.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'voiceChannelJoinMessage',text);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function voicechannelleavemessage(msg,text) {
  return new Promise(async function (resolve, reject) {
    try {

      if (text.length > 500) {
        await msg.channel.send('Please use a voicechannelleave message with 500 characters max.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'voiceChannelLeaveMessage',text);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}
