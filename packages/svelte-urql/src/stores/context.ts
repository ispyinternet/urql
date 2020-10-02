import { writable, derived, Readable } from 'svelte/store';
import { OperationContext } from '@urql/core';

type SetFunction = (context?: Partial<OperationContext>) => void;

export interface Context$ extends Readable<Partial<OperationContext>> {
  set: SetFunction;
}
/**
 * context store - creates a new context if pollInterval or requestPolicy
 * change
 */
export function context$(context: Partial<OperationContext>): Context$ {
  const { pollInterval, requestPolicy } = context;

  const c = context;
  const pollInterval$ = writable(pollInterval);
  const requestPolicy$ = writable(requestPolicy);

  const { subscribe } = derived(
    [pollInterval$, requestPolicy$],
    ([pollInterval, requestPolicy]) => {
      c.pollInterval = pollInterval;
      c.requestPolicy = requestPolicy;

      return c;
    }
  );

  return {
    subscribe,
    set: (context): void => {
      if (context && context.pollInterval)
        pollInterval$.set(context.pollInterval);
      if (context && context.requestPolicy)
        requestPolicy$.set(context.requestPolicy);
    },
  };
}
