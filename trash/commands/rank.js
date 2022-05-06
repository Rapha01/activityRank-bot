const stats = require('./member/stats.js');

module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      //await stats(msg,msg.member.id,[]);
      await msg.channel.send('This command has moved to ``' + msg.guild.appData.prefix + 'member stats``. In turn for the longer command, you can now use shortcuts for every command! Simply type the first letter of the command. F.e. ``'+ msg.guild.appData.prefix +'m stats``  Type ``' + msg.guild.appData.prefix + 'help statistics`` or simply visit our website https://activityrank.me/commands to get you informed about the new commands. We are sorry if you dislike the new command structure but there are several reason for it, especially as a preparation for future features / commands.');

    } catch (e) { reject(e); }
    resolve();
  });
}
