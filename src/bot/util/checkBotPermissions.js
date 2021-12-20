const userModel = require('../models/userModel.js');
const fct = require('../../util/fct.js');
const cooldownUtil = require('./cooldownUtil.js');
const { MessageEmbed } = require('discord.js');
const { stripIndent } = require('common-tags');

const botInviteLink = 'https://discord.com/api/oauth2/authorize?client_id=534589798267224065&permissions=294172224721&scope=bot%20applications.commands'

let checkPermissionsCd;
if (process.env.NODE_ENV == 'production') {
  checkPermissionsCd = 3600 * 0.4;
} else {
  checkPermissionsCd = 3600 * 0.4; //20
}


module.exports = (msg) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (cooldownUtil.getCachedCooldown(msg.guild.appData, 'lastCheckPermissionsDate', checkPermissionsCd) > 0)
        return resolve();
      
      const now = Date.now() / 1000;
      msg.guild.appData.lastCheckPermissionsDate = now;

      await fct.sleep(2000);
      await sendPermissionsEmbed(msg);

    } catch (e) { reject(e); }
    resolve();
  });
}

const sendPermissionsEmbed = async (msg) => {
  if (!msg.guild.me.permissions.missing('294172224721'))
    return;
  
  const embed = new MessageEmbed()
    .setAuthor('WARNING', 'https://cdn.pixabay.com/photo/2017/03/08/14/20/flat-2126885_1280.png')
    .setDescription(stripIndent`Your bot is missing permissions it needs to function properly! 
                    Please ask an administrator or your server owner to [click here to **reinvite it.**](${botInviteLink})
                    Alternatively, run \`ar!i perms\` to find the permissions your bot is missing!`)
    .setColor('#ffcc00');

  await msg.channel.send({embeds:[embed]});
}
