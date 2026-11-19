import { sha3 } from 'web3-utils';

/** A number, an address or other hex as one ABI word, without `0x` */
export const word = (value: bigint | string) => (typeof value === 'bigint'
  ? value.toString(16)
  : value.replace(/^0x/, '').toLowerCase()).padStart(64, '0');

/** A selector followed by its arguments */
export const callData = (selector: string, ...args: (bigint | string)[]) => `${selector}${args.map(word).join('')}`;

/** What a function that returns a `string` answers */
export const abiString = (text: string) => {
  const hex = Buffer.from(text).toString('hex');
  return `0x${word(32n)}${word(BigInt(hex.length / 2))}${hex.padEnd(64, '0')}`;
};

export const selector = (signature: string) => sha3(signature)!.slice(0, 10);

/** Taken from the signatures, so that a wrong one in the source fails the specs */
export const SELECTORS = {
  transfer: selector('transfer(address,uint256)'),
  approve: selector('approve(address,uint256)'),
  increaseAllowance: selector('increaseAllowance(address,uint256)'),
  transferFrom: selector('transferFrom(address,address,uint256)'),
  setApprovalForAll: selector('setApprovalForAll(address,bool)'),
  safeTransferFrom: selector('safeTransferFrom(address,address,uint256)'),
  safeTransferFromWithData: selector('safeTransferFrom(address,address,uint256,bytes)'),
  erc1155SafeTransferFrom: selector('safeTransferFrom(address,address,uint256,uint256,bytes)'),
  permit2Approve: selector('approve(address,address,uint160,uint48)'),
  decimals: selector('decimals()'),
  symbol: selector('symbol()'),
  supportsInterface: selector('supportsInterface(bytes4)'),
};
