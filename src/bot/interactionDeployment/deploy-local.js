const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require("path");
const { botId, botAuth, admin } = require('../../const/keys.js').get();

const commands = [];
const commandFiles = fs.readdirSync(path.resolve(__dirname, '../commandsSlash')).filter(file => file.endsWith('.js') && !file.startsWith('-'));
const contextFiles = fs.readdirSync(path.resolve(__dirname, '../contextMenus')).filter(file => file.endsWith('.js') && !file.startsWith('-'));


module.exports = async () => {
    for (const file of commandFiles) {
	    const command = require(`../commandsSlash/${file}`);
	    commands.push(command.data.toJSON());
    }
    for (const file of contextFiles) {
        const command = require(`../contextMenus/${file}`);
        commands.push(command.data.toJSON());
    }
    const rest = new REST({ version: '9' }).setToken(botAuth);

    try {
		console.log(`Refreshing local application (/) commands.`);
        admin.guildIds.forEach(async (sID) => {
            await rest.put(
			    Routes.applicationGuildCommands(botId, sID),
			    { body: commands },
		    );
            console.log(`Loaded local application (/) commands in guild ${sID}`)
        });
		console.log(`Successfully reloaded local application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
}