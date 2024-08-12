#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Replace variables in special SQL files to be piped to a mysql daemon.
 * @param {string} path The path to a SQL file to run
 * @param {string[]} argv The argv strings to parse into key-value pairs
 */
function replaceVars(path, argv) {
  if (!path.endsWith('.sql')) throw new Error('Provide an SQL file.');

  let file = readFileSync(resolve(path)).toString();
  const lines = file.split('\n');

  if (lines[0] !== '-- > SCRIPTED_FILE')
    throw new Error('Is this a normal SQL file? Ensure the proper metadata is in place.');

  if (lines[1].startsWith('-- > EXPECTED_ARGS: ')) {
    const argList = lines[1]
      .split(':')[1]
      .split(',')
      .map((i) => i.trim());
    const args = checkArgs(argList, argv);
    for (const arg in args) {
      const pattern = new RegExp(`{{${arg}}}`, 'g');
      file = file.replace(pattern, args[arg]);
    }
  }

  console.log(file);
}

/**
 * Process `argv` and check that it contains all required argunets in `argList`
 * @param {string[]} argList A list of required arguments
 * @param {string[]} argv The strings provided
 *
 * @returns {Record<string, string>} A mapping of each argument in argList to its provided argv value.
 * @throws if not all arguments are provided, or if args are in any format other than
 */
function checkArgs(argList, argv) {
  /** @type Record<string, string> */
  const providedArgs = {};

  for (const arg of argv) {
    const match = /^(?<key>\w+)=(?<value>.+)$/.exec(arg);
    if (!match) {
      throw new Error(`The argument "${arg}" does not match the pattern "{key}={value}"`);
    }
    const { key, value } = match.groups;
    if (!argList.includes(key)) {
      throw new Error(
        `Unnecessary argument provided: "${key}" is not needed. Required keys: ${argList.map((a) => `"${a}"`).join(', ')}`,
      );
    }
    providedArgs[key] = value;
  }

  if (!argList.every((arg) => Object.keys(providedArgs).includes(arg))) {
    throw new Error(
      `Missing arguments: ${argList
        .filter((arg) => !Object.keys(providedArgs).includes(arg))
        .map((a) => `"${a}"`)
        .join(', ')}`,
    );
  }
  return providedArgs;
}

replaceVars(process.argv[2], process.argv.slice(3));
