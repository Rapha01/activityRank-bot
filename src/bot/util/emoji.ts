import { formatEmoji } from 'discord.js';
import * as emoji from 'node-emoji';

/** A representation of a Discord emoji */
interface CustomEmoji {
  custom: true;
  /** The Snowflake ID of the emoji */
  id: string;
  /** The name of the emoji, when added to the database. */
  name: string;
  /** Whether or not the emoji is animated. */
  animated: boolean;
}

/** A representation of a native Unicode emoji */
interface NativeEmoji {
  custom: false;
  /** The Unicode representation of the emoji ('❤️') */
  emoji: string;
}

type Emoji = CustomEmoji | NativeEmoji;

const UNICODE_VARIANTS = /\p{Mark}+/u;
const DISCORD_EMOJI_REGEX = /<?(?:(a):)?(\w{1,32}):(\d{17,19})?>?/;
const DISCORD_SNOWFLAKE_REGEX = /\d{17,19}/;

/**
 * Retrieves an emoji representation from the given text.
 * @param text The text representing the emoji, which can be a Unicode emoji (e.g., `'❤'`), a Unicode emoji with a variant mark (e.g., `'❤️'`), a text representation (e.g., `':heart:'`), or a full custom emoji (e.g., `'<:ThanksTeam:775119755618025512>'`).
 * @returns The emoji representation if found, or null if the text does not represent a valid emoji.
 */
export function getEmoji(text: string): Emoji | null {
  /* text may be:
   * a Unicode emoji ('❤'),
   * a Unicode emoji with a variant mark ('❤️'),
   * a text representation (':heart:'),
   * a full custom emoji ('<:ThanksTeam:775119755618025512>')
   */

  const native = getNativeEmoji(text);
  if (native) return native;

  const match = text.match(DISCORD_EMOJI_REGEX);
  if (match) {
    return { custom: true, animated: Boolean(match[1]), id: match[3], name: match[2] };
  }

  return null;
}

/**
 * Retrieves a native Unicode emoji representation from the given text.
 * @param text The text representing the emoji, which can be a Unicode emoji (e.g., `'❤'`), a Unicode emoji with a variant mark (e.g., `'❤️'`), or a text representation (e.g., `':heart:'`).
 * @returns The native Unicode emoji representation if found, or null if the text does not represent a valid emoji. The returned representation will never have variant marks.
 */
export function getNativeEmoji(text: string): NativeEmoji | null {
  /* text may be:
   * a Unicode emoji ('❤'),
   * a Unicode emoji with a variant mark ('❤️'),
   * a text representation (':heart:'),
   */

  const stripVariants = (text: string) => text.replace(UNICODE_VARIANTS, '');

  // strip Unicode variant symbols
  const native = emoji.find(stripVariants(text));
  if (native) {
    // we need to strip variants again because text representations become variant emojis:
    // for instance, ':heart:' becomes '❤️' instead of '❤'.
    return { custom: false, emoji: stripVariants(native.emoji) };
  }

  return null;
}

/**
 * Retrieves a string representation of an emoji to insert into the database.
 * @param text The text representing the emoji, which can be any valid input to {@link getEmoji}.
 * @returns The string representation of the emoji, which is either a stripped Unicode emoji or the Discord emoji representation.
 */
export function parseEmojiString(text: string): string | null {
  const emoji = getEmoji(text);
  return emoji && emojiToString(emoji);
}

/**
 * Retrieves a string representation of an emoji to insert into the database.
 * @param emoji The text representing the emoji, which can be any {@link Emoji} instance.
 * @returns The string representation of the emoji, which is either a stripped Unicode emoji or the Discord emoji representation.
 */
export function emojiToString(emoji: Emoji): string {
  if (emoji.custom) return formatEmoji(emoji);
  else return emoji.emoji;
}
