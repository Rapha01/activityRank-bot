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
  Interaction,
} from 'discord.js';
import {
  SlashCommandBuilder,
  ContextMenuCommandBuilder,
  ApplicationCommandOptionType,
} from 'discord.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import logger from '../../util/logger.js';
import type { PrivilegeLevel } from 'const/privilegeLevels.js';
import { glob } from 'glob';
import { adminDir, commandsDir, contextDir } from './paths.js';

interface CommandExecutables {
  execute?: CommandFunc;
  executeAutocomplete?: AutocompleteFunc;
}

export const commands: {
  data:
    | RESTPostAPIChatInputApplicationCommandsJSONBody
    | RESTPostAPIContextMenuApplicationCommandsJSONBody;
  admin: boolean;
}[] = [];

export const commandMap = new Map<string, CommandExecutables & { privilege?: PrivilegeLevel }>();
export const modalMap = new Map<string, Omit<ModalRegisterData<any>, 'identifier'>>();
export const componentMap = new Map<string, Omit<ComponentRegisterData<any>, 'identifier'>>();
export const contextMap = new Map<string, ContextFunc>();

export type CommandFunc = (interaction: ChatInputCommandInteraction<'cached'>) => Promise<unknown>;
export type ContextFunc = (
  interaction: ContextMenuCommandInteraction<'cached'>,
) => Promise<unknown>;
export type AutocompleteFunc = (interaction: AutocompleteInteraction<'cached'>) => Promise<unknown>;

export function registerSubCommand(
  meta: {
    name?: string; // the subcommand's name. Inferred from file path if possible.
    group?: string; // the subcommandGroup it belongs to, if any. cannot be inferred atm.
    command?: string; // the command it belongs to. Inferred from file path if possible.
  } & Required<Pick<CommandExecutables, 'execute'>> &
    Pick<CommandExecutables, 'executeAutocomplete'>,
) {
  let originFile = callsites()?.[1]?.getFileName();
  if (originFile) originFile = fileURLToPath(originFile);

  const command = meta.command || (originFile && path.basename(path.dirname(originFile)));
  const name = meta.name || (originFile && path.basename(originFile, '.js'));

  if (!command) {
    logger.warn(
      { stack: callsites().map((i) => i.getFileName) },
      `Cannot find commandName for subcommand ${meta.name}`,
    );
    return;
  }
  if (!name) {
    logger.warn(
      { stack: callsites().map((i) => i.getFileName) },
      `Cannot find subcommand name for subcommand imported from ${originFile}`,
    );
    return;
  }

  const commandId = [command, meta.group, name].filter(Boolean);
  commandMap.set(commandId.join('.'), {
    execute: meta.execute,
    executeAutocomplete: meta.executeAutocomplete,
  });
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
  commands.push({ data: meta.data, admin: false });

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

type ComponentCallback<T, D> = (interaction: T, data: D) => Promise<void> | void;

interface Component<I extends Interaction<'cached'>, D> {
  identifier: string;
  callback: ComponentCallback<I, D>;
}

interface NonModalComponent<T extends ComponentType, I extends Interaction<'cached'>, D = void>
  extends Component<I, D> {
  type: T;
}

type ComponentRegisterData<D> =
  | NonModalComponent<ComponentType.Button, ButtonInteraction<'cached'>, D>
  | NonModalComponent<ComponentType.StringSelect, StringSelectMenuInteraction<'cached'>, D>
  | NonModalComponent<ComponentType.RoleSelect, RoleSelectMenuInteraction<'cached'>, D>
  | NonModalComponent<ComponentType.ChannelSelect, ChannelSelectMenuInteraction<'cached'>, D>
  | NonModalComponent<ComponentType.UserSelect, UserSelectMenuInteraction<'cached'>, D>
  | NonModalComponent<
      ComponentType.MentionableSelect,
      MentionableSelectMenuInteraction<'cached'>,
      D
    >;

/* 
if options.ownerId is provided, 
only a user with id ownerId may use the component. 
All others will get an error message.
*/
// TODO refactor to clean up typings
function customIdBuilder<D>(identifier: string) {
  function makeCustomId(data: D, options?: { ownerId?: string }) {
    const res = `${identifier} ${JSON.stringify(data)} ${JSON.stringify(options)}`;
    // TODO compress?
    if (res.length > 100) logger.warn(res, 'too long');
    return res;
  }
  return makeCustomId;
}

export function registerComponent<D = string | undefined | null | void>(
  meta: ComponentRegisterData<D>,
) {
  if (meta.identifier.includes(' ')) throw new Error('Component IDs cannot contain spaces.');

  componentMap.set(meta.identifier, {
    callback: meta.callback,
    type: meta.type,
  });

  logger.debug(`Loaded component ${meta.identifier}`);

  return customIdBuilder<D>(meta.identifier);
}

type ModalRegisterData<D> = Component<ModalSubmitInteraction<'cached'>, D>;

export function registerModal<D>(meta: ModalRegisterData<D>) {
  if (meta.identifier.includes(' ')) throw new Error('Modal Component IDs cannot contain spaces.');

  modalMap.set(meta.identifier, { callback: meta.callback });

  logger.debug(`Loaded modal ${meta.identifier}`);

  return customIdBuilder<D>(meta.identifier);
}

export function registerAdminCommand(meta: {
  data: SlashCommandData;
  execute: CommandFunc;
  requiredPrivilege: PrivilegeLevel;
  autocomplete?: AutocompleteFunc;
}) {
  if ('toJSON' in meta.data) meta.data = meta.data.toJSON();

  commands.push({ data: meta.data, admin: true });

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

  commands.push({ data: meta.data, admin: false });

  contextMap.set(meta.data.name, meta.execute);

  logger.debug(`Loaded context command [${meta.data.name}]`);
}

export async function loadCommandFiles() {
  const commandFiles = await glob(`${commandsDir}/*.js`);

  // all files nested at least one folder below commandsdir
  const subcommandFiles = await glob(`${commandsDir}/*/**/*.js`);

  await Promise.all(subcommandFiles.map(async (file) => await import(file)));

  await Promise.all(commandFiles.map(async (file) => await import(file)));

  const contextMenuFiles = await glob(`${contextDir}/*.js`);
  await Promise.all(contextMenuFiles.map(async (file) => await import(file)));

  const adminFiles = await glob(`${adminDir}/*.js`);
  await Promise.all(adminFiles.map(async (file) => await import(file)));
}

export enum ComponentKey {
  Throw = '__THROW__',
  Ignore = '__IGNORE__',
}
