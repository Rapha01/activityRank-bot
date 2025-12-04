import { describe, expect, it } from 'vitest';
import { getWaitTime } from './cooldownUtil.ts';

describe('getWaitTime', () => {
  const COOLDOWN = 60000; // 1 minute

  it('should calculate remaining time correctly when lastDate is a Date object', () => {
    const lastDate = new Date(Date.now() - 30000); // 30 seconds ago
    const result = getWaitTime(lastDate, COOLDOWN);

    expect(result.remaining).toBeCloseTo(30000, -2); // Allow a small tolerance due to timing differences
    expect(result.next.getTime()).toBeGreaterThan(Date.now());
  });

  it('should calculate remaining time correctly when lastDate is a number', () => {
    const lastDate = Date.now() - 45000; // 45 seconds ago (as milliseconds)
    const result = getWaitTime(lastDate, COOLDOWN);

    expect(result.remaining).toBeCloseTo(15000, -2); // Allow a small tolerance due to timing differences
    expect(result.next.getTime()).toBeGreaterThan(Date.now());
  });
});
