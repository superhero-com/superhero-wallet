import { toOutputScript } from 'bitcoinjs-lib/src/address';
import { networks } from 'bitcoinjs-lib';
import { BTC_COIN_PRECISION } from '../config';

export function satoshiToBtc(amount: number) {
  return amount / 10 ** BTC_COIN_PRECISION;
}

export function isBtcAddressValid(address: string, networkType: string) {
  try {
    const network = networks[networkType as keyof typeof networks];
    toOutputScript(address, network);
    return true;
  } catch (error) {
    return false;
  }
}
