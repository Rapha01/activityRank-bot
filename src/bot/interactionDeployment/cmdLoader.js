const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const deployGlobal = require('./deploy-global.js')



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

files = files.map(fileName => fileName.replace(__dirname, '.'));

module.exports = (client) => {

    if (process.env.NODE_ENV == 'production')
        deployGlobal();

    client.commands = new Collection()

    files.forEach(fileName => {
        const command = require(fileName);
        client.commands.set(fileName, command);
    });


    for (const file of fs.readdirSync(path.resolve(__dirname, '../contextMenus'))) {
        const fileName = `../contextMenus/${file}`;
        client.commands.set(fileName, require(fileName));
    }

    console.log('✅ Internal Commands Loaded ✅');
}