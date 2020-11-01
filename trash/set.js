const guildModel = require('../models/guild/guildModel.js');
const resetModel = require('../models/resetModel.js');
const emojiRegex = require('emoji-regex');
const emoteRegex = emojiRegex();
const fct = require('../../fct.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }

      if (args.length < 2) {
        await msg.channel.send('Too few arguments. Type ``'+msg.guild.appData.prefix+'help serversettings`` for more information');
        return resolve();
      }

      let subcommand = args[0];
      const value = args.slice(1,args.length+1).join(' ');
      subcommand = subcommand.toLowerCase();

      
      // SET - BASIC
      if (subcommand == 'votetag')
        await votetag(msg,value);
      else if (subcommand == 'voteemote')
        await voteemote(msg,value);
      else if (subcommand == 'bonustag')
        await bonustag(msg,value);
      else if (subcommand == 'bonusemote')
        await bonusemote(msg,value);
      else if (subcommand == 'prefix')
        await prefix(msg,value);
      else if (subcommand == 'entriesperpage')
        await entriesperpage(msg,value);
      else if (subcommand == 'notifylevelupdm')
        await notifylevelupdm(msg,value);
      else if (subcommand == 'notifylevelupchannel')
        await notifylevelupchannel(msg,value);
      else if (subcommand == 'notifyleveluponlywithrole')
        await notifyleveluponlywithrole(msg,value);
      else if (subcommand == 'deassignassignedroles')
        await deassignassignedroles(msg,value);
      // SET - STAT
      else if (subcommand == 'textmessagecooldownseconds')
        await textmessagecooldownseconds(msg,value);
      else if (subcommand == 'xppervoiceminute')
        await pointspervoiceminute(msg,value);
      else if (subcommand == 'xppertextmessage')
        await pointspertextmessage(msg,value);
      else if (subcommand == 'xppervote')
        await pointspervote(msg,value);
      else if (subcommand == 'bonuspertextmessage')
        await bonuspertextmessage(msg,value);
      else if (subcommand == 'bonuspervoiceminute')
        await bonuspervoiceminute(msg,value);
      else if (subcommand == 'bonuspervote')
        await bonuspervote(msg,value);
      else if (subcommand == 'bonusuntil')
        await bonusuntil(msg,myGuild,value);
      else if (subcommand == 'votecooldownseconds')
        await votecooldownseconds(msg,value);
      else if (subcommand == 'levelfactor')
        await levelfactor(msg,value);
      else if (subcommand == 'allowdownvotes')
        await allowdownvotes(msg,value);
      else if (subcommand == 'allowvotewithoutmention')
        await allowvotewithoutmention(msg,value);
      else if (subcommand == 'allowmutedxp')
        await allowmutedxp(msg,value);
      else if (subcommand == 'allowsoloxp')
        await allowsoloxp(msg,value);
      // SET - TEXT
      else if (subcommand == 'serverjoinmessage')
        await serverjoinmessage(msg,value);
      else if (subcommand == 'serverleavemessage')
        await serverleavemessage(msg,value);
      else if (subcommand == 'levelupmessage')
        await levelupmessage(msg,value);
      else if (subcommand == 'roleassignmentmessage')
        await roleassignmentmessage(msg,value);
      else if (subcommand == 'roledeassignmentmessage')
        await roledeassignmentmessage(msg,value);
      else if (subcommand == 'voicechanneljoinmessage')
        await voicechanneljoinmessage(msg,value);
      else if (subcommand == 'voicechannelleavemessage')
        await voicechannelleavemessage(msg,value);
      // RESET
      else if (subcommand == 'reset')
        await reset(msg,value);

      else {
        await msg.channel.send('Invalid argument. Type ``'+msg.guild.appData.prefix+'help`` for more information');
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}

function reset(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      console.log(value);
      if (value == 'stop') {
        delete resetModel.resetJobs[msg.guild.id];

        await msg.channel.send('Stopped reset.');
      } else if (value == 'deleted users') {
        const cd = fct.getActionCooldown(msg.guild.appData,'lastResetDeletedMembers',120);

        if (cd > 0) {
          await msg.channel.send('You can start the server reset of deleted members once per 2 minutes, please wait ' + Math.ceil(cd / 60) + ' more minutes.');
          return resolve();
        }

        const userIds = await resetModel.getDeletedUserIds(msg.guild);

        resetModel.resetJobs[msg.guild.id] = {type:'guildMembers',cmdChannel:msg.channel,userIds:userIds};
        msg.guild.appData.lastResetDeletedMembers = new Date() / 1000;

      } else if (value == 'deleted channels') {
        const cd = fct.getActionCooldown(msg.guild.appData,'lastResetDeletedChannels',120);
        if (cd > 0) {
          await msg.channel.send('You can start the reset of deleted channels only once per 2 minutes, please wait ' + Math.ceil(cd / 60) + ' more minutes.');
          return resolve();
        }

        const channelIds = await resetModel.getDeletedChannelIds(msg.guild);

        resetModel.resetJobs[msg.guild.id] = {type:'guildChannels',cmdChannel:msg.channel,channelIds:channelIds};
        msg.guild.appData.lastResetDeletedChannels = new Date() / 1000;

      } else if (value != 'all' && value != 'stats' && value != 'settings') {
        resetModel.resetJobs[msg.guild.id] = {type:value,cmdChannel:msg.channel};

      } else {
        await msg.channel.send('Please use ``all``, ``stats``, ``settings``, ``deleted channels``, ``deleted users``, or ``stop`` as subcommand to specify what to reset. F.e. ``'+msg.guild.appData.prefix+'set reset all``.');
        resolve();
      }

      await msg.channel.send('Resetting, please wait...');
      resolve();
    } catch (e) { reject(e); }
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
      const customGuildEmoji = msg.guild.emojis.find(emoji => emoji.name == value);

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
      if (value.length < 1 || value.length > 10) {
        await msg.channel.send('Please use at least 2 and at max 10 characters as prefix.');
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

function notifylevelupdm(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'on')
        value = 1;
      else if (value == 'off')
        value = 0;
      else {
        await msg.channel.send('The value for notifylevelupdm setting needs to be either ``on`` or ``off``.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'notifyLevelupDm',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function notifylevelupchannel(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'on')
        value = 1;
      else if (value == 'off')
        value = 0;
      else {
        await msg.channel.send('The value for notifylevelupchannel setting needs to be either ``on`` or ``off``.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'notifyLevelupChannel',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function notifyleveluponlywithrole(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'on')
        value = 1;
      else if (value == 'off')
        value = 0;
      else {
        await msg.channel.send('The value for notifyLevelupOnlyWithRole setting needs to be either ``on`` or ``off``.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'notifyLevelupOnlyWithRole',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function takeawayassignedrolesonleveldown(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'on')
        value = 1;
      else if (value == 'off')
        value = 0;
      else {
        await msg.channel.send('The value for takeAwayAssignedRolesOnLevelDown setting needs to be either ``on`` or ``off``.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'takeAwayAssignedRolesOnLevelDown',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}


function textmessagecooldownseconds(msg,value) {
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
        await msg.channel.send('Points per minute needs to be a value within 0 and 5.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'xpPerVoiceMinute',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function xppertextmessage(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 10 || value < 0) {
        await msg.channel.send('Points per message needs to be a value within 0 and 10.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'xpPerTextMessage',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function xppervote(msg,myGuild,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 50 || value < 0) {
        await msg.channel.send('Points per ' + myGuild.votetag + ' needs to be a value within 0 and 50.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'xpPerVote',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function xpperbonus(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 5 || value < 0) {
        await msg.channel.send('Points per ' + msg.guild.appData.bonusTag + ' needs to be a value within 0 and 5.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'xpPerBonus',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function bonuspertextmessage(msg,myGuild,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 40 || value < 0) {
        await msg.channel.send('Bonuspertextmessage needs to be a XP value within 0 and 40.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'bonusPerTextMessage',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function bonuspervoiceminute(msg,myGuild,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 20 || value < 0) {
        await msg.channel.send('bonuspervoiceminute needs to be a XP value within 0 and 20.');
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
        await msg.channel.send('Bonuspervote needs to be a XP value within 0 and 100.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'bonusPerVote',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function bonusuntil(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 4320 || value < 10) {
        await msg.channel.send('Bonusuntil needs to be a minute value within 10 and 4320 (72 hours).');
        return resolve();
      }

      const untilDate = fct.dateTimeString(new Date(new Date().getTime() + value * 60000));

      await guildModel.storage.set(msg.guild,'bonusUntilDate',untilDate);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function votecooldownseconds(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value > 1440 || value < 3) {
        await msg.channel.send('Vote cooldown needs to be a value within 3 (3 minutes) and 1440 (24 hours).');
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
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function allowdownvotes(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'on')
        value = 1;
      else if (value == 'off')
        value = 0;
      else {
        await msg.channel.send('The value for allowdownvotes setting needs to be either ``on`` or ``off``.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'allowDownVotes',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function allowvotewithoutmention(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'on')
        value = 1;
      else if (value == 'off')
        value = 0;
      else {
        await msg.channel.send('The value for allowvotewithoutmention setting needs to be either ``on`` or ``off``.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'allowVoteWithoutMention',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function allowmutedxp(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'on')
        value = 1;
      else if (value == 'off')
        value = 0;
      else {
        await msg.channel.send('The value for allowmutedxp setting needs to be either ``on`` or ``off``.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'allowMutedXp',value);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function allowsoloxp(msg,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'on')
        value = 1;
      else if (value == 'off')
        value = 0;
      else {
        await msg.channel.send('The value for allowSoloXp setting needs to be either ``on`` or ``off``.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'allowSoloXp',value);
      await msg.channel.send('Setting updated.');
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

function roleassignmentmessage(msg,text) {
  return new Promise(async function (resolve, reject) {
    try {

      if (text.length > 500) {
        await msg.channel.send('Please use a roleassignment message with 500 characters max.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'roleAssignmentMessage',text);
      await msg.channel.send('Setting updated.');
      resolve();
    } catch (e) { reject(e); }
  });
}

function roledeassignmentmessage(msg,text) {
  return new Promise(async function (resolve, reject) {
    try {

      if (text.length > 500) {
        await msg.channel.send('Please use a roledeassignment message with 500 characters max.');
        return resolve();
      }

      await guildModel.storage.set(msg.guild,'roleDeassignmentMessage',text);
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



/*else if (field == 'showvoicescore')
  await showvoicescore(msg,field,value);
else if (field == 'showtextscore')
  await showtextscore(msg,field,value);
else if (field == 'showvotescore' || field == 'show' + myGuild.votetag + 'score')
  await showvotescore(msg,field,value);*/
  /*else if (field == 'pointsperbonus')
    await pointsperbonus(msg,myGuild,field,value);*/
