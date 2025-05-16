import path from 'node:path';
import fs from 'node:fs/promises';
import { z } from 'zod';
import * as p from '@clack/prompts';
import { Command, Option, UsageError } from 'clipanion';
import { configLoader, schemas } from '@activityrank/cfg';
import { REST } from '@discordjs/rest';
import {
  API,
  ApplicationCommandType,
  type APIApplicationCommandOption,
  type RESTPutAPIApplicationGuildCommandsJSONBody,
} from '@discordjs/core';
import { walkUp } from '../util/walkUp.ts';
import {
  type chatInputCommandSchema,
  commandsSchema,
  type contextCommandSchema,
  Deploy,
  type subcommandGroupOptionSchema,
  type subcommandOptionSchema,
  type DeploymentMode,
} from './commandSchema.ts';

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

  /**
   * Walks up the directory tree, starting from the cwd, until it finds
   * one that has a `package.json` file with a `"name"` of "@activityrank/monorepo".
   */
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

  async loadConfig(loader: ReturnType<typeof configLoader>) {
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

    const loader = configLoader(
      this.configPath ?? process.env.CONFIG_PATH ?? (await this.findWorkspaceConfig()),
    );

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

// type DeployableCommand = Omit<
//   RESTPutAPIApplicationGuildCommandsJSONBody[number],
//   // unused fields
//   | 'id'
//   | 'version'
//   | 'name_localized'
//   | 'application_id'
//   | 'description_localized'
//   // deprecated fields
//   | 'dm_permission'
//   | 'default_permission'
// > & {
//   deployment: DeploymentMode;
// };

export class DiscordCommandManagementCommand extends ConfigurableCommand {
  commands: DeployableCommand[] = null as unknown as DeployableCommand[];
  jsonCommands: z.infer<typeof commandsSchema> = null as unknown as z.infer<typeof commandsSchema>;

  async getDeployableCommands(): Promise<DeployableCommand[]> {
    const root = await this.findWorkspaceRoot();
    if (!root) {
      throw new UsageError('Failed to find workspace root.');
    }

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

    const jsonSchema = z.record(z.string());

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
      throw new UsageError('Failed to load base locale "en-US".');
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

  override async loadConfig(loader: ReturnType<typeof configLoader>) {
    await super.loadConfig(loader);
    this.jsonCommands = await loader.load({
      name: 'commands',
      schema: commandsSchema,
      devOnly: true,
    });

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
