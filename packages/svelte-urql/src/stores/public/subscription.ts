import { operation$ } from '../private';
export function subscription(args) {
  return operation$(args, false);
}
