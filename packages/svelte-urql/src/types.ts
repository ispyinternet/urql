import { DocumentNode } from 'graphql';
import { OperationContext, RequestPolicy } from '@urql/core';

export interface QueryArgs {
  query: string | DocumentNode;
  variables?: object;
  requestPolicy?: RequestPolicy;
  pollInterval?: number;
  context?: Partial<OperationContext>;
  pause?: boolean;
}

export interface ResultStore<T> {
  fetching: boolean;
  stale: boolean;
  error: any;
  data: T;
  extensions: any;
  operation: any;
}
