# CLI Tool Documentation

This CLI tool facilitates the management and deployment of ActivityRank's Discord application commands.

## Global Arguments

- `config`: The path to a `config.json` file. This option may be provided multiple times and each file will be merged together.
- `keys`: The path to a `keys.json` file.

## Commands

### `commands deploy`

Deploys development commands to Discord.

#### Usage

```sh
$ ./ar commands deploy [--global] [guilds...]
```

- `--global`: Deploy commands globally.
- `guilds...`: Optional list of guild IDs to deploy commands to. Defaults to the `developmentServers` specified in the config file.

#### Subcommands

- [`production`](#commands-deploy-production): Updates Discord production application commands.

#### Description

Deploys development commands to Discord. Commands can be deployed globally or to specific guilds.

#### Examples

Deploy all development commands globally:

```sh
$ ./ar commands deploy --global
```

Deploy commands to specific guilds:

```sh
$ ./ar commands deploy 123456789012345678 876543210987654321
```

### `commands deploy production`

Updates Discord production application commands.

#### Usage

```sh
$ ./ar commands deploy production
```

#### Description

Updates Discord production application commands based on the configuration.

#### Examples

Update production commands:

```sh
$ ./ar commands deploy production
```

---

### `commands clear`

Clears all Discord development commands.

#### Usage

```sh
$ ./ar commands clear [--global] [guilds...]
```

- `--global`: Clear commands globally.
- `guilds...`: Optional list of guild IDs to clear commands in. Defaults to the `developmentServers` specified in the config file.

#### Subcommands

- [`production`](#commands-clear-production): Clears Discord **production** application commands.

#### Description

Clears development commands to Discord. Commands can be cleared globally or in specific guilds.

#### Examples

Clear all development commands globally:

```sh
$ ./ar commands clear --global
```

Clear commands in specific guilds:

```sh
$ ./ar commands clear 123456789012345678 876543210987654321
```

### `commands clear production`

Clears Discord production application commands.

#### Usage

```sh
$ ./ar commands clear production
```

#### Description

Clears Discord production application commands.

#### Examples

Clear production commands:

```sh
$ ./ar commands clear production
```

Clear production administrative commands:

```sh
$ ./ar commands clear production
```

### `commands get`

The `commands get` command retrieves information about deployed Discord application commands.

#### Usage

```sh
$ ./ar commands get [--global] [--production] [guild]
```

- `--global`: Retrieve global commands.
- `--production`: Use production keys for retrieving commands.
- `guild`: Optional guild ID to check commands from (defaults to the first ID in `config.developmentServers`).

#### Description

Fetches and displays information about deployed Discord application commands based on the specified criteria.

#### Examples

Get global commands:

```sh
$ ./ar commands get --global
```

Get commands from a specific guild:

```sh
$ ./ar commands get 123456789012345678
```

Get commands from a specific guild and those deployed globally:

```sh
$ ./ar commands get 123456789012345678 --global
```
