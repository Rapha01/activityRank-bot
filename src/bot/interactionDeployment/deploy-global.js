const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
const { botId, botAuth } = require('../../const/keys.js').get();

const commands = [];
const commandFiles = fs.readdirSync(path.resolve(__dirname, '../commandsSlash')).filter(file => file.endsWith('.js') && !file.startsWith('-'));


module.exports = async () => {
    for (const file of commandFiles) {
	    const command = require(`../commandsSlash/${file}`);
	    commands.push(command.data.toJSON());
    }
    
    const rest = new REST({ version: '9' }).setToken(botAuth);

    try {
		console.log(`Refreshing GLOBAL application (/) commands.`);
        await rest.put(
			Routes.applicationCommands(botId),
			{ body: commands },
		);
		console.log(`Successfully reloaded GLOBAL application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
}