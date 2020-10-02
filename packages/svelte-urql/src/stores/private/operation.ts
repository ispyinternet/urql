import { context$, Context$, request$, Request$, source$ } from '.';
import { derived, writable, Readable, Writable } from 'svelte/store';
import { OperationContext, RequestPolicy } from '@urql/core';
import { DocumentNode } from 'graphql';

interface QueryArgs {
  query: string | DocumentNode;
  variables?: object;
  requestPolicy?: RequestPolicy;
  pollInterval?: number;
  context?: Partial<OperationContext>;
  pause?: boolean;
}
export interface Operation$ extends Readable<any> {
  update: (args: Partial<QueryArgs>) => void;
}
export function operation$<T>(args, callback): Operation$ {
  // create our context store
  let context: Partial<OperationContext> = {};
  // would like to use ?. optional chaining but repo not supporting it yet
  if (args && args.context) context = args.context;
  if (args && args.pollInterval) context.pollInterval = args.pollInterval;
  if (args && args.requestPolicy) context.requestPolicy = args.requestPolicy;

  const context$$: Context$ = context$(context);
  // DEV
  context$$.subscribe(() => {
    /*console.log('context changed') */
  });

  // create our request store
  let variables: object = {};
  if (args && args.variables) variables = args.variables;

  let queryString: string | DocumentNode = '';
  if (args && args.query) queryString = args.query;
  const request$$: Request$ = request$(queryString, variables);

  // DEV
  request$$.subscribe(() => {
    /*onsole.log('request changed'))*/
  });

  // create our source store - derived by request and context
  const source$$ = source$<T>(request$$, context$$);
  source$$.subscribe(() => {
    /*console.log('source changed')*/
  });

  // pause store.
  let pause = false;
  if (args && args.pause) pause = !!args.pause;
  const pause$: Writable<boolean> = writable(pause);

  // DEV
  pause$.subscribe(() => {
    /*console.log('pause changed')*/
  });

  const { subscribe } = derived([source$$, pause$], callback);

  return {
    subscribe,
    update: args => {
      request$$.set(args);
      if ('pause' in args) pause$.set(!!args.pause);
      context$$.set({
        ...args.context,
        ...{
          pollInterval: args.pollInterval,
          requestPolicy: args.requestPolicy,
        },
      });
    },
  };
}
