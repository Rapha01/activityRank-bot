#!/usr/bin/env node

import process from 'node:process';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { program, Option, Command } from 'commander';
import pico from 'picocolors';
import { REST } from 'discord.js';
import { Routes } from 'discord-api-types/v10';

async function config(args) {
  try {
    if (args.build) execSync('npm run build');
  } catch (e) {
    console.log(e);
  }

  process.env.SUPPRESS_LOGGING = 'true';
  if (args.production) process.env.NODE_ENV = 'production';

  const keyfile = args.keys ? await import('./dist/const/keys.js').catch(() => null) : null;
  const keys = keyfile?.get();
  const token = args.token ?? keys?.botAuth ?? null;
  if (!token) program.error('Could not load token');

  let botId = null;
  try {
    botId = BigInt(Buffer.from(token.split('.')[0], 'base64').toString()).toString();
  } catch (e) {}
  if (!botId) program.error('Could not parse bot ID from token');

  const rest = new REST({ version: '10' }).setToken(token);

  return { rest, adminGuild: keys?.adminGuild, botId };
}

async function clear(args) {
  const { rest, botId } = await config(args);

  console.log(`\n\n        ${pico.bgBlue('ACTIVITYRANK')}\n`);
  if (args.global) {
    console.log(`  ${pico.red('clearing')}  ${pico.magenta('global')} commands...`);
    await rest.put(Routes.applicationCommands(botId), { body: [] });
    console.log(`  ${pico.red('cleared ')}  ${pico.magenta('global')} commands.\n`);
  }
  if (args.local?.length > 0) {
    for (const guild of args.local) {
      console.log(
        `  ${pico.red('clearing')}  ${pico.blue('local')}  commands in guild ${pico.yellow(
          guild,
        )}...`,
      );
      await rest.put(Routes.applicationGuildCommands(botId, guild), { body: [] });
      console.log(
        `  ${pico.red('cleared ')}  ${pico.blue('local')}  commands in guild ${pico.yellow(
          guild,
        )}.\n`,
      );
    }
  }
  console.log('');
}

async function update(args) {
  const { rest, adminGuild, botId } = await config(args);

  if (args.admin === true && !adminGuild) program.error('Could not load admin guild from keys.');

  if (!fs.existsSync(new URL('./dist', import.meta.url))) {
    execSync('npm run build');
  }

  const { loadCommandFiles, commands } = await import('./dist/bot/util/commandLoader.js');
  await loadCommandFiles();

  const adminCommands = commands.filter((i) => i.admin).map((i) => i.data);
  const unprivilegedCommands = commands.filter((i) => !i.admin).map((i) => i.data);
  console.log(`\n\n        ${pico.bgBlue('ACTIVITYRANK')}\n`);
  if (args.global) {
    console.log(`  ${pico.red('setting')}  ${pico.magenta('global')} commands...`);
    await rest.put(Routes.applicationCommands(botId), { body: unprivilegedCommands });
    console.log(`  ${pico.red('set    ')}  ${pico.magenta('global')} commands.\n`);
  }
  if (args.local?.length > 0) {
    for (const guild of args.local) {
      console.log(
        `  ${pico.red('setting')}  ${pico.blue('local')}  commands in guild ${pico.yellow(
          guild,
        )}...`,
      );
      await rest.put(Routes.applicationGuildCommands(botId, guild), { body: unprivilegedCommands });
      console.log(
        `  ${pico.red('set    ')}  ${pico.blue('local')}  commands in guild ${pico.yellow(
          guild,
        )}.\n`,
      );
    }
  }
  if (args.admin) {
    console.log(
      `  ${pico.red('setting')}  ${pico.yellow('admin')}  commands in guild ${pico.yellow(
        guild,
      )}...`,
    );
    await rest.put(
      Routes.applicationGuildCommands(botId, args.admin === true ? adminGuild : args.admin),
      { body: adminCommands },
    );
    console.log(
      `  ${pico.red('set    ')}  ${pico.yellow('admin')}  commands in guild ${pico.yellow(
        guild,
      )}.\n`,
    );
  }
  console.log('');
}

const clearCmd = new Command('clear')
  .description('Clear commands')
  .addOption(new Option('-t, --token <token>', "The bot's token.").env('TOKEN'))
  .option('-g, --global', 'Clear global commands.')
  .option('-b, --build', 'Build before running command.')
  .option('-l, --local <guildids...>', 'Clear local commands from a specified guild.')
  .option('--production', 'Whether to read from the production keys')
  .option('--no-keys', 'Whether to avoid reading keys')
  .action(clear);
const updateCmd = new Command('update')
  .description('Update commands')
  .addOption(new Option('-t, --token <token>', "The bot's token.").env('TOKEN'))
  .option('-g, --global', 'Update global commands.')
  .option('-b, --build', 'Build before running command.')
  .option('-l, --local <guildids...>', 'Update local commands from a specified guild.')
  .option('-a, --admin [guildids]', 'Update admin commands to an optionally specified guild.')
  .option('--production', 'Whether to read from the production keys')
  .option('--no-keys', 'Whether to avoid reading keys')
  .action(update);

program
  .name('activityrank-deploy')
  .version('0.0.1')
  .description("Deploy ActivityRank's commands.")
  .addCommand(clearCmd)
  .addCommand(updateCmd)
  .parse();
