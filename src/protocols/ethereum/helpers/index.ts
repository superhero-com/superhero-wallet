import { isAddress } from 'web3-validator';

export function isEthAddressValid(address: string) {
  return isAddress(address);
}
