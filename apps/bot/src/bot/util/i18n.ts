import { fileURLToPath } from 'node:url';
import i18next, { type CustomTypeOptions } from 'i18next';
import Backend, { type FsBackendOptions } from 'i18next-fs-backend';

export const createConjunctionListFormatter = (locale: string) =>
  new Intl.ListFormat([locale, 'en-US'], { style: 'long', type: 'conjunction' });

let loaded = false;
export async function ensureI18nLoaded() {
  if (loaded) return;

  const loadPath = fileURLToPath(new URL('../../../locales/{{lng}}/{{ns}}.json', import.meta.url));

  await i18next.use(Backend).init<FsBackendOptions>({
    lng: 'en-US',
    preload: SUPPORTED_LOCALES,
    backend: { loadPath },
    ns: ['command-content'] as const satisfies (keyof CustomTypeOptions['resources'])[],
    interpolation: { escapeValue: false },
  });
  loaded = true;
}

export function getTranslationsForKey(key: string) {
  return SUPPORTED_LOCALES.reduce(
    (messages, currentLang) => {
      messages[currentLang] = i18next.t(key, { lng: currentLang });
      return messages;
    },
    {} as Record<string, string>,
  );
}

export const DISCORD_LOCALES = [
  'id',
  'en-US',
  'en-GB',
  'bg',
  'zh-CN',
  'zh-TW',
  'hr',
  'cs',
  'da',
  'nl',
  'fi',
  'fr',
  'de',
  'el',
  'hi',
  'hu',
  'it',
  'ja',
  'ko',
  'lt',
  'no',
  'pl',
  'pt-BR',
  'ro',
  'ru',
  'es-ES',
  'es-419',
  'sv-SE',
  'th',
  'tr',
  'uk',
  'vi',
] as const;

export const SUPPORTED_LOCALES = [
  'en-US',
  'de',
] as const satisfies (typeof DISCORD_LOCALES)[number][];
