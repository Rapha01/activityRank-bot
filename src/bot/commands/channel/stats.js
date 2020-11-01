module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      //await stats(msg,[]);
      await msg.channel.send('This command will feature a channel specific overall overview in the future (f.e. total messages sent in this channel, last message sent, etc.). \n\nIf you are looking for the member toplist of this channel, use ``' + msg.guild.appData.prefix + 'channel top members``.');

    } catch (e) { reject(e); }
    resolve();
  });
}
