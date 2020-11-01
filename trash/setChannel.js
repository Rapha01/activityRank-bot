const guildChannelModel = require('../models/guild/guildChannelModel.js');
const guildModel = require('../models/guild/guildModel.js');
const resetModel = require('../models/resetModel.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (!msg.member.hasPermission("MANAGE_GUILD")) {
        await msg.channel.send('You need the permission to manage the server, in order to use this command.');
        return resolve();
      }
      if (args.length < 2) {
        await msg.channel.send('Too few arguments. Type ``'+msg.guild.appData.prefix+'help channelsettings`` for more information');
        return resolve();
      }
      if (!msg.guild.me.hasPermission('MANAGE_CHANNELS')) {
        await msg.channel.send('You have an old version of the bot with no permission to manage channels. Please kick and reinvite it with the new invitelink found on discordbots.org. Your servers stats will ***not*** reset.');
        return resolve();
      }

      let channelName = [],subcommand,channel,i;

      let endOfchannelNameIndex = 0;
      for (i = 0; i < args.length; i++) {
        endOfchannelNameIndex = i;
        if (args[i] == 'post_joinserver' || args[i] == 'post_levelup' ||  args[i] == 'noxp' || args[i] == 'reset') {
          subcommand = args[i];
          break;
        }

        channelName.push(args[i]);
      }

      if (!subcommand) {
        await msg.channel.send('Please specify the subcommand (f.e. assignlevel) as second argument. Type ``'+msg.guild.appData.prefix+'help setrole`` for more information.');
        return resolve();
      }

      channelName = channelName.join(' ');
      const targetChannelId = await fct.extractChannelId(msg,channelName);
      if (!targetChannelId)
        return resolve();

      const value = args.slice(i+1,args.length+1).join(' ');

      subcommand = subcommand.toLowerCase();
      if (subcommand == 'noxp')
        await noxp(msg,targetChannelId,value);
      else if (subcommand == 'serverjoinautopost')
        await serverjoinautopost(msg,targetChannelId,value);
      else if (subcommand == 'levelupautopost')
        await levelupautopost(msg,targetChannelId,value);
      else if (subcommand == 'reset')
        await reset(msg,targetChannelId,value);
      else {
        await msg.channel.send('Invalid argument. Type ``'+msg.guild.appData.prefix+'help setchannel`` for more information');
        return resolve();
      }
    } catch (e) { reject(e); }
    resolve();
  });
}


function noxp(msg,targetChannelId,field,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'on')
        value = 1;
      else if (value == 'off')
        value = 0;
      else {
        await msg.channel.send('The value for noxp setting needs to be either ``on`` or ``off``.');
        return resolve();
      }

      await guildChannelModel.storage.set(msg.guild,targetChannelId,'noXp',value);
      await msg.channel.send('Channel updated.');

      resolve();
    } catch (e) { reject(e); }
  });
}


function serverjoinautopost(msg,myGuild,subcommand,channelId,value) {
  return new Promise(async function (resolve, reject) {
    try {
      await guildModel.get(msg.guild.id);
      await guildModel.storage.set(msg.guild,'serverJoinAutopost',channelId);
      await msg.channel.send('Channel updated.');

      resolve();
    } catch (e) { reject(e); }
  });
}

function levelupautopost(msg,myGuild,subcommand,channelId,value) {
  return new Promise(async function (resolve, reject) {
    try {
      await guildModel.get(msg.guild.id);
      await guildModel.storage.set(msg.guild,'levelupAutopost',channelId);
      await msg.channel.send('Channel updated.');

      resolve();
    } catch (e) { reject(e); }
  });
}

function reset(msg,targetChannelId,value) {
  return new Promise(async function (resolve, reject) {
    try {
      if (value == 'stats') {
        resetModel.resetJobs[msg.guild.id] = {type:'guildChannels',cmdChannel:msg.channel,guildId:msg.guild.id,channelIds:[targetChannelId]};
      } else {
        await msg.channel.send('Please use ``stats`` as subcommand to specify what to reset. F.e. ``'+msg.guild.appData.prefix+'setchannel general reset stats``.');
        return resolve();
      }

      await msg.channel.send('Resetting, please wait...');
      resolve();
    } catch (e) { reject(e); }
  });
}
