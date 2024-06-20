import bs58check from 'bs58check';
import { URDecoder, UR, UREncoder } from '@ngraveio/bc-ur';
import { IAccount } from '@/types';
import { ACCOUNT_TYPES } from '@/constants';

export function isAccountAirGap(account: IAccount) {
  return account.type === ACCOUNT_TYPES.airGap;
}

/**
 * Combine data from multiple UR fragments into a single UR string.
 */
export function getURFromFragments(fragments: string[]): string {
  if (fragments.length === 1) {
    return fragments[0];
  }
  const decoder = new URDecoder();
  fragments.forEach((fragment: string) => {
    decoder.receivePart(fragment);
  });
  const combinedData = decoder.resultUR().decodeCBOR();
  const ur = UR.fromBuffer(combinedData);
  const singleEncoder = new UREncoder(ur, Number.POSITIVE_INFINITY);
  return singleEncoder.nextPart().toUpperCase();
}

export async function decodeUR(code: string) {
  const decoder = new URDecoder();
  try {
    decoder.receivePart(code);
    // should always be complete
    if (decoder.isComplete()) {
      const combinedData = decoder.resultUR().decodeCBOR();
      const resultUr = bs58check.encode(combinedData);
      return resultUr;
    }
  } catch (e) {
    throw new Error('Failed to decode UR');
  }
  return null;
}

export async function parseCodeToBytes(code: string) {
  try {
    const url = new URL(code);
    const urBytes = url.searchParams.get('ur');
    const prefix = 'UR:BYTES/';
    if (urBytes) {
      return decodeUR(prefix.concat(urBytes));
    }
  } catch (e) {
    throw new Error('Failed to parse code');
  }
  return null;
}
