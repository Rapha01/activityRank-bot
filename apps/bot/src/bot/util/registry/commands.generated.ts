/* 🛠️ This file was generated with `activityrank generate` on Wed May 21 2025. */

import { Command, type OptionKey, type CommandPredicateConfig } from './command.js';
import type {
  Attachment,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ChannelType,
  GuildChannel,
  ThreadChannel,
  MessageContextMenuCommandInteraction,
  Role,
  User,
  UserContextMenuCommandInteraction,
} from 'discord.js';
import type { TFunction } from 'i18next';
type CommandReturn = Promise<void> | void;

export function command(options: {
  name: 'upvote';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      member: User;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'serverinfo';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'patchnote';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      version?: string;
    };
  }) => CommandReturn;
  autocompletes: {
    version: (args: {
      interaction: AutocompleteInteraction<'cached'>;
      client: Client;
      focusedValue: string;
      t: TFunction<'command-content'>;
    }) => CommandReturn;
  };
}): Command;
export function command(options: {
  name: 'reset member';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      member: User;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'reset channel';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      channel: Extract<GuildChannel | ThreadChannel, { type: ChannelType }>;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'reset server settings';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'reset server statistics';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'reset server members';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'reset server xp';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'reset server all';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'reset deleted channel';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      id: string;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'reset deleted role';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      id: string;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'reset deleted channels';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'reset deleted members';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'memberinfo';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      member?: User;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'inviter';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      member: User;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'faq';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      number?: number;
    };
  }) => CommandReturn;
  autocompletes: {
    number: (args: {
      interaction: AutocompleteInteraction<'cached'>;
      client: Client;
      focusedValue: string;
      t: TFunction<'command-content'>;
    }) => CommandReturn;
  };
}): Command;
export function command(options: {
  name: 'help';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'ping';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-server bonus';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      tag?: string;
      emote?: string;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-server vote';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      tag?: string;
      emote?: string;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-server entries-per-page';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      value: number;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-server cooldown';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      message?: number;
      vote?: number;
    };
  }) => CommandReturn;
  autocompletes: {
    message: (args: {
      interaction: AutocompleteInteraction<'cached'>;
      client: Client;
      focusedValue: string;
      t: TFunction<'command-content'>;
    }) => CommandReturn;
    vote: (args: {
      interaction: AutocompleteInteraction<'cached'>;
      client: Client;
      focusedValue: string;
      t: TFunction<'command-content'>;
    }) => CommandReturn;
  };
}): Command;
export function command(options: {
  name: 'config-server set';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-role levels';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      role: Role;
      'assign-level'?: number;
      'deassign-level'?: number;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-role menu';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      role: Role;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-xp bonustime';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      time: number;
    };
  }) => CommandReturn;
  autocompletes: {
    time: (args: {
      interaction: AutocompleteInteraction<'cached'>;
      client: Client;
      focusedValue: string;
      t: TFunction<'command-content'>;
    }) => CommandReturn;
  };
}): Command;
export function command(options: {
  name: 'config-xp levelfactor';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      levelfactor: number;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-xp xp-per';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      message?: number;
      voiceminute?: number;
      vote?: number;
      invite?: number;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-xp bonus-xp-per';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      message?: number;
      voiceminute?: number;
      vote?: number;
      invite?: number;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-xp xp-per-role';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      role: Role;
      message?: number;
      voiceminute?: number;
      vote?: number;
      invite?: number;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'bonus role';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      role: Role;
      change: number;
      'use-beta'?: boolean;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'bonus member';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      member: User;
      change: number;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-messages';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-member';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'config-channel';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      channel?: Extract<GuildChannel | ThreadChannel, { type: ChannelType }>;
      id?: string;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'top';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'rank';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      member?: User;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'update-roles';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'blacklist user';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      user: User;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'blacklist guild';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      id: string;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'eval';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      eval: string;
      async?: boolean;
      depth?: number;
      'show-hidden'?: boolean;
      visible?: boolean;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'reset-jobs';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      full?: boolean;
      eph?: boolean;
      search?: string;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'shard-status';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      full?: boolean;
      eph?: boolean;
      filtered?: boolean;
      page?: number;
      search?: number;
      'search-guild'?: string;
    };
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'Upvote';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: UserContextMenuCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
  }) => CommandReturn;
}): Command;
export function command(options: {
  name: 'api create-token';
  predicate?: CommandPredicateConfig;
  execute: (args: {
    interaction: ChatInputCommandInteraction<'cached'>;
    client: Client;
    t: TFunction<'command-content'>;
    options: {
      'guild-id': string;
    };
  }) => CommandReturn;
}): Command;
export function command(options: any): Command {
  return new Command({
    name: options.name,
    predicate: options.predicate,
    execute: options.execute,
    autocompletes: options.autocompletes,
    options: COMMAND_META[options.name].optionGetters,
  });
}
export const COMMAND_META: {
  [k: string]: { optionGetters: Record<string, OptionKey[]>; type: string };
} = {
  upvote: { optionGetters: { member: ['user'] }, type: 'base-command' },
  serverinfo: { optionGetters: {}, type: 'base-command' },
  patchnote: { optionGetters: { version: ['value'] }, type: 'base-command' },
  'reset member': { optionGetters: { member: ['user'] }, type: 'subcommand' },
  'reset channel': { optionGetters: { channel: ['channel'] }, type: 'subcommand' },
  'reset server settings': { optionGetters: {}, type: 'subcommand' },
  'reset server statistics': { optionGetters: {}, type: 'subcommand' },
  'reset server members': { optionGetters: {}, type: 'subcommand' },
  'reset server xp': { optionGetters: {}, type: 'subcommand' },
  'reset server all': { optionGetters: {}, type: 'subcommand' },
  'reset deleted channel': { optionGetters: { id: ['value'] }, type: 'subcommand' },
  'reset deleted role': { optionGetters: { id: ['value'] }, type: 'subcommand' },
  'reset deleted channels': { optionGetters: {}, type: 'subcommand' },
  'reset deleted members': { optionGetters: {}, type: 'subcommand' },
  memberinfo: { optionGetters: { member: ['user'] }, type: 'base-command' },
  inviter: { optionGetters: { member: ['user'] }, type: 'base-command' },
  faq: { optionGetters: { number: ['value'] }, type: 'base-command' },
  help: { optionGetters: {}, type: 'base-command' },
  ping: { optionGetters: {}, type: 'base-command' },
  'config-server bonus': {
    optionGetters: { tag: ['value'], emote: ['value'] },
    type: 'subcommand',
  },
  'config-server vote': { optionGetters: { tag: ['value'], emote: ['value'] }, type: 'subcommand' },
  'config-server entries-per-page': { optionGetters: { value: ['value'] }, type: 'subcommand' },
  'config-server cooldown': {
    optionGetters: { message: ['value'], vote: ['value'] },
    type: 'subcommand',
  },
  'config-server set': { optionGetters: {}, type: 'subcommand' },
  'config-role levels': {
    optionGetters: { role: ['role'], 'assign-level': ['value'], 'deassign-level': ['value'] },
    type: 'subcommand',
  },
  'config-role menu': { optionGetters: { role: ['role'] }, type: 'subcommand' },
  'config-xp bonustime': { optionGetters: { time: ['value'] }, type: 'subcommand' },
  'config-xp levelfactor': { optionGetters: { levelfactor: ['value'] }, type: 'subcommand' },
  'config-xp xp-per': {
    optionGetters: {
      message: ['value'],
      voiceminute: ['value'],
      vote: ['value'],
      invite: ['value'],
    },
    type: 'subcommand',
  },
  'config-xp bonus-xp-per': {
    optionGetters: {
      message: ['value'],
      voiceminute: ['value'],
      vote: ['value'],
      invite: ['value'],
    },
    type: 'subcommand',
  },
  'config-xp xp-per-role': {
    optionGetters: {
      role: ['role'],
      message: ['value'],
      voiceminute: ['value'],
      vote: ['value'],
      invite: ['value'],
    },
    type: 'subcommand',
  },
  'bonus role': {
    optionGetters: { role: ['role'], change: ['value'], 'use-beta': ['value'] },
    type: 'subcommand',
  },
  'bonus member': { optionGetters: { member: ['user'], change: ['value'] }, type: 'subcommand' },
  'config-messages': { optionGetters: {}, type: 'base-command' },
  'config-member': { optionGetters: {}, type: 'base-command' },
  'config-channel': {
    optionGetters: { channel: ['channel'], id: ['value'] },
    type: 'base-command',
  },
  top: { optionGetters: {}, type: 'base-command' },
  rank: { optionGetters: { member: ['user'] }, type: 'base-command' },
  'update-roles': { optionGetters: {}, type: 'base-command' },
  'blacklist user': { optionGetters: { user: ['user'] }, type: 'subcommand' },
  'blacklist guild': { optionGetters: { id: ['value'] }, type: 'subcommand' },
  eval: {
    optionGetters: {
      eval: ['value'],
      async: ['value'],
      depth: ['value'],
      'show-hidden': ['value'],
      visible: ['value'],
    },
    type: 'base-command',
  },
  'reset-jobs': {
    optionGetters: { full: ['value'], eph: ['value'], search: ['value'] },
    type: 'base-command',
  },
  'shard-status': {
    optionGetters: {
      full: ['value'],
      eph: ['value'],
      filtered: ['value'],
      page: ['value'],
      search: ['value'],
      'search-guild': ['value'],
    },
    type: 'base-command',
  },
  Upvote: { optionGetters: {}, type: 'user-command' },
  'api create-token': { optionGetters: { 'guild-id': ['value'] }, type: 'subcommand' },
};
