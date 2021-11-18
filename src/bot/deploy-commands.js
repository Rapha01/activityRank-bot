const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const keys = require('../const/keys.js')
const path = require('path');

const commands = [];
const commandFiles = fs.readdirSync(path.resolve(__dirname, './commandsSlash')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commandsSlash/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(keys.botAuth);

rest.put(Routes.applicationCommands(keys.botId), { body: commands })
    .then(() => console.log(`Registered Application Commands GLOBALLY.`))
    .catch(console.error);

