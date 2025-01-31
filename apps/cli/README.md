# ActivityRank CLI

A command-line tool for managing and deploying Discord Slash Commands.

## Usage

Run commands using:

```sh
activityrank <command> [options]
```

## Commands and Examples

### Deploy Commands

Used to manage and deploy Slash Commands.

| Command | Description | Example |
| ------- | ----------- | ------- |
| `activityrank clear` | Clears local Slash Commands. | activityrank clear |
| `activityrank clear production` | Clears production Slash Commands. | activityrank clear production |
| `activityrank commands <guildId>` |  Retrieves current Slash Commands for a specific Discord guild. | activityrank commands 123456789012345678 |
| `activityrank deploy` | Deploys Slash Commands to Discord. | activityrank deploy |
| `activityrank deploy production` | Deploys production Slash Commands. | activityrank deploy production |

### Develop Commands

Used for development-related tasks.

| Command | Description | Example |
| ------- | ----------- | ------- |
| `activityrank generate` | Generates TypeScript command autocompletions. | `activityrank generate --output commands.gen.ts` |
| `activityrank validate` | Validates the `config/commands.json` file to ensure it contains valid commands. | `activityrank validate` |

## Options

Most commands support the --config flag to specify a custom configuration file.

## Configuration

To use ActivityRank CLI, create a config directory with the following files:

### `keys.json`

```json
{
  "botAuth": "your-bot-token",
  "botId": "your-bot-id",
}
```

### `config.json`

```json
{
  "developmentServers": ["server-id", "another-server-id"]
}
```

### `commands.json`

Should contain an array of Discord slash commands. Use `activtyrank validate` to check.

---

Use `--config path/to/config-dir` to specify a custom config directory.

## License

This project is licensed under the [MIT License](LICENSE.txt).
