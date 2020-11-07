const config = require('../../const/config.js');
const fs = require('fs');
const tokenBurn = require('../util/tokenBurn.js');
const askForPremium = require('../util/askForPremium.js');
const guildChannelModel = require('../models/guild/guildChannelModel.js');

const commandFiles = fs.readdirSync('./bot/commands').filter(file => file.endsWith('.js')).map(file => file.slice(0,-3));

const commands = new Map();
for (const file of commandFiles)
	commands.set(file, require(`../commands/${file}`));

module.exports = (msg) => {
  return new Promise(async function (resolve, reject) {
    try {
      const withoutPrefix = msg.content.slice(msg.guild.appData.prefix.length);
    	const split = withoutPrefix.split(/ +/);
    	const command = split[0].toLowerCase();
    	const args = split.slice(1);
      const now = new Date(Date.now()).toLocaleString();

			await guildChannelModel.cache.load(msg.channel);

			if (msg.channel.appData.noCommand && !msg.member.hasPermission("MANAGE_GUILD"))
				return resolve();

			if (msg.guild.appData.commandOnlyChannel != 0 && msg.guild.appData.commandOnlyChannel != msg.channel.id && !msg.member.hasPermission("MANAGE_GUILD"))
				return resolve();

			console.log('  ' + now + '  ' + command + ' command triggered: ' + msg.content + ' from user ' +
					msg.author.username + ' in guild ' + msg.channel.guild.name + '.');

			await tokenBurn(msg.guild);

			if (command == 'server' || command == 's')
				await commands.get('server')(msg,args);
			else if (command == 'member' || command == 'm')
				await commands.get('member')(msg,args);
			else if (command == 'channel' || command == 'c')
				await commands.get('channel')(msg,args);
			else if (command == 'role' || command == 'r')
				await commands.get('role')(msg,args);
			else if (command == 'token' || command == 'tokens')
				await commands.get('token')(msg,args);
			else if (command == 'info' || command == 'i')
				await commands.get('info')(msg,args);
			else if (command == 'patchnote')
				await commands.get('patchnote')(msg,args);
			else if (command == 'patchnotes' || command == 'p')
				await commands.get('patchnotes')(msg,args);
			else if (command == 'rank')
				await commands.get('rank')(msg,args);
			else if (command == 'help' || command == 'h')
				await commands.get('help')(msg,args);
			else if (command == 'faq' || command == 'faqs' || command == 'f')
				await commands.get('faq')(msg,args);
			else if (command == 'top' || command == 't')
				await commands.get('top')(msg,args);
			else
        await msg.channel.send('Unknown command. Type ``'+msg.guild.appData.prefix+'help`` for more information.\n');

			await askForPremium(msg);

			resolve();
    } catch (e) { reject(e); }
  });
}
