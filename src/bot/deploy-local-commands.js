const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const keys = require('../const/keys.js').get()
const path = require('path');


const commands = [];
const commandFiles = fs.readdirSync(path.resolve(__dirname, './commandsSlash')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commandsSlash/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(keys.botAuth);


keys.admin.serverIds.forEach(guildId => {
    rest.put(Routes.applicationGuildCommands(keys.botId, guildId), { body: commands })
	    .then(() => console.log(`Registered Application Commands in ${guildId}`))
	    .catch(console.error);
});

