const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
const { botId, botAuth } = require('../const/keys').get();

const commands = [];
const commandFiles = fs.readdirSync(path.resolve(__dirname, '../bot/commandsSlash')).filter(file => file.endsWith('.js') && !file.startsWith('-'));
const contextFiles = fs.readdirSync(path.resolve(__dirname, '../bot/contextMenus')).filter(file => file.endsWith('.js') && !file.startsWith('-'));


module.exports = () => {
    for (const file of commandFiles) {
	    const command = require(`../bot/commandsSlash/${file}`);
	    commands.push(command.data.toJSON());
    }
    for (const file of contextFiles) {
        const command = require(`../bot/contextMenus/${file}`);
        commands.push(command.data.toJSON());
    }
    
    const rest = new REST({ version: '9' }).setToken(botAuth);

    try {
		console.log(`Refreshing GLOBAL application (/) commands.`);
        rest.put(
			Routes.applicationCommands(botId),
			{ body: commands },
		);
		console.log(`Successfully reloaded GLOBAL application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
}