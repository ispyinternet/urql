import { operation$ } from '../private';
export function mutation(args) {
  return operation$(args, false);
}
