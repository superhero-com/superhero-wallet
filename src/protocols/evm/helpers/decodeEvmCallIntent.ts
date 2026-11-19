import { toChecksumAddress } from 'web3-utils';

/** Uniswap's Permit2, at the same address on every chain */
export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

/** 2^bits, without the bigint syntax the TypeScript target lacks */
const powerOfTwo = (bits: number) => BigInt(`0x1${'0'.repeat(bits / 4)}`);

/** Far above any token supply: what dapps ask for as "unlimited" (2^256-1, 2^160-1, 2^255…) */
const UNLIMITED_AMOUNT = powerOfTwo(128);

export type EvmCallIntent =
  | { kind: 'transfer'; token: string; recipient: string; amount: string }
  /** `amount` is the token id of an ERC-721 approve, which has the same selector */
  | { kind: 'approve'; token: string; spender: string; amount: string }
  | { kind: 'increaseAllowance'; token: string; spender: string; amount: string }
  /** `amount` is the token id of an ERC-721 transfer, which has the same selector */
  | { kind: 'transferFrom'; token: string; from: string; recipient: string; amount: string }
  | { kind: 'approveAll'; collection: string; operator: string; approved: boolean }
  | {
    kind: 'nftTransfer';
    collection: string;
    from: string;
    recipient: string;
    tokenId: string;
    /** Of an ERC-1155 transfer */
    amount?: string;
  }
  | {
    kind: 'permit2Approve';
    token: string;
    spender: string;
    amount: string;
    /** Unix seconds */
    expiration: string;
  };

type ArgType = 'address' | 'bool' | 'uint48' | 'uint160' | 'uint256';

/** The arguments read, in order; the rest of the call data (e.g. `bytes`) is not interpreted */
const SELECTORS: Record<string, ArgType[]> = {
  // transfer(address,uint256)
  '0xa9059cbb': ['address', 'uint256'],
  // approve(address,uint256)
  '0x095ea7b3': ['address', 'uint256'],
  // increaseAllowance(address,uint256)
  '0x39509351': ['address', 'uint256'],
  // transferFrom(address,address,uint256)
  '0x23b872dd': ['address', 'address', 'uint256'],
  // setApprovalForAll(address,bool)
  '0xa22cb465': ['address', 'bool'],
  // safeTransferFrom(address,address,uint256)
  '0x42842e0e': ['address', 'address', 'uint256'],
  // safeTransferFrom(address,address,uint256,bytes)
  '0xb88d4fde': ['address', 'address', 'uint256'],
  // safeTransferFrom(address,address,uint256,uint256,bytes) of ERC-1155
  '0xf242432a': ['address', 'address', 'uint256', 'uint256'],
  // approve(address,address,uint160,uint48) of Permit2
  '0x87517c45': ['address', 'address', 'uint160', 'uint48'],
};

const LIMITS: Record<string, bigint> = {
  uint48: powerOfTwo(48),
  uint160: powerOfTwo(160),
  uint256: powerOfTwo(256),
};

/**
 * As tokens built before Solidity 0.8 read it (USDC, USDT): an address keeps its last
 * 20 bytes and a bool is true unless 0. Newer ones revert, which the simulation tells.
 * `undefined` for a uint out of range, which only Permit2 (0.8) takes.
 */
function readWord(word: string, type: ArgType): string | boolean | undefined {
  const value = BigInt(`0x${word}`);
  if (type === 'bool') return value !== BigInt(0);
  if (type === 'address') return toChecksumAddress(`0x${word.slice(24)}`);
  return (value < LIMITS[type]) ? value.toString() : undefined;
}

export function isUnlimitedAmount(amount: string) {
  return BigInt(amount) >= UNLIMITED_AMOUNT;
}

/**
 * What a call to a token or NFT contract does, read from its call data alone.
 * `undefined` for any other call, or call data that doesn't fit.
 */
export function decodeEvmCallIntent(to: string, data: string): EvmCallIntent | undefined {
  const hex = data.toLowerCase();
  if (!/^0x[\da-f]*$/.test(hex) || (hex.length - 2) % 2) return undefined;
  const selector = hex.slice(0, 10);
  const types = SELECTORS[selector];
  if (!types) return undefined;
  const words = hex.slice(10).match(/.{64}/g) ?? [];
  if (words.length < types.length) return undefined;
  const args = types.map((type, idx) => readWord(words[idx], type));
  if (args.includes(undefined) || !/^0x[\da-f]{40}$/i.test(to)) return undefined;
  const token = toChecksumAddress(to);
  const [a, b, c, d] = args as any[];

  switch (selector) {
    case '0xa9059cbb': return {
      kind: 'transfer', token, recipient: a, amount: b,
    };
    case '0x095ea7b3': return {
      kind: 'approve', token, spender: a, amount: b,
    };
    case '0x39509351': return {
      kind: 'increaseAllowance', token, spender: a, amount: b,
    };
    case '0x23b872dd': return {
      kind: 'transferFrom', token, from: a, recipient: b, amount: c,
    };
    case '0xa22cb465': return {
      kind: 'approveAll', collection: token, operator: a, approved: b,
    };
    case '0x42842e0e':
    case '0xb88d4fde': return {
      kind: 'nftTransfer', collection: token, from: a, recipient: b, tokenId: c,
    };
    case '0xf242432a': return {
      kind: 'nftTransfer', collection: token, from: a, recipient: b, tokenId: c, amount: d,
    };
    case '0x87517c45': return (token === PERMIT2_ADDRESS)
      ? {
        kind: 'permit2Approve', token: a, spender: b, amount: c, expiration: d,
      }
      : undefined;
    default: return undefined;
  }
}
