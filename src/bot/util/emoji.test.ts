import { describe, expect, it } from 'vitest';
import { getEmoji, getNativeEmoji, emojiToString, parseEmojiString } from './emoji';

describe('getNativeEmoji', () => {
  it('should properly parse Unicode emojis without variant marks', () => {
    // ❤
    const EMOJI = '\u2764';

    expect(getNativeEmoji(EMOJI)).toStrictEqual({ custom: false, emoji: EMOJI });
  });

  it('should properly parse Unicode emojis with variant marks', () => {
    // ❤️
    const EMOJI = '\u2764\uFE0F';

    expect(getNativeEmoji(EMOJI)).toStrictEqual({ custom: false, emoji: EMOJI });
  });

  it('should properly parse compound Unicode emojis', () => {
    // ❤️‍🔥
    const EMOJI = '\u2764\uFE0F\u200D\uD83D\uDD25';

    expect(getNativeEmoji(EMOJI)).toStrictEqual({ custom: false, emoji: EMOJI });
  });

  it('should properly parse text Unicode emojis', () => {
    expect(getNativeEmoji('heart')).toStrictEqual({ custom: false, emoji: '\u2764\uFE0F' });
    expect(getNativeEmoji(':heart:')).toStrictEqual({ custom: false, emoji: '\u2764\uFE0F' });
    expect(getNativeEmoji('red_circle')).toStrictEqual({ custom: false, emoji: '\uD83D\uDD34' });
  });
});

describe('getEmoji', () => {
  it('should properly parse all emojis that getNativeEmoji supports', () => {
    const emojis = ['\u2764', '\u2764\uFE0F', '\u2764\uFE0F\u200D\uD83D\uDD25'];
    for (const emoji of emojis) {
      expect(getEmoji(emoji)).toStrictEqual({ custom: false, emoji });
    }
    expect(getEmoji('heart')).toStrictEqual({ custom: false, emoji: '\u2764\uFE0F' });
    expect(getEmoji(':heart:')).toStrictEqual({ custom: false, emoji: '\u2764\uFE0F' });
    expect(getEmoji('red_circle')).toStrictEqual({ custom: false, emoji: '\uD83D\uDD34' });
  });

  it('should properly parse custom Discord emojis', () => {
    expect(getEmoji('<:ThanksTeam:775119755618025512>')).toStrictEqual({
      custom: true,
      id: '775119755618025512',
      name: 'ThanksTeam',
      animated: false,
    });
  });

  it('should properly parse custom animated Discord emojis', () => {
    expect(getEmoji('<a:ThanksTeam:775119755618025512>')).toStrictEqual({
      custom: true,
      id: '775119755618025512',
      name: 'ThanksTeam',
      animated: true,
    });

    expect(getEmoji('<a:KazuhaPeek:854403361826275349>')).toStrictEqual({
      custom: true,
      id: '854403361826275349',
      name: 'KazuhaPeek',
      animated: true,
    });
  });
  it('should properly parse custom Discord emojis without <> brackets', () => {
    expect(getEmoji(':ThanksTeam:775119755618025512')).toStrictEqual({
      custom: true,
      id: '775119755618025512',
      name: 'ThanksTeam',
      animated: false,
    });

    expect(getEmoji('a:ThanksTeam:775119755618025512')).toStrictEqual({
      custom: true,
      id: '775119755618025512',
      name: 'ThanksTeam',
      animated: true,
    });
  });

  it('should fail to parse other strings', () => {
    expect(getEmoji(':ThanksTeam:123456789')).toBe(null);
    expect(getEmoji('heartx')).toBe(null);
    expect(getEmoji(':heartx:')).toBe(null);
  });
});

describe('emojiToString', () => {
  it('should properly convert Emojis to serialized strings', () => {
    expect(emojiToString({ custom: false, emoji: '\u2764' })).toBe('\u2764');
    expect(emojiToString({ custom: false, emoji: '\u2764\uFE0F' })).toBe('\u2764\uFE0F');
    expect(emojiToString({ custom: true, id: '1234', name: 'emoji', animated: false })).toBe(
      '<:emoji:1234>',
    );
    expect(emojiToString({ custom: true, id: '1234', name: 'emoji', animated: true })).toBe(
      '<a:emoji:1234>',
    );
  });
});

describe('parseEmojiString', () => {
  it('should properly convert Emojis to serialized strings', () => {
    expect(parseEmojiString('\u2764')).toBe('\u2764');
    expect(parseEmojiString('\u2764\uFE0F')).toBe('\u2764\uFE0F');
    expect(parseEmojiString('<:ThanksTeam:775119755618025512>')).toBe(
      '<:ThanksTeam:775119755618025512>',
    );
    expect(parseEmojiString('<a:ThanksTeam:775119755618025512>')).toBe(
      '<a:ThanksTeam:775119755618025512>',
    );
  });
});
