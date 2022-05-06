module.exports = (msg) => {
  return new Promise(async function (resolve, reject) {
    try {
      /*console.log(msg.member);
      const links = await msg.guild.fetchInvites();
      for (link of links) {
        link = link[1];
        delete link.guild;
        delete link.channel;
        console.log(link);
      }*/

      resolve();
    } catch (e) { reject(e); }
  });
}
