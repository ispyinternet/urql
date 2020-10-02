import { Client, ClientOptions } from '@urql/core';

let client = new Client({ url: '/graphql' });

export const setClient = (args: ClientOptions): void => {
  client = new Client(args);
};
export const getClient = (): Client => client;
