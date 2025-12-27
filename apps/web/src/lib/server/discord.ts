import { API } from '@discordjs/core/http-only';
import { REST } from '@discordjs/rest';
import { env } from '$env/dynamic/private';
import type { Session } from './auth/session';

export function userApiHandle(session: Session): API;
export function userApiHandle(accessToken: string): API;
export function userApiHandle(tokenOrSession: string | Session): API {
  let token: string;
  if (typeof tokenOrSession === 'string') {
    token = tokenOrSession;
  } else {
    token = tokenOrSession.accessToken;
  }

  const rest = new REST({ version: '10', authPrefix: 'Bearer' }).setToken(token);
  return new API(rest);
}

const botREST = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
export const discordBotApiHandle = new API(botREST);
