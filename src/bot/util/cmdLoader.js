const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

let files = [];

function getRecursive(dir) {
  fs.readdirSync(dir).forEach(file => {
    const absolute = path.join(dir, file);
    if (fs.statSync(absolute).isDirectory())
      return getRecursive(absolute);
    return files.push(absolute);
  });
}

getRecursive(path.resolve(__dirname, '../commandsSlash'));

files = files.map(fileName => fileName.replace(path.join(__dirname, '../'), ''));

module.exports = (client) => {
  client.commands = new Collection();
  client.adminCommands = new Collection();

  files.forEach(fileName => {
    const command = require(`../${fileName}`);
    client.commands.set(fileName, command);
  });


  for (const file of fs.readdirSync(path.resolve(__dirname, '../contextMenus'))) {
    const fileName = `contextMenus/${file}`;
    client.commands.set(fileName, require(`../${fileName}`));
  }

  for (const file of fs.readdirSync(path.resolve(__dirname, '../commandsAdmin'))) {
    const command = require(`../commandsAdmin/${file}`);
    command.isAdmin = true;
    if (
      !command.requiredPrivileges
      || typeof command.requiredPrivileges !== 'number'
      || command.requiredPrivileges > 5
      || command.requiredPrivileges < 1)
      throw new Error(`Admin command ${file} does not have a valid requiredPrivileges field!`);
    client.adminCommands.set(file.slice(0, -3), command);
  }

  console.log('✅ Internal Commands Loaded ✅');
};