module.exports = (msg,args) => {
  return new Promise(async function (resolve, reject) {
    try {
      //await stats(msg,[]);
      await msg.channel.send('This command will feature a server specific overall overview in the future (f.e. userjoins and -leaves, total messages for the whole server, most frequent channels and roles, a new server level,  etc.). \n\nIf you are looking for the toplists use ``' + msg.guild.appData.prefix + 'server top members`` or its (reintroduced) shortform alias ``' + msg.guild.appData.prefix + 'top``. Have fun! (Sorry about all the changes in the command structure in the past, it will stay now!)');

    } catch (e) { reject(e); }
    resolve();
  });
}
