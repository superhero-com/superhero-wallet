import { isFQDN } from 'validator';
import { SEED_LENGTH } from '@/popup/utils';
import { toURL } from './formatters';

export function isUrlValid(urlAsString: string): boolean {
  try {
    const url = toURL(urlAsString);
    return ['http:', 'https:'].includes(url.protocol) && isFQDN(url.hostname);
  } catch (e) {
    return false;
  }
}

export function isSeedLengthValid(seed: string) {
  return seed && seed.split(' ').length >= SEED_LENGTH;
}
