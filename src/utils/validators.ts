import { isFQDN } from 'validator';
import { SEED_LENGTH } from '@/constants';
import { toURL } from './formatters';

export function isUrlValid(urlAsString: string): boolean {
  try {
    const url = toURL(urlAsString);
    return (
      ['http:', 'https:'].includes(url.protocol)
      && (isFQDN(url.hostname) || url.hostname === 'localhost')
    );
  } catch (e) {
    return false;
  }
}

export function isSeedLengthValid(seed: string) {
  return seed && seed.split(' ').length >= SEED_LENGTH;
}
