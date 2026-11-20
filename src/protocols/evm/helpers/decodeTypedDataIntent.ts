import { encodeParameter } from 'web3-eth-abi';
import { toChecksumAddress } from 'web3-utils';

import type { IEvmTypedData } from '@/types';
import { PERMIT2_ADDRESS } from './decodeEvmCallIntent';

export type TypedDataIntent =
  /** EIP-2612 */
  | { kind: 'permit'; token: string; spender: string; amount: string; deadline: string }
  /** DAI's permit, which allows all or nothing; an `expiry` of 0 never expires */
  | { kind: 'daiPermit'; token: string; spender: string; allowed: boolean; expiry: string }
  /** Permit2 AllowanceTransfer: an allowance per token until its expiration */
  | {
    kind: 'permit2Allowance';
    spender: string;
    sigDeadline: string;
    tokens: { token: string; amount: string; expiration: string }[];
  }
  /** Permit2 SignatureTransfer: a transfer up to the amount, once */
  | {
    kind: 'permit2Transfer';
    spender: string;
    deadline: string;
    tokens: { token: string; amount: string }[];
    /** Also confirms an order or the like, e.g. of UniswapX */
    hasWitness: boolean;
  }
  /** EIP-3009, e.g. of USDC: a transfer of the signer's tokens, once */
  | {
    kind: 'transferAuthorization';
    token: string;
    recipient: string;
    amount: string;
    validBefore: string;
  };

type Types = IEvmTypedData['types'];

const PERMIT_DETAILS = [['token', 'address'], ['amount', 'uint160'], ['expiration', 'uint48'], ['nonce', 'uint48']];
const TOKEN_PERMISSIONS = [['token', 'address'], ['amount', 'uint256']];
const TRANSFER_AUTHORIZATION = [
  ['from', 'address'],
  ['to', 'address'],
  ['value', 'uint256'],
  ['validAfter', 'uint256'],
  ['validBefore', 'uint256'],
  ['nonce', 'bytes32'],
];

/** The struct has exactly these fields, in this order */
function hasFields(types: Types, typeName: string, fields: string[][]) {
  const declared = types[typeName];
  return Array.isArray(declared)
    && declared.length === fields.length
    && fields.every(([name, type], idx) => (
      declared[idx]?.name === name && declared[idx]?.type === type
    ));
}

/**
 * A value as the signature encodes it (see `hashTypedData`), `undefined` where it can't be.
 * Read in any other way, a dapp could hide a permit, e.g. with an amount in binary.
 */
function readSigned(
  type: 'address' | 'uint48' | 'uint160' | 'uint256',
  value: unknown,
): string | undefined {
  try {
    const word = encodeParameter(
      type,
      (type === 'address' && typeof value === 'string') ? value.toLowerCase() : value,
    );
    return (type === 'address')
      ? toChecksumAddress(`0x${word.slice(-40)}`)
      : BigInt(word).toString();
  } catch {
    return undefined;
  }
}

/** `undefined` if any value is missing or malformed */
function allDefined<T extends Record<string, unknown>>(
  values: T,
): { [K in keyof T]: Exclude<T[K], undefined> } | undefined {
  return Object.values(values).every((value) => value !== undefined) ? values as any : undefined;
}

function decodePermit2({
  types, primaryType, message = {},
}: IEvmTypedData): TypedDataIntent | undefined {
  const spender = readSigned('address', message.spender);
  if (primaryType === 'PermitSingle' || primaryType === 'PermitBatch') {
    const isBatch = primaryType === 'PermitBatch';
    if (
      !hasFields(types, 'PermitDetails', PERMIT_DETAILS)
      || !hasFields(types, primaryType, [
        ['details', isBatch ? 'PermitDetails[]' : 'PermitDetails'],
        ['spender', 'address'],
        ['sigDeadline', 'uint256'],
      ])
    ) return undefined;
    const details = isBatch ? message.details : [message.details];
    if (!Array.isArray(details) || !details.length) return undefined;
    const tokens = details.map((detail: any) => allDefined({
      token: readSigned('address', detail?.token),
      amount: readSigned('uint160', detail?.amount),
      expiration: readSigned('uint48', detail?.expiration),
    }));
    const sigDeadline = readSigned('uint256', message.sigDeadline);
    return (spender && sigDeadline && tokens.every(Boolean))
      ? {
        kind: 'permit2Allowance', spender, sigDeadline, tokens: tokens as any,
      }
      : undefined;
  }

  const transferTypes: Record<string, [boolean, boolean]> = {
    PermitTransferFrom: [false, false],
    PermitBatchTransferFrom: [true, false],
    PermitWitnessTransferFrom: [false, true],
    PermitBatchWitnessTransferFrom: [true, true],
  };
  if (!transferTypes[primaryType]) return undefined;
  const [isBatch, hasWitness] = transferTypes[primaryType];
  const fields = [
    ['permitted', isBatch ? 'TokenPermissions[]' : 'TokenPermissions'],
    ['spender', 'address'],
    ['nonce', 'uint256'],
    ['deadline', 'uint256'],
  ];
  // Permit2 takes the name and the type of the witness from the dapp
  const witness = types[primaryType]?.[4];
  if (
    !hasFields(types, 'TokenPermissions', TOKEN_PERMISSIONS)
    || !hasFields(
      types,
      primaryType,
      hasWitness ? [...fields, [witness?.name ?? '', witness?.type ?? '']] : fields,
    )
  ) return undefined;
  const permitted = isBatch ? message.permitted : [message.permitted];
  if (!Array.isArray(permitted) || !permitted.length) return undefined;
  const tokens = permitted.map((permission: any) => allDefined({
    token: readSigned('address', permission?.token),
    amount: readSigned('uint256', permission?.amount),
  }));
  const deadline = readSigned('uint256', message.deadline);
  return (spender && deadline && tokens.every(Boolean))
    ? {
      kind: 'permit2Transfer', spender, deadline, tokens: tokens as any, hasWitness,
    }
    : undefined;
}

/**
 * What a typed data signature allows, for the permits that move tokens.
 * `undefined` for anything else, or data that doesn't match the standard exactly.
 */
export function decodeTypedDataIntent(typedData?: IEvmTypedData): TypedDataIntent | undefined {
  if (!typedData?.types || !typedData.message) return undefined;
  const {
    types,
    primaryType,
    domain = {},
    message,
  } = typedData;
  const verifyingContract = readSigned('address', domain.verifyingContract);
  if (!verifyingContract) return undefined;

  if (verifyingContract === PERMIT2_ADDRESS) {
    return (domain.name === 'Permit2') ? decodePermit2(typedData) : undefined;
  }

  // Only the recipient can submit `Receive…`, both move the tokens to it
  if (
    ['TransferWithAuthorization', 'ReceiveWithAuthorization'].includes(primaryType)
    && hasFields(types, primaryType, TRANSFER_AUTHORIZATION)
  ) {
    const values = allDefined({
      recipient: readSigned('address', message.to),
      amount: readSigned('uint256', message.value),
      validBefore: readSigned('uint256', message.validBefore),
    });
    return values && { kind: 'transferAuthorization', token: verifyingContract, ...values };
  }
  if (primaryType !== 'Permit') return undefined;

  if (hasFields(types, 'Permit', [
    ['owner', 'address'],
    ['spender', 'address'],
    ['value', 'uint256'],
    ['nonce', 'uint256'],
    ['deadline', 'uint256'],
  ])) {
    const values = allDefined({
      spender: readSigned('address', message.spender),
      amount: readSigned('uint256', message.value),
      deadline: readSigned('uint256', message.deadline),
    });
    return values && { kind: 'permit', token: verifyingContract, ...values };
  }

  if (hasFields(types, 'Permit', [
    ['holder', 'address'],
    ['spender', 'address'],
    ['nonce', 'uint256'],
    ['expiry', 'uint256'],
    ['allowed', 'bool'],
  ])) {
    const values = allDefined({
      spender: readSigned('address', message.spender),
      expiry: readSigned('uint256', message.expiry),
      allowed: (typeof message.allowed === 'boolean') ? message.allowed : undefined,
    });
    return values && { kind: 'daiPermit', token: verifyingContract, ...values };
  }
  return undefined;
}
