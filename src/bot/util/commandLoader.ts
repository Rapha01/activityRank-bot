import callsites from 'callsites';
import type {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
  ContextMenuCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  ComponentType,
  StringSelectMenuInteraction,
  RoleSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  UserSelectMenuInteraction,
  MentionableSelectMenuInteraction,
} from 'discord.js';
import {
  SlashCommandBuilder,
  ContextMenuCommandBuilder,
  ApplicationCommandOptionType,
} from 'discord.js';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import logger from '../../util/logger.js';
import type { PrivilegeLevel } from 'const/privilegeLevels.js';

interface CommandExecutables {
  execute?: CommandFunc;
  executeAutocomplete?: AutocompleteFunc;
}

export const commandMap = new Map<string, CommandExecutables & { privilege?: PrivilegeLevel }>();
export const modalMap = new Map<string, Omit<ModalRegisterData, 'identifier'>>();
export const componentMap = new Map<string, Omit<ComponentRegisterData, 'identifier'>>();
export const contextMap = new Map<string, ContextFunc>();

export type CommandFunc = (interaction: ChatInputCommandInteraction<'cached'>) => Promise<unknown>;
export type ContextFunc = (interaction: ContextMenuCommandInteraction) => Promise<unknown>;
export type AutocompleteFunc = (interaction: AutocompleteInteraction<'cached'>) => Promise<unknown>;

export function registerSubCommand(
  meta: {
    name: string;
    group?: string; // the subcommandGroup it belongs to, if any
    command?: string; // the command it belongs to. Inferred from file path if possible.
  } & Omit<CommandExecutables, 'executeAutocomplete'>,
) {
  let originFile = callsites()?.[1]?.getFileName();
  if (originFile) originFile = fileURLToPath(originFile);
  const command = meta.command || (originFile && path.basename(path.dirname(originFile)));

  if (!command) {
    logger.warn(
      { stack: callsites().map((i) => i.getFileName) },
      `Cannot find commandName for subcommand ${meta.name}`,
    );
    return;
  }

  const commandId = [command, meta.group, meta.name].filter(Boolean);
  commandMap.set(commandId.join('.'), { execute: meta.execute });
  logger.debug(`Loaded subcommand /${commandId.join(' ')}`);
}

// `data` is typed like this because of discord.js weirdness.
type SlashCommandData =
  | SlashCommandBuilder
  | RESTPostAPIChatInputApplicationCommandsJSONBody
  | Omit<
      SlashCommandBuilder,
      | 'addBooleanOption'
      | 'addUserOption'
      | 'addChannelOption'
      | 'addRoleOption'
      | 'addAttachmentOption'
      | 'addMentionableOption'
      | 'addStringOption'
      | 'addIntegerOption'
      | 'addNumberOption'
    >
  | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

export function registerSlashCommand(
  meta: {
    data: SlashCommandData;
    executeAutocomplete?: (interaction: AutocompleteInteraction<'cached'>) => Promise<void>;
  } & CommandExecutables,
) {
  if ('toJSON' in meta.data) meta.data = meta.data.toJSON();

  const subcommands = meta.data.options?.filter(
    (i) => i.type === ApplicationCommandOptionType.Subcommand,
  );
  const subcommandGroups = meta.data.options?.filter(
    (i) => i.type === ApplicationCommandOptionType.SubcommandGroup,
  );

  const hasSubcommands =
    (subcommands && subcommands.length > 0) || (subcommandGroups && subcommandGroups.length > 0);

  if (hasSubcommands && 'execute' in meta) {
    logger.warn(
      `Cannot load command ${meta.data.name}: command with subcommands cannot have an execute method`,
    );
    return;
  }

  if (subcommands) {
    for (const subcommand of subcommands) {
      if (!commandMap.has([meta.data.name, subcommand.name].join('.')))
        logger.warn(`Command ${meta.data.name} is missing subcommand ${subcommand.name}`);
    }
  }

  if (subcommandGroups) {
    for (const subcommandGroup of subcommandGroups) {
      if (
        subcommandGroup.type !== ApplicationCommandOptionType.SubcommandGroup ||
        !subcommandGroup.options
      )
        return;
      for (const subcommand of subcommandGroup.options) {
        if (!commandMap.has([meta.data.name, subcommandGroup.name, subcommand.name].join('.')))
          logger.warn(
            `Command ${meta.data.name} is missing grouped subcommand ${subcommandGroup.name} ${subcommand.name}`,
          );
      }
    }
  }

  commandMap.set(meta.data.name, {
    execute: meta.execute,
    executeAutocomplete: meta.executeAutocomplete,
  });
  logger.debug(`Loaded command /${meta.data.name}`);
}

type ComponentCallback<T> = (interaction: T) => Promise<void> | void;

interface BaseComponent {
  identifier: string;
}

interface ButtonComponent extends BaseComponent {
  type: ComponentType.Button;
  callback: ComponentCallback<ButtonInteraction<'cached'>>;
}
interface StringSelectComponent extends BaseComponent {
  type: ComponentType.StringSelect;
  callback: ComponentCallback<StringSelectMenuInteraction<'cached'>>;
}
interface RoleSelectComponent extends BaseComponent {
  type: ComponentType.RoleSelect;
  callback: ComponentCallback<RoleSelectMenuInteraction<'cached'>>;
}
interface ChannelSelectComponent extends BaseComponent {
  type: ComponentType.ChannelSelect;
  callback: ComponentCallback<ChannelSelectMenuInteraction<'cached'>>;
}
interface UserSelectComponent extends BaseComponent {
  type: ComponentType.UserSelect;
  callback: ComponentCallback<UserSelectMenuInteraction<'cached'>>;
}
interface MentionableSelectComponent extends BaseComponent {
  type: ComponentType.MentionableSelect;
  callback: ComponentCallback<MentionableSelectMenuInteraction<'cached'>>;
}
type ComponentRegisterData =
  | ButtonComponent
  | StringSelectComponent
  | RoleSelectComponent
  | ChannelSelectComponent
  | UserSelectComponent
  | MentionableSelectComponent;

function customIdBuilder(identifier: string) {
  function makeCustomId(data: string) {
    const res = `${identifier} ${data}`;
    // TODO compress?
    if (res.length > 100) logger.warn(res, 'too long');
    return res;
  }
  return makeCustomId;
}

export function registerComponent(meta: ComponentRegisterData) {
  if (meta.identifier.includes(' ')) throw new Error('Component IDs cannot contain spaces.');

  componentMap.set(meta.identifier, { callback: meta.callback, type: meta.type });

  logger.debug(`Loaded component ${meta.identifier}`);

  return customIdBuilder(meta.identifier);
}

interface ModalRegisterData extends BaseComponent {
  callback: ComponentCallback<ModalSubmitInteraction<'cached'>>;
}

export function registerModal(meta: ModalRegisterData) {
  if (meta.identifier.includes(' ')) throw new Error('Modal Component IDs cannot contain spaces.');

  modalMap.set(meta.identifier, { callback: meta.callback });

  logger.debug(`Loaded modal ${meta.identifier}`);

  return customIdBuilder(meta.identifier);
}

export function registerAdminCommand(meta: {
  data: SlashCommandData;
  execute: CommandFunc;
  requiredPrivilege: PrivilegeLevel;
  autocomplete?: AutocompleteFunc;
}) {
  if (meta.data instanceof SlashCommandBuilder) meta.data = meta.data.toJSON();

  if (meta.execute)
    commandMap.set(meta.data.name, {
      execute: meta.execute,
      executeAutocomplete: meta.autocomplete,
      privilege: meta.requiredPrivilege,
    });

  logger.debug(
    `Loaded admin command /${meta.data.name} (privilege level ${meta.requiredPrivilege})`,
  );
}

export function registerContextMenu(meta: {
  data: ContextMenuCommandBuilder | RESTPostAPIContextMenuApplicationCommandsJSONBody;
  execute: ContextFunc;
}) {
  if (meta.data instanceof ContextMenuCommandBuilder) meta.data = meta.data.toJSON();

  contextMap.set(meta.data.name, meta.execute);

  logger.debug(`Loaded admin command /${meta.data.name}`);
}

const botDir = fileURLToPath(new URL('..', import.meta.url));
const commandsDir = path.join(botDir, 'commandsSlash');
const adminDir = path.join(botDir, 'commandsAdmin');
const contextDir = path.join(botDir, 'contextMenus');

async function loadCommandFiles() {
  const commandFiles = await readdir(commandsDir, { withFileTypes: true });

  const subcommandFiles = (
    await Promise.all(
      commandFiles.filter((file) => file.isDirectory).map((dir) => readdir(dir.path)),
    )
  ).flat();

  await Promise.all(
    subcommandFiles
      .filter((file) => file.endsWith('.js'))
      .map(async (file) => await import(path.join(commandsDir, file))),
  );

  await Promise.all(
    commandFiles
      .filter((file) => file.isFile() && file.name.endsWith('.js'))
      .map(async (file) => await import(path.join(commandsDir, file.name))),
  );

  const contextMenuFiles = await readdir(contextDir);
  await Promise.all(
    contextMenuFiles
      .filter((file) => file.endsWith('.js'))
      .map(async (file) => await import(path.join(contextDir, file))),
  );

  const adminFiles = await readdir(adminDir);
  await Promise.all(
    adminFiles
      .filter((file) => file.endsWith('.js'))
      .map(async (file) => await import(path.join(adminDir, file))),
  );
}
