import path from 'node:path';
import fs from 'node:fs/promises';
import type { z } from 'zod';
import * as p from '@clack/prompts';
import { Command, Option, UsageError } from 'clipanion';
import { configLoader, schemas } from '@activityrank/cfg';
import { REST } from '@discordjs/rest';
import { API } from '@discordjs/core';
import { $ } from 'execa';
import { walkUp } from '../util/walkUp.ts';
import type { Registry } from '../../../bot/src/bot/util/registry/registry.ts';
import type { Deploy as TDeploy } from '../../../bot/src/bot/util/registry/command.ts';

export class ConfigurableCommand extends Command {
  // The path to a config directory.
  configPath = Option.String('--config', {
    required: false,
    description: 'The path to a config directory.',
  });

  // Definitely initialized in the `execute` method
  config: z.infer<typeof schemas.bot.config> = null as unknown as z.infer<
    typeof schemas.bot.config
  >;
  keys: z.infer<typeof schemas.bot.keys> = null as unknown as z.infer<typeof schemas.bot.keys>;

  async findWorkspaceRoot() {
    for (const dir of walkUp(process.cwd())) {
      const checkFile = path.join(dir, 'package.json');

      let json: object;
      try {
        const content = await fs.readFile(checkFile);
        json = JSON.parse(content.toString());
      } catch (e) {
        continue;
      }

      if ('name' in json && json.name === '@activityrank/monorepo') {
        return dir;
      }
    }

    return null;
  }

  async findWorkspaceConfig() {
    const root = await this.findWorkspaceRoot();
    return root ? path.join(root, 'config') : null;
  }

  async loadConfig() {
    const loader = configLoader(
      this.configPath ?? process.env.CONFIG_PATH ?? (await this.findWorkspaceConfig()),
    );

    this.config = await loader.load({
      name: 'config',
      schema: schemas.bot.config,
      secret: false,
    });

    this.keys = await loader.load({ name: 'keys', schema: schemas.bot.keys, secret: true });
  }

  async execute() {
    const spin = p.spinner();
    spin.start('Loading config...');

    await this.loadConfig();

    spin.stop('Loaded config');
  }
}

export class DiscordCommandManagementCommand extends ConfigurableCommand {
  async getInternals() {
    const root = await this.findWorkspaceRoot();
    if (!root) {
      throw new UsageError('Failed to find workspace root.');
    }

    const botDir = path.join(root, 'apps', 'bot');

    await $({ cwd: botDir })`pnpm run build`;

    const { createRegistryCLI } = await import(
      path.join(botDir, './dist/bot/util/registry/registry.js')
    );

    const registry = (await createRegistryCLI()) as Registry;
    await registry.loadCommands();

    const { Deploy } = await import(path.join(botDir, './dist/bot/util/registry/command.js'));

    return { registry, Deploy: Deploy as typeof TDeploy };
  }

  getApi() {
    const rest = new REST();
    rest.setToken(this.keys.botAuth);

    return new API(rest);
  }
}
