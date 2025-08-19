import fs from 'node:fs/promises';
import path from 'node:path';
import { configLoader, schemas } from '@activityrank/cfg';
import * as p from '@clack/prompts';
import {
  API,
  type APIApplicationCommandOption,
  ApplicationCommandType,
  type RESTPutAPIApplicationGuildCommandsJSONBody,
} from '@discordjs/core';
import { REST } from '@discordjs/rest';
import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import { Command, Option, UsageError } from 'clipanion';
import pc from 'picocolors';
import { z } from 'zod/v4';
import {
  type chatInputCommandSchema,
  commandsSchema,
  type contextCommandSchema,
  Deploy,
  type DeploymentMode,
  type subcommandGroupOptionSchema,
  type subcommandOptionSchema,
} from './commandSchema.ts';
import { findWorkspaceRoot } from './loaders.ts';

export abstract class ConfigurableCommand2 extends Command {
  hideConfigPath = false;
  // The path to a config directory.
  configPath = Option.String('--config', {
    hidden: this.hideConfigPath,
    required: false,
    description: 'The path to a config directory.',
  });

  /**
   * Gets a configLoader object, from (in order):
   *
   * 1. the provided path argument
   * 2. the --config flag
   * 3. the CONFIG_PATH environment variable
   * 4. the workspace root
   */
  async getConfigLoader(_path?: string | undefined): Promise<ReturnType<typeof configLoader>> {
    const cfgPath =
      _path ??
      this.configPath ??
      process.env.CONFIG_PATH ??
      path.join(await findWorkspaceRoot(), 'config');
    return configLoader(cfgPath);
  }

  /**
   * Loads frequently-required config objects, like the config and keys from:
   *
   * 1. the provided path argument
   * 2. the --config flag
   * 3. the CONFIG_PATH environment variable
   * 4. the workspace root
   *
   * If only the `configLoader` object is required, prefer {@link getConfigLoader}
   * as it will avoid validating the `config.json` and `keys.json` files.
   */
  async loadBaseConfig(configDirPath?: string | undefined): Promise<BaseConfig> {
    const loader = await this.getConfigLoader(configDirPath);

    const config = await loader.loadConfig('config', { schema: schemas.bot.config });
    const keys = await loader.loadSecret('keys', { schema: schemas.bot.keys });

    const rest = new REST();
    rest.setToken(keys.botAuth);
    const api = new API(rest);

    return { config, keys, api, loader };
  }

  async getDeployableCommands(): Promise<DeployableCommand[]> {
    const root = await findWorkspaceRoot();
    const localizationDir = path.join(root, 'apps/bot/locales');

    const subdirs = await fs.readdir(localizationDir, { withFileTypes: true });
    const localizationFiles = subdirs
      .map((dir) =>
        dir.isDirectory()
          ? {
              lang: dir.name,
              filePath: path.join(localizationDir, dir.name, 'command-descriptions.json'),
            }
          : null,
      )
      .filter((d) => d !== null);

    const jsonSchema = z.record(z.string(), z.string());

    const parsedLocalizations = await Promise.all(
      localizationFiles.map(async ({ lang, filePath }) => {
        const contents = await fs.readFile(filePath);

        let value: unknown;
        try {
          value = JSON.parse(contents.toString());
        } catch {
          return { lang, success: false } as const;
        }

        const parse = jsonSchema.safeParse(value);

        if (!parse.success) {
          return { lang, success: false } as const;
        }
        return { lang, data: parse.data, success: true } as const;
      }),
    );

    const localizations: Map<string, z.infer<typeof jsonSchema>> = new Map();

    for (const { lang, success, data } of parsedLocalizations) {
      if (!success) {
        p.log.warn(`Language "${lang}" is missing a \`command-descriptions.json\` file.`);
        continue;
      }
      localizations.set(lang, data);
    }

    const baseLocalization = localizations.get('en-US');
    if (!baseLocalization) {
      throw new UsageError(`Failed to load base locale ${pc.green('en-US')}.`);
    }

    const commands: DeployableCommand[] = [];
    const missingDescriptions: { lang: string; key: string }[] = [];

    const getBaseDescription = (...components: string[]) => {
      const key = components.join('.');
      const res = baseLocalization[key];
      if (!res) {
        missingDescriptions.push({ lang: 'en-US', key });
      }
      return res;
    };

    const getDescriptionLocalizations = (...components: string[]) => {
      const key = components.join('.');
      const res: Record<string, string> = {};
      for (const [lang, value] of localizations.entries()) {
        if (value?.[key]) {
          res[mapLanguageKey(lang)] = value[key];
        } else {
          missingDescriptions.push({ lang, key });
        }
      }
      return res;
    };

    const loader = await this.getConfigLoader();
    const commandData = await loader.loadConfig('commands', { schema: commandsSchema });

    for (const command of commandData) {
      const description =
        command.type === ApplicationCommandType.ChatInput
          ? getBaseDescription(command.name)
          : undefined;
      const description_localizations =
        command.type === ApplicationCommandType.ChatInput
          ? getDescriptionLocalizations(command.name)
          : undefined;

      const getOptions = (
        commandLike:
          | z.infer<typeof contextCommandSchema>
          | z.infer<typeof chatInputCommandSchema>
          | z.infer<typeof subcommandOptionSchema>
          | z.infer<typeof subcommandGroupOptionSchema>,
        path: string[] = [],
      ) => {
        return 'options' in commandLike
          ? commandLike.options?.map((opt): APIApplicationCommandOption => {
              if ('options' in opt) {
                return {
                  ...opt,
                  description: getBaseDescription(...path, commandLike.name, opt.name),
                  description_localizations: getDescriptionLocalizations(
                    ...path,
                    commandLike.name,
                    opt.name,
                  ),
                  // don't love the use of `any` but this is really complicated 😭
                  options: getOptions(opt, [...path, commandLike.name]) as any,
                };
              }
              return {
                ...opt,
                description: getBaseDescription(...path, commandLike.name, opt.name),
                description_localizations: getDescriptionLocalizations(
                  ...path,
                  commandLike.name,
                  opt.name,
                ),
              } as APIApplicationCommandOption;
            })
          : undefined;
      };

      const options = getOptions(command);

      const res: DeployableCommand = {
        ...command,
        deployment: command.deployment ?? Deploy.Global,
        // @ts-expect-error d.js typings are difficult because of the difference between context
        // commands (which never have a description) and slash commands (which always have a description).
        description,
        description_localizations,
        options,
        default_member_permissions: command.default_member_permissions ?? undefined,
      };

      commands.push(res);
    }

    function comparator(
      a: { lang: string; key: string },
      b: { lang: string; key: string },
    ): number {
      if (a.lang > b.lang) return 1;
      if (a.lang < b.lang) return -1;
      if (a.key > b.key) return 1;
      if (a.key < b.key) return -1;
      return 0;
    }
    missingDescriptions.sort(comparator);

    const missingLanguages = new Set(missingDescriptions.map((mis) => mis.lang));
    missingLanguages.delete('en-US');

    for (const lang of [...missingLanguages].sort()) {
      const langDescriptions = missingDescriptions.filter((d) => d.lang === lang);
      if (langDescriptions.length > 7) {
        p.log.warn(
          `Missing ${pc.bold(pc.red(langDescriptions.length))} description translations from ${lang}`,
        );
      } else {
        for (const desc of langDescriptions) {
          p.log.warn(`Missing description translation: ${desc.lang}::${desc.key}`);
        }
      }
    }

    if (missingDescriptions.some((d) => d.lang === 'en-US')) {
      // throw error for base language errors
      throw new UsageError(
        `Missing base (${pc.green('en-US')}) description translations: ${missingDescriptions
          .filter((d) => d.lang === 'en-US')
          .map((d) => d.key)
          .join(', ')}`,
      );
    }

    return commands;
  }
}

interface BaseConfig {
  config: z.infer<typeof schemas.bot.config>;
  keys: z.infer<typeof schemas.bot.keys>;
  api: API;
  loader: Awaited<ReturnType<typeof configLoader>>;
}

export class ConfigurableCommand extends Command {
  // The path to a config directory.
  configPath = Option.String('--config', {
    required: false,
    description: 'The path to a config directory.',
  });

  // Definitely initialized in the `loadCommands` method (called in `execute`)
  config: z.infer<typeof schemas.bot.config> = null as unknown as z.infer<
    typeof schemas.bot.config
  >;
  keys: z.infer<typeof schemas.bot.keys> = null as unknown as z.infer<typeof schemas.bot.keys>;

  async findWorkspaceRoot() {
    return (await findWorkspaceDir(process.cwd())) ?? null;
  }

  async findWorkspaceConfig() {
    const root = await this.findWorkspaceRoot();
    return root ? path.join(root, 'config') : null;
  }

  async loadConfig(loader: Awaited<ReturnType<typeof configLoader>>) {
    this.config = await loader.loadConfig('config', { schema: schemas.bot.config });
    this.keys = await loader.loadSecret('keys', { schema: schemas.bot.keys });
  }

  async execute() {
    const spin = p.spinner();
    spin.start('Loading config...');

    const loader = await configLoader(this.configPath);
    await this.loadConfig(loader);

    spin.stop('Loaded config');
  }

  getApi() {
    const rest = new REST();
    rest.setToken(this.keys.botAuth);

    return new API(rest);
  }
}

type DeployableCommand = RESTPutAPIApplicationGuildCommandsJSONBody[number] & {
  deployment: DeploymentMode;
};

export class DiscordCommandManagementCommand extends ConfigurableCommand {
  commands: DeployableCommand[] = null as unknown as DeployableCommand[];
  jsonCommands: z.infer<typeof commandsSchema> = null as unknown as z.infer<typeof commandsSchema>;

  async getDeployableCommands(): Promise<DeployableCommand[]> {
    const root = await findWorkspaceRoot();
    const localizationDir = path.join(root, 'apps/bot/locales');

    const subdirs = await fs.readdir(localizationDir, { withFileTypes: true });
    const localizationFiles = subdirs
      .map((dir) =>
        dir.isDirectory()
          ? {
              lang: dir.name,
              filePath: path.join(localizationDir, dir.name, 'command-descriptions.json'),
            }
          : null,
      )
      .filter((d) => d !== null);

    const jsonSchema = z.record(z.string(), z.string());

    const parsedLocalizations = await Promise.all(
      localizationFiles.map(async ({ lang, filePath }) => {
        const contents = await fs.readFile(filePath);

        let value: unknown;
        try {
          value = JSON.parse(contents.toString());
        } catch {
          return { lang, success: false } as const;
        }

        const parse = jsonSchema.safeParse(value);

        if (!parse.success) {
          return { lang, success: false } as const;
        }
        return { lang, data: parse.data, success: true } as const;
      }),
    );

    const localizations: Map<string, z.infer<typeof jsonSchema>> = new Map();

    for (const { lang, success, data } of parsedLocalizations) {
      if (!success) {
        p.log.warn(`Language "${lang}" is missing a \`command-descriptions.json\` file.`);
        continue;
      }
      localizations.set(lang, data);
    }

    const baseLocalization = localizations.get('en-US');
    if (!baseLocalization) {
      throw new UsageError(`Failed to load base locale ${pc.green('en-US')}.`);
    }

    const commands: DeployableCommand[] = [];
    const missingDescriptions: { lang: string; key: string }[] = [];

    const getBaseDescription = (...components: string[]) => {
      const key = components.join('.');
      const res = baseLocalization[key];
      if (!res) {
        missingDescriptions.push({ lang: 'en-US', key });
      }
      return res;
    };

    const getDescriptionLocalizations = (...components: string[]) => {
      const key = components.join('.');
      const res: Record<string, string> = {};
      for (const [lang, value] of localizations.entries()) {
        if (value?.[key]) {
          res[mapLanguageKey(lang)] = value[key];
        } else {
          missingDescriptions.push({ lang, key });
        }
      }
      return res;
    };

    for (const command of this.jsonCommands) {
      const description =
        command.type === ApplicationCommandType.ChatInput
          ? getBaseDescription(command.name)
          : undefined;
      const description_localizations =
        command.type === ApplicationCommandType.ChatInput
          ? getDescriptionLocalizations(command.name)
          : undefined;

      const getOptions = (
        commandLike:
          | z.infer<typeof contextCommandSchema>
          | z.infer<typeof chatInputCommandSchema>
          | z.infer<typeof subcommandOptionSchema>
          | z.infer<typeof subcommandGroupOptionSchema>,
        path: string[] = [],
      ) => {
        return 'options' in commandLike
          ? commandLike.options?.map((opt): APIApplicationCommandOption => {
              if ('options' in opt) {
                return {
                  ...opt,
                  description: getBaseDescription(...path, commandLike.name, opt.name),
                  description_localizations: getDescriptionLocalizations(
                    ...path,
                    commandLike.name,
                    opt.name,
                  ),
                  // don't love the use of `any` but this is really complicated 😭
                  options: getOptions(opt, [...path, commandLike.name]) as any,
                };
              }
              return {
                ...opt,
                description: getBaseDescription(...path, commandLike.name, opt.name),
                description_localizations: getDescriptionLocalizations(
                  ...path,
                  commandLike.name,
                  opt.name,
                ),
              } as APIApplicationCommandOption;
            })
          : undefined;
      };

      const options = getOptions(command);

      const res: DeployableCommand = {
        ...command,
        deployment: command.deployment ?? Deploy.Global,
        // @ts-expect-error d.js typings are difficult because of the difference between context commands and slash commands.
        description,
        description_localizations,
        options,
        default_member_permissions: command.default_member_permissions ?? undefined,
      };

      commands.push(res);
    }

    if (missingDescriptions.length > 0) {
      for (const desc of missingDescriptions.filter((d) => d.lang !== 'en-US')) {
        p.log.warn(`Missing description translation: ${desc.lang}::${desc.key}`);
      }
    }
    if (missingDescriptions.some((d) => d.lang === 'en-US')) {
      // throw error for en-US errors
      throw new UsageError(
        `Missing base (en-US) description translations: ${missingDescriptions
          .filter((d) => d.lang === 'en-US')
          .map((d) => d.key)
          .join(', ')}`,
      );
    }

    return commands;
  }

  override async loadConfig(loader: Awaited<ReturnType<typeof configLoader>>) {
    await super.loadConfig(loader);

    this.jsonCommands = await loader.loadConfig('commands', { schema: commandsSchema });
    this.commands = await this.getDeployableCommands();
  }
}

function mapLanguageKey(key: string): string {
  switch (key) {
    case 'es':
      return 'es-ES';
    case 'pt-PT':
      return 'pt-BR';
    default:
      return key;
  }
}
