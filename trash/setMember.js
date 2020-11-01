const statFlushCache = require('../statFlushCache.js');
const levelManager = require('../levelManager.js');
const guildMemberModel = require('../models/guild/guildMemberModel.js');
const fct = require('../../fct.js');
const resetModel = require('../models/resetModel.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }

      if (args.length < 2) {
        await msg.channel.send('Too few arguments. Type ``'+msg.guild.appData.prefix+'help membersettings`` for more information');
        return resolve();
      }

      let userName = [],subcommand;

      let endOfUserNameIndex = 0;
      for (i = 0; i < args.length; i++) {
        endOfUserNameIndex = i;
        if (args[i] == 'give' || args[i] == 'take' || args[i] == 'reset') {
          subcommand = args[i];
          break;
        }

        userName.push(args[i]);
      }

      if (!subcommand) {
        await msg.channel.send('Please specify the subcommand (f.e. give) as second argument. Type ``'+msg.guild.appData.prefix+'help setmember`` for more information.');
        return resolve();
      }

      userName = userName.join(' ');

      const targetMemberId = await fct.extractUserId(msg,userName);
      if (!targetMemberId)
        return resolve();

      const value = args.slice(i+1,args.length+1).join(' ');

      subcommand = subcommand.toLowerCase();
      if (subcommand == 'give' || subcommand == 'take')
        await giveTakeBonus(msg,targetMemberId,subcommand,value);
      else if (subcommand == 'reset')
        await reset(msg,targetMemberId,value);
      else {
        await msg.channel.send('Invalid argument. Type ``'+msg.guild.appData.prefix+'help setrole`` for more information');
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}

function giveTakeBonus(msg,targetMemberId,field,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (isNaN(value) || value == 0 || value < 0)  {
        await msg.channel.send('Please use a positive number to specify how much XP should be added / removed.');
        return resolve();
      }
      if (value > 10000)  {
        await msg.channel.send('You can give or take only at maximum 10000 XP at a time.' );
        return resolve();
      }
      value = Math.round(value);

      const targetMember = msg.guild.members.cache.get(targetMemberId);
      if (!targetMember)  {
        await msg.channel.send('Could not find member.');
        return resolve();
      }
      await guildMemberModel.cache.load(targetMember);

      if (field == 'take')
        value = (-1) * value;

      await statFlushCache.addBonus(targetMember,value);
      await msg.channel.send('Successfully changed bonus XP.' );

      resolve();
    } catch (e) { reject(e); }
  });
}

function reset(msg,targetMemberId,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'stats') {
        resetModel.resetJobs[msg.guild.id] = {type:'guildMembers',cmdChannel:msg.channel,guildId:msg.guild.id,userIds:[targetMemberId]};

      } else {
        await msg.channel.send('Please use ``stats`` as subcommand to specify what to reset. F.e. ``'+msg.guild.appData.prefix+'setmember @linck reset stats``.');
        return resolve();
      }

      await msg.channel.send('Resetting, please wait...');
      resolve();
    } catch (e) { reject(e); }
  });
}

/*
module.exports = (msg,args,command) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }

      let targetMember;
      if (msg.mentions.members.first() != null)
        targetMember = msg.mentions.members.first();
      else if (args.length >= 1)
        targetMember = msg.guild.members.cache.find(member => (member.user.username + '#' + member.user.discriminator) == args[0] );

      if (!targetMember) {
        msg.channel.send('Member not found. Type ``'+msg.guild.appData.prefix+'help give`` for more information');
        return resolve();
      }

      let i, count = 0;
      for (i = 0;i < args.length;i++) {
        if ((+args[i])) {
          count = Math.round(args.splice(i, 1));
          break;
        }
      }

      if (count == 0 || count < 0)  {
        await msg.channel.send('Please use a positive number to specify how much XP should be added / removed.');
        return resolve();
      }
      if (count > 10000)  {
        await msg.channel.send('You can give or take only at maximum 10000 XP at a time.' );
        return resolve();
      }

      if (command == 'take')
        count = (-1) * count;


      await bonusModel.addBonus(msg.guild.id,targetMember.id,count);

      const myTargetGuildmember = await guildMemberModel.get(msg.guild.id,targetMember.id);
      await levelManager.checkLevelUp(myGuild,myTargetGuildmember,targetMember,oldTotalScore,newTotalScore);

      if (command == 'give')
        await msg.channel.send('Successfully added points.' );
      else if (command == 'take')
        await msg.channel.send('Successfully removed points.' );

    } catch (e) { reject(e); }
    resolve();
  });
}
*/
