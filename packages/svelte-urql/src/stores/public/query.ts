import { pipe, fromValue, concat, map, subscribe } from 'wonka';
import { operation$ } from '../private';
import { writable, Readable } from 'svelte/store';
import { QueryArgs, ResultStore } from '../../types';

const initialState: Partial<ResultStore<any>> = {
  fetching: false,
  stale: false,
  error: undefined,
  data: undefined,
  extensions: undefined,
  operation: undefined,
};

export type ExecuteQueryFunction = (args: Partial<QueryArgs>) => void;

export interface Query$<T> extends Readable<Partial<ResultStore<T>>> {
  onChange: ExecuteQueryFunction;
}

/**
 * query store - readable - results of query source
 * onChange method allows to re-execute the query if query,
 * variables or context change
 */
export function query<T>(args: QueryArgs): Query$<T> {
  // bind the update method of our results store to our
  // operation store callback

  // the operation store callback will execute if the query source changes
  // or if the query is paused.
  const makeCallback = update => ([source, pause]) => {
    if (pause) {
      return update(state => ({
        ...state,
        ...{ fetching: false, stale: false },
      }));
    }
    // return wonka unsubscribe.
    // This is called everytime the callback is called
    // or when no subscribers left
    // https://svelte.dev/docs#derived
    return run(source, update);
  };

  // need to use this anonymous function because we cannot order our declations
  // due to mutual dependency between results$ and operation$$
  // basically, when we get a subscriber to the results store we subscribe
  // to the operation store - this will clean up the subscription when
  // the subscription to the results store is cleaned up
  const onSubscribe = () =>
    operation$$.subscribe(d => {
      d;
    });

  // results store - subscribes to the operation store when we get a subscriber
  const results$ = writable(initialState, onSubscribe);

  // create our operation store
  const operation$$ = operation$(args, makeCallback(results$.update));

  return {
    subscribe: results$.subscribe,
    onChange: args => operation$$.update(args),
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
