import t from 'typanion';
import pc from 'picocolors';
import * as p from '@clack/prompts';
import TOML from 'smol-toml';
import { createConnection, type RowDataPacket } from 'mysql2/promise';
import { Command, Option, UsageError } from 'clipanion';
import type { Writable } from 'node:stream';
import { createWriteStream } from 'node:fs';
import { loadBaseConfig, type BaseConfig } from '../util/loaders.ts';
import type { API } from '@discordjs/core';

const FORMATS = ['table', 'csv', 'json', 'toml'] as const;
type OutputFormat = (typeof FORMATS)[number];

const isValidOutputFormat = (s: string): s is OutputFormat => FORMATS.includes(s as OutputFormat);

export class ExportCommand extends Command {
  static override paths = [['export']];
  static override usage = Command.Usage({
    category: 'Other',
    description: "Export a guild's member data.",
    details: `
      Gathers member data from the provided guild.
    `,
  });

  output = Option.String('-o,--out', {
    required: false,
    description: `The file to output the results to, or ${pc.blue('-')} for stdout.`,
  });

  format = Option.String('-f,--fmt,--format', {
    required: false,
    description:
      'The format to output the results as. Defaults to checking `--output`, or otherwise CSV.',
  });

  pretty = Option.Boolean('--pretty', {
    required: false,
    description: 'Prints the output as a table. Shorthand for `--format table`.',
  });

  skipOwnerCheck = Option.Boolean('-y,--yes', {
    required: false,
    description: 'Confirms that the guild owner is already known to the executor of the command.',
  });

  guildId = Option.String({ validator: t.cascade(t.isString(), t.matchesRegExp(/^\d{17,20}$/)) });

  override async execute() {
    const { keys, api } = await loadBaseConfig();

    const format = this.getOutputFormat();

    if (!this.skipOwnerCheck) {
      const confirm = await this.runOwnerCheck(api);
      if (!confirm || p.isCancel(confirm)) {
        p.cancel('Cancelled export.');
        return 8; // non-standard exit code
      }
    }

    let outputStream: Writable;
    let outputDisplay: string;

    if (!this.output || this.output.trim() === '-') {
      outputStream = process.stdout;
      outputDisplay = 'stdout';
    } else {
      outputStream = createWriteStream(this.output);
      outputDisplay = this.output;
    }

    const entries = await this.loadDatabaseEntries(this.guildId, keys);

    outputStream.write(this.formatEntries(entries, format));
  }

  formatEntries(entries: { userId: string; xp: number }[], format: OutputFormat): string {
    switch (format) {
      case 'json':
        return JSON.stringify(entries, null, 4);
      case 'toml':
        return TOML.stringify({
          entries: entries.map(({ userId, xp }) => ({ userId: BigInt(userId), xp })),
        });
      case 'csv':
        return ['userId,xp', ...entries.map(({ userId, xp }) => `${userId},${xp}`)].join('\n');
      case 'table':
        return this.formatTable(entries);
    }
  }

  formatTable(entries: { userId: string; xp: number }[]): string {
    const widths = entries.reduce<{ userId: number; xp: number }>(
      (prev, curr) => ({
        userId: Math.max(prev.userId, curr.userId.length),
        xp: Math.max(prev.xp, curr.xp.toLocaleString().length),
      }),
      { userId: 6, xp: 2 },
    );
    const userIdWidth = widths.userId;
    const xpWidth = widths.xp;

    const header = `┏━${'━'.repeat(userIdWidth)}━┯━${'━'.repeat(xpWidth)}━┓`;
    const seperator = `┠─${'─'.repeat(userIdWidth)}─┼─${'─'.repeat(xpWidth)}─┨`;
    const footer = `┗━${'━'.repeat(userIdWidth)}━┷━${'━'.repeat(xpWidth)}━┛`;

    return [
      header,
      `┃ ${'userId'.padEnd(userIdWidth)} │ ${'xp'.padEnd(xpWidth)} ┃`,
      seperator,
      ...entries.map(
        ({ userId, xp }) =>
          `┃ ${userId.padEnd(userIdWidth)} │ ${xp.toLocaleString().padEnd(xpWidth)} ┃`,
      ),
      footer,
    ].join('\n');
  }

  getOutputFormat(): OutputFormat {
    /* 
      Priority:
      1) --format
      2) --pretty
      3) parse extension of --output file
      4) default to CSV
    */
    if (this.format) {
      const lower = this.format.toLowerCase();
      if (isValidOutputFormat(lower)) {
        return lower;
      }
      const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
      const supportedFormats = formatter.format(FORMATS.map(pc.blue));
      throw new UsageError(
        `Format "${pc.red(this.format)}" is not supported. Supported formats: ${supportedFormats}.`,
      );
    }

    if (this.pretty) {
      return 'table';
    }

    if (!this.output || this.output.trim() === '-') {
      return 'csv';
    }

    const outputParts = this.output.split('.');
    // no extension or .txt: table format
    if (outputParts.length < 2 || outputParts.at(-1) === 'txt') {
      return 'table';
    }
    if (outputParts.at(-1) === 'csv') {
      return 'csv';
    }
    if (outputParts.at(-1) === 'toml') {
      return 'toml';
    }
    if (outputParts.at(-1) === 'json') {
      return 'json';
    }

    return 'csv';
  }

  async runOwnerCheck(api: API): Promise<boolean | symbol> {
    const guildData = await api.guilds.get(this.guildId, { with_counts: true }).catch(() => null);
    if (!guildData) {
      p.log.warn('The bot is not currently in the selected guild.');
      return await p.confirm({
        message: 'Are you sure you want to continue this export?',
        initialValue: false,
      });
    }

    p.log.info(
      `Selected Guild: ${pc.blueBright(guildData.name)} (${guildData.approximate_member_count} members)`,
    );

    const ownerData = await api.users.get(guildData.owner_id).catch(() => null);
    if (!ownerData) {
      p.log.warn('Failed to fetch guild owner.');
      return await p.confirm({
        message: 'Are you sure you want to continue this export?',
        initialValue: false,
      });
    }

    p.log.info(`Guild Owner: ${pc.blueBright(ownerData.username)} (${pc.dim(ownerData.id)})`);
    p.log.warn(
      pc.bold(
        pc.yellow(
          'Do not disclose the data produced by this command to anyone except the Guild Owner listed above.',
        ),
      ),
    );

    return await p.confirm({
      message: 'Are you sure you want to continue this export?',
      initialValue: true,
    });
  }

  async loadDatabaseEntries(
    guildId: string,
    keys: BaseConfig['keys'],
  ): Promise<{ userId: string; xp: number }[]> {
    const manager = await createConnection({
      host: keys.managerHost,
      user: keys.managerDb.dbUser,
      password: keys.managerDb.dbPassword,
      database: keys.managerDb.dbName,
      supportBigNumbers: true,
      bigNumberStrings: true,
    });

    const hosts = (await manager.execute(
      'SELECT `host` FROM `guildRoute` LEFT JOIN `dbShard` ON `guildRoute`.`dbShardId` = `dbShard`.`id` WHERE `guildId` = ?',
      [guildId],
    )) as RowDataPacket[];
    await manager.end();

    if (hosts.length < 1 || hosts[0].length < 1) {
      p.log.error('Failed to find guild in Manager DB.');
      p.cancel();
      throw new Error('Failed to find guild in Manager DB');
    }
    const host = hosts[0][0].host;

    const shard = await createConnection({
      host,
      user: keys.shardDb.dbUser,
      password: keys.shardDb.dbPassword,
      database: keys.shardDb.dbName,
      supportBigNumbers: true,
      bigNumberStrings: true,
    });

    const data = await shard.execute(
      'SELECT `userId`, `alltime` AS `xp` FROM `guildMember` WHERE `guildId` = ?',
      [guildId],
    );
    await shard.end();

    return data[0] as { userId: string; xp: number }[];
  }
}
