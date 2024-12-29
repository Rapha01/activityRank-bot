import type { BaseInteraction } from 'discord.js';

/**
 * The response from a predicate.
 *
 * A response of Deny will block the action from being run, while a response of Allow will permit its execution.
 */
export enum Predicate {
  Deny = 0,
  Allow = 1,
}

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
  | { status: Predicate.Allow }
  | {
      status: Predicate.Deny;
      callback: InvalidPredicateCallback<I>;
    };
