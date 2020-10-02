import { Source } from 'wonka';
import { getClient } from '../context';
import { Request$ } from './request';
import { Context$ } from './context';
import { derived, Readable } from 'svelte/store';
import { Client, OperationResult } from '@urql/core';

/**
 * source store - if request or context change then a new query source
 * is created
 */
export function source$<T>(
  request: Request$,
  context: Context$
): Readable<Source<OperationResult<T>>> {
  const client: Client = getClient();

  const request$ = request;
  const context$ = context;

  return derived([request$, context$], ([request, context]) => {
    return client.executeQuery<T>(request, context);
  });
}
