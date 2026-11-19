import { sha3 } from 'web3-utils';

/** A number, an address or other hex as one ABI word, without `0x` */
export const word = (value: bigint | string) => (typeof value === 'bigint'
  ? value.toString(16)
  : value.replace(/^0x/, '').toLowerCase()).padStart(64, '0');

/** Values as ABI words, as the data of an event */
export const words = (...values: (bigint | string)[]) => `0x${values.map(word).join('')}`;

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
  allowance: selector('allowance(address,address)'),
};

export const TOPICS = {
  transfer: sha3('Transfer(address,address,uint256)')!,
  approval: sha3('Approval(address,address,uint256)')!,
  approvalForAll: sha3('ApprovalForAll(address,address,bool)')!,
  transferSingle: sha3('TransferSingle(address,address,address,uint256,uint256)')!,
  transferBatch: sha3('TransferBatch(address,address,address,uint256[],uint256[])')!,
  deposit: sha3('Deposit(address,uint256)')!,
  withdrawal: sha3('Withdrawal(address,uint256)')!,
  permit2Approval: sha3('Approval(address,address,address,uint160,uint48)')!,
  permit2Permit: sha3('Permit(address,address,address,uint160,uint48,uint48)')!,
};

/** The data of an ERC-1155 TransferBatch: `uint256[] ids, uint256[] values` */
export const batchData = (ids: bigint[], amounts: bigint[]) => words(
  64n,
  BigInt(32 * (3 + ids.length)),
  BigInt(ids.length),
  ...ids,
  BigInt(amounts.length),
  ...amounts,
);

/** A log as a node answers it; a topic shorter than a word, e.g. an address, is padded */
export const log = (address: string, topics: string[], data = '0x') => ({
  address: address.toLowerCase(),
  topics: topics.map((topic) => (topic.length === 66 ? topic : `0x${word(topic)}`)),
  data,
});
