// based on the formats in https://docs.rs/tracing-subscriber/latest/tracing_subscriber/fmt/format/index.html
// and some code from https://github.com/pinojs/pino-pretty

import { inspect } from 'node:util';
import { Command } from 'clipanion';
import pc from 'picocolors';
import type { Formatter } from 'picocolors/types.js';
import sjson from 'secure-json-parse';
import split from 'split2';

export class FormatLogsCommand extends Command {
  static override paths = [['format-logs']];
  static override usage = Command.Usage({
    category: 'Develop',
    description: 'Format logs (like `pino-pretty` or similar CLI tools)',
    details: `
      Reads NDJSON (or prefixed NDJSON, like \`docker service logs\` outputs) from ${pc.green('stdin')} and 
      outputs it as colored log info.
    `,
  });

  override async execute() {
    var input = process.stdin;
    var output = process.stdout;

    input.pipe(split(formatter)).pipe(output);
  }
}

function tryParse(line: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return {
      ok: true,
      value: sjson.parse(line, {
        constructorAction: 'remove',
        protoAction: 'remove',
      }),
    };
  } catch (_) {
    return { ok: false };
  }
}

function parseLine(
  line: string,
): { ok: true; value: unknown; dockerName: string | null } | { ok: false } {
  const fullLine = tryParse(line);
  if (fullLine.ok) {
    return { ok: true, value: fullLine.value, dockerName: null };
  }

  const reResult = /(.*?)\s*\|\s*(.*)/.exec(line);
  if (!reResult) {
    return { ok: false };
  }

  const partialLine = tryParse(reResult[2]);
  if (partialLine.ok) {
    return { ok: true, value: partialLine.value, dockerName: reResult[1] };
  }

  return { ok: false };
}

function pretty(value: object, dockerName: string | null) {
  const components = [];
  if ('time' in value && Number.isSafeInteger(value.time)) {
    // Swedish -- similar to ISO 8601
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',

      hourCycle: 'h23',
    });
    components.push(pc.dim(formatter.format(value.time as number)));
  }

  if ('level' in value && Number.isSafeInteger(value.level)) {
    const levelNames: { [k: number]: string } = {
      10: 'trace',
      20: 'debug',
      30: 'info',
      40: 'warn',
      50: 'error',
    };
    const levelColors: { [k: number]: Formatter } = {
      10: pc.magenta,
      20: pc.blue,
      30: pc.green,
      40: pc.yellow,
      50: pc.red,
    };
    const color = levelColors[value.level as number] ?? pc.cyan;
    components.push(' ');
    components.push(color(levelNames[value.level as number].padStart(5).toUpperCase()));
  }

  if (dockerName) {
    components.push(' ');
    components.push(`${pc.dim(dockerName)}`);
  }

  if ('shardId' in value && Number.isSafeInteger(value.shardId)) {
    components.push(' ');
    components.push(`(${pc.cyan((value.shardId as number).toString().padStart(3))})`);
  } else {
    components.push(` (${pc.dim('---')})`);
  }

  if ('span' in value && typeof value.span === 'string') {
    components.push(' - ');
    components.push(pc.cyan(value.span));
  }

  components.push(': ');

  if ('msg' in value && typeof value.msg === 'string') {
    components.push(value.msg);
  }

  const otherComponents = Object.entries(value).filter(
    ([key]) => !['time', 'level', 'shardId', 'span', 'msg'].includes(key),
  );
  const simpleComponents = otherComponents
    .filter(([_, value]) => typeof value !== 'function' && typeof value !== 'object')
    .slice(0, 5);
  const remainingComponents = otherComponents.filter(
    ([key]) => !simpleComponents.some(([key2]) => key === key2),
  );

  for (const [key, value] of simpleComponents) {
    components.push(pc.dim(` ${pc.italic(key)}=${value}`));
  }

  for (const [key, value] of remainingComponents) {
    components.push('\n');
    let display: string;

    if (typeof value !== 'function' && typeof value !== 'object') {
      display = indentLines(`${key}: ${value}`, 4);
    } else if (
      (key.toLowerCase() === 'err' || key.toLowerCase() === 'error') &&
      'type' in value &&
      (value.type as string).includes('Error')
    ) {
      const joinedLines = indentLines(value.stack as string, 12);
      display = `${indentLines(4)}${pc.red('Error Details:')}\n${indentLines(8)}${pc.yellow('stack')}:\n${joinedLines}`;

      for (const [errorKey, errorProperty] of Object.entries(value)) {
        display += '\n';
        if (errorKey === 'stack' || errorKey === 'type') {
          continue;
        }
        if (typeof errorProperty !== 'function' && typeof errorProperty !== 'object') {
          // errorProperty may be multiline
          const indentedErrorProperty = indentLines(`${errorProperty}`, 4).trimStart();
          display += indentLines(`${pc.yellow(errorKey)}: ${indentedErrorProperty}`, 8);
        } else {
          // convert inspect(errorProperty) from 2 space-indent to 4 spaces
          const displayValue = inspect(errorProperty, { depth: 12 }).replace(/^ +/gm, (match) =>
            ' '.repeat(match.length * 2),
          );
          display += indentLines(`${pc.yellow(errorKey)}: ${displayValue}`, 8);
        }
      }
    } else {
      // convert inspect(value) from 2 space-indent to 4 spaces
      const displayValue = inspect(value, { depth: 12 }).replace(/^ +/gm, (match) =>
        ' '.repeat(match.length * 2),
      );
      display = indentLines(`${key}: ${displayValue}`, 4);
    }

    components.push(display);
  }

  return components.join('');
}

function indentLines(str: string, dist: number): string;
function indentLines(dist: number): string;
function indentLines(str: string | number, dist?: number): string {
  if (typeof str === 'number') {
    return ' '.repeat(str);
  } else {
    return str
      .split('\n')
      .map((l) => `${' '.repeat(dist as number)}${l}`)
      .join('\n');
  }
}

function formatter(line: string) {
  const parsed = parseLine(line);
  if (!parsed.ok || typeof parsed.value !== 'object' || !parsed.value) {
    return `${line}\n`;
  } else {
    return `${pretty(parsed.value, parsed.dockerName)}\n`;
  }
}
