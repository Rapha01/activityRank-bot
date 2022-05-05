const userModel = require('../models/userModel.js');
const fct = require('../../util/fct.js');
const cooldownUtil = require('./cooldownUtil.js');
const { MessageEmbed } = require('discord.js');
const { stripIndent } = require('common-tags');
const { botInviteLink } = require('../../const/config.js');


let checkPermissionsCd;
if (process.env.NODE_ENV == 'production') {
  checkPermissionsCd = 604800; // 1 week
} else {
  checkPermissionsCd = 3600 * 0.4; //24 mins
}


module.exports = async (msg) => {
    if (cooldownUtil.getCachedCooldown(msg.guild.appData, 'lastCheckPermissionsDate', checkPermissionsCd) > 0)
      return;

    const now = Date.now() / 1000;
    msg.guild.appData.lastCheckPermissionsDate = now;

    await fct.sleep(2000);
    await sendPermissionsEmbed(msg);
}

const sendPermissionsEmbed = async (msg) => {
  if (!msg.guild.me.permissions.missing('294172224721').length)
    return;

  const embed = new MessageEmbed()
    .setAuthor({ name: 'WARNING', iconURL: 'https://cdn.pixabay.com/photo/2017/03/08/14/20/flat-2126885_1280.png' })
    .setDescription(stripIndent`Your bot is missing permissions it needs to function properly!
                    Please ask an administrator or your server owner to [click here to **reinvite it.**](${botInviteLink})
                    Alternatively, run \`ar!i perms\` to find the permissions your bot is missing!`)
    .setColor('#ffcc00');

  await msg.channel.send({embeds:[embed]});
}
