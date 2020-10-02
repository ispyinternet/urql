import { DocumentNode } from 'graphql';
import { GraphQLRequest, createRequest } from '@urql/core';
import { writable, derived, Writable, Readable } from 'svelte/store';

interface RequestArgs {
  query: string | DocumentNode;
  variables: object;
}
type SetFunction = (args: Partial<RequestArgs>) => void;

export interface Request$ extends Readable<GraphQLRequest> {
  set: SetFunction;
}
/**
 * request store - provides the current request or a new request if
 * query or variables change.
 */
export function request$(q: string | DocumentNode, v: object): Request$ {
  const request = createRequest(q, v);
  let key = request.key;

  const query$: Writable<string | DocumentNode> = writable(q);
  const variables$: Writable<object> = writable(v);

  const { subscribe } = derived(
    [query$, variables$],
    ([query, variables], set) => {
      const request = createRequest(query, variables);
      if (key !== request.key) {
        key = request.key;
        set(request);
      }
    },
    request
  );

  return {
    subscribe,
    set: (args: Partial<RequestArgs>) => {
      if (args.query) query$.set(args.query);
      if (args.variables) variables$.set(args.variables);
    },
  };
}
