import { pipe, fromValue, concat, map, subscribe } from 'wonka';
import { DocumentNode } from 'graphql';
import { request$, Request$ } from './request';
import { context$, Context$ } from './context';
import { source$ } from './source';
import { writable, derived, Writable, Readable } from 'svelte/store';

import { OperationContext, RequestPolicy } from '@urql/core';

export interface QueryArgs {
  query: string | DocumentNode;
  variables?: object;
  requestPolicy?: RequestPolicy;
  pollInterval?: number;
  context?: Partial<OperationContext>;
  pause?: boolean;
}

const initialState: Partial<ResultStore<any>> = {
  fetching: false,
  stale: false,
  error: undefined,
  data: undefined,
  extensions: undefined,
  operation: undefined,
};

export interface ResultStore<T> {
  fetching: boolean;
  stale: boolean;
  error: any;
  data: T;
  extensions: any;
  operation: any;
}

export type ExecuteQueryFunction = (args: Partial<QueryArgs>) => void;

export interface Query$<T> extends Readable<Partial<ResultStore<T>>> {
  execute: ExecuteQueryFunction;
}

/**
 * query store - readable is result of query source
 * bind method allows to bind query, variables and context to template vars
 * reexecuteQuery method programatically triggers a new query
 */
export function query<T>(args: QueryArgs): Query$<T> {
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
  // results store.
  const { subscribe, update } = writable(initialState, () => {
    // do something if source or pause changes -
    // return the derived unsubscribe which will be called
    // when results stores is unsubscribed from
    // https://svelte.dev/docs#writable
    return derived([source$$, pause$], ([source, pause]) => {
      if (pause) {
        return update(state => ({
          ...state,
          ...{ fetching: false, stale: false },
        }));
      }
      // return wonka unsubscribe. This is called everytime dervive changes
      // or when derived has no more subscribers
      // https://svelte.dev/docs#derived
      return run(source, update);
    }).subscribe(() => {
      /*console.log('derived changed')*/
    });
  });

  return {
    subscribe,
    execute: args => {
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

function run(source, update) {
  return pipe(
    concat([
      fromValue({ fetching: true, stale: false }),
      pipe(
        source,
        map((result: object) => ({ fetching: false, ...result }))
      ),
      fromValue({ fetching: false, stale: false }),
    ]),
    subscribe((result: object) => update(state => ({ ...state, ...result })))
  )[0]; // return unsubscribe function
}
