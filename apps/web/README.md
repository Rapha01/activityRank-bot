<!-- markdownlint-disable-file MD033 -->
<!-- markdownlint-disable-next-line MD041 -->
<div align="center">

![ActivityRank Wordmark](https://raw.githubusercontent.com/activityrankbot/assets/main/banners/wordmark.png)

# ActivityRank Website

[![Latest Release](https://img.shields.io/github/v/release/Rapha01/activityRank-bot?style=for-the-badge)](https://github.com/Rapha01/activityRank-bot/releases)
[![License](https://img.shields.io/github/license/Rapha01/activityRank-bot?style=for-the-badge)](https://github.com/Rapha01/activityRank-bot/blob/main/LICENSE.txt)
[![Support Server](https://img.shields.io/discord/534598374985302027?style=for-the-badge&logo=discord&label=support%20server&link=https%3A%2F%2Factivityrank.me/support)](https://activityrank.me/support)

</div>

---

## Getting Started

> [!IMPORTANT]
> If you only want to use the bot, invite it to your Discord server with [this link.](https://activityrank.me/invite)

### Prerequisites

Before you start developing, make sure you have the following installed:

* Node.js (v20.x or higher recommended)
* Pnpm
* Docker (optional, for containerized deployment)

### Running the Website

Ensure the database, api, and bot are running:

```sh
docker compose up db api bot
```

Run the dev script:

```sh
pnpm --filter web run dev
```

### Running in Docker

Ensure the necessary build-args are provided:

```sh
HASH=$(git rev-parse --short HEAD)
docker build . \
  -f apps/web/Dockerfile \
  --build-arg "COMMIT_HASH=$HASH" \
  -t activityrank/web:dev
```

When running the container, ensure the necessary environment variables are provided:

```sh
docker run activityrank/web:dev \
  --env-file apps/web/.env \
  -p 3050:3000 \
  --name web
```

### Running with a Reverse Proxy

We use Caddy as our reverse proxy. Caddy is fairly simple compared to something like nginx, and it 
automatically handles SSL certificates from Let's Encrypt or ZeroSSL.

```sh
wget https://raw.githubusercontent.com/Rapha01/activityRank-bot/refs/heads/master/apps/web/caddy/Caddyfile

docker volume create caddy-data
docker volume create caddy-config

docker run activityrank/web:latest --env-file ./.env --name web

docker run \
  --cap-add=NET_ADMIN --name caddy \
  -p 80:80 -p 443:443 -p 443:443/udp \
  -v ./Caddyfile:/etc/caddy/Caddyfile -v caddy-data:/data -v caddy-config:/config \
  caddy:2.10 caddy run --config /etc/caddy/Caddyfile
```
