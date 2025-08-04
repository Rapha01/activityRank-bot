import { describe, expect, it, vi } from 'vitest';
import { getVoteMultiplier } from './fct.js';

vi.stubGlobal('Date', { now: () => 1650000000000 });

describe('getVoteMultiplier', () => {
  it('should return 1 if there are no upvotes or Patreon tier', () => {
    const dbUser = {
      lastTopggUpvoteDate: '0',
      patreonTierUntilDate: '0',
      patreonTier: 0,
    };
    expect(getVoteMultiplier(dbUser)).toBe(1);
  });

  it('should return 2 for a recent Top.gg upvote', () => {
    const dbUser = {
      lastTopggUpvoteDate: (Date.now() / 1000 - 100000).toString(), // less than 3 days ago
      patreonTierUntilDate: '0',
      patreonTier: 0,
    };
    expect(getVoteMultiplier(dbUser)).toBe(2);
  });

  it('should return the appropriate multiplier for Patreon Tier 1', () => {
    const dbUser = {
      lastTopggUpvoteDate: '0',
      patreonTierUntilDate: (Date.now() / 1000 + 100000).toString(), // in the future
      patreonTier: 1,
    };
    expect(getVoteMultiplier(dbUser)).toBe(2);
  });

  it('should return the appropriate multiplier for Patreon Tier 2', () => {
    const dbUser = {
      lastTopggUpvoteDate: '0',
      patreonTierUntilDate: (Date.now() / 1000 + 100000).toString(), // in the future
      patreonTier: 2,
    };
    expect(getVoteMultiplier(dbUser)).toBe(3);
  });

  it('should return the appropriate multiplier for Patreon Tier 3', () => {
    const dbUser = {
      lastTopggUpvoteDate: '0',
      patreonTierUntilDate: (Date.now() / 1000 + 100000).toString(), // in the future
      patreonTier: 3,
    };
    expect(getVoteMultiplier(dbUser)).toBe(4);
  });

  it('should not count a deprecated Patreon tier', () => {
    const dbUser = {
      lastTopggUpvoteDate: '0',
      patreonTierUntilDate: (Date.now() / 1000 + 100000).toString(), // in the future
      patreonTier: 4, // Assuming tier 4 is deprecated and not valid
    };
    expect(getVoteMultiplier(dbUser)).toBe(1); // Should revert to default multiplier
  });
});
