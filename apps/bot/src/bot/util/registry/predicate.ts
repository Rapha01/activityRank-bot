import type { BaseInteraction } from 'discord.js';

/**
 * The response from a predicate.
 *
 * A response of "DENY" will block the action from being run, while a response of "ALLOW" will permit its execution.
 */
export type Predicate = 'DENY' | 'ALLOW';

/**
 * A callback to be run after a predicate check is denied.
 * This is intended for logging the attempt, if necessary, and for responding to the user running the action.
 */
export type InvalidPredicateCallback<I extends BaseInteraction> = (interaction: I) => Promise<void>;

/**
 * The result of a predicate check.
 * `status` indicates whether the predicate allows or denies the action's execution.
 * If `status` is `Deny`, `callback` should be called to send a reply to the user.
 */
export type PredicateCheck<I extends BaseInteraction> =
  | { status: 'ALLOW' }
  | {
      status: 'DENY';
      callback: InvalidPredicateCallback<I>;
    };
