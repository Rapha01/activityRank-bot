const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

let files = [];

const botDir = path.resolve(path.join(__dirname, '..', '..'));
const contextDir = path.join(botDir, 'contextMenus');
const commandsDir = path.join(botDir, 'commandsSlash');
const adminDir = path.join(botDir, 'commandsAdmin');

function getRecursive(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const absolute = path.join(dir, file);
    if (fs.statSync(absolute).isDirectory()) return getRecursive(absolute);
    return files.push(absolute);
  });
}

getRecursive(commandsDir);

files = files.map((fileName) => fileName.replace(commandsDir + '/', ''));

console.log(files);
/* 
'config-channel'
'config-role/levels'
'Upvote'

admin
'blacklist'
 */

module.exports = (client) => {
  client.commands = new Collection();
  client.adminCommands = new Collection();

  files.forEach((fileName) => {
    const command = require(path.join(commandsDir, fileName));
    client.commands.set(fileName.slice(0, -3), command);
  });

  for (const file of fs.readdirSync(contextDir)) {
    client.commands.set(
      file.slice(0, -3),
      require(path.join(contextDir, file))
    );
  }

  for (const file of fs.readdirSync(adminDir)) {
    const command = require(path.join(adminDir, file));
    command.isAdmin = true;
    if (
      !command.requiredPrivileges ||
      typeof command.requiredPrivileges !== 'number' ||
      command.requiredPrivileges > 5 ||
      command.requiredPrivileges < 1
    )
      throw new Error(
        `Admin command ${file} does not have a valid requiredPrivileges field!`
      );
    client.adminCommands.set(file.slice(0, -3), command);
  }

  client.logger.debug('Loaded internal command registry');
};
