import { decodeTypedDataIntent } from '@/protocols/evm/helpers/decodeTypedDataIntent';
import { PERMIT2_ADDRESS } from '@/protocols/evm/helpers/decodeEvmCallIntent';
import { getSignedTypedData, hashTypedData } from '@/protocols/evm/helpers/hashTypedData';

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const OWNER = '0x1111111111111111111111111111111111111111';
const PAYEE = '0x2222222222222222222222222222222222222222';
const ROUTER = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';
const MAX_UINT160 = (2n ** 160n - 1n).toString();
const MAX_UINT256 = (2n ** 256n - 1n).toString();

const PERMIT2_DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];
const PERMIT2_DOMAIN = { name: 'Permit2', chainId: '1', verifyingContract: PERMIT2_ADDRESS };
const PERMIT_DETAILS = [
  { name: 'token', type: 'address' },
  { name: 'amount', type: 'uint160' },
  { name: 'expiration', type: 'uint48' },
  { name: 'nonce', type: 'uint48' },
];
const TOKEN_PERMISSIONS = [
  { name: 'token', type: 'address' },
  { name: 'amount', type: 'uint256' },
];

/** As Uniswap asks for it */
const permitSingle = {
  types: {
    EIP712Domain: PERMIT2_DOMAIN_TYPE,
    PermitSingle: [
      { name: 'details', type: 'PermitDetails' },
      { name: 'spender', type: 'address' },
      { name: 'sigDeadline', type: 'uint256' },
    ],
    PermitDetails: PERMIT_DETAILS,
  },
  primaryType: 'PermitSingle',
  domain: PERMIT2_DOMAIN,
  message: {
    details: {
      token: USDC, amount: MAX_UINT160, expiration: '1795000000', nonce: '0',
    },
    spender: ROUTER,
    sigDeadline: '1795000000',
  },
};

/** As USDC takes it */
const permit = {
  types: {
    EIP712Domain: [...PERMIT2_DOMAIN_TYPE.slice(0, 1), { name: 'version', type: 'string' }, ...PERMIT2_DOMAIN_TYPE.slice(1)],
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  primaryType: 'Permit',
  domain: {
    name: 'USD Coin', version: '2', chainId: 1, verifyingContract: USDC,
  },
  message: {
    owner: OWNER, spender: ROUTER, value: MAX_UINT256, nonce: 0, deadline: MAX_UINT256,
  },
};

const TRANSFER_AUTHORIZATION = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'validAfter', type: 'uint256' },
  { name: 'validBefore', type: 'uint256' },
  { name: 'nonce', type: 'bytes32' },
];

/** EIP-3009, as USDC takes it */
const transferWithAuthorization = {
  types: {
    EIP712Domain: permit.types.EIP712Domain,
    TransferWithAuthorization: TRANSFER_AUTHORIZATION,
  },
  primaryType: 'TransferWithAuthorization',
  domain: permit.domain,
  message: {
    from: OWNER,
    to: PAYEE,
    value: '5000000000',
    validAfter: 0,
    validBefore: 1795000000,
    nonce: `0x${'ab'.repeat(32)}`,
  },
};

/** `transferWithAuthorization` with its type declared as `fields` */
const authorizationTyped = (fields: object[]) => ({
  ...transferWithAuthorization,
  types: { ...transferWithAuthorization.types, TransferWithAuthorization: fields },
});

const daiPermit = {
  types: {
    Permit: [
      { name: 'holder', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
      { name: 'allowed', type: 'bool' },
    ],
  },
  primaryType: 'Permit',
  domain: {
    name: 'Dai Stablecoin', version: '1', chainId: 1, verifyingContract: DAI,
  },
  message: {
    holder: OWNER, spender: ROUTER, nonce: 0, expiry: 0, allowed: true,
  },
};

const permitTransferFrom = {
  types: {
    PermitTransferFrom: [
      { name: 'permitted', type: 'TokenPermissions' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    TokenPermissions: TOKEN_PERMISSIONS,
  },
  primaryType: 'PermitTransferFrom',
  domain: PERMIT2_DOMAIN,
  message: {
    permitted: { token: USDC, amount: '5000000' },
    spender: ROUTER,
    nonce: '1',
    deadline: '1795000000',
  },
};

/** `permitSingle` with some of its values written otherwise */
const single = ({ details = {}, ...message }: Record<string, any> = {}, domain = {}) => ({
  ...permitSingle,
  domain: { ...permitSingle.domain, ...domain },
  message: {
    ...permitSingle.message,
    ...message,
    details: { ...permitSingle.message.details, ...details },
  },
});

/** What the confirmation gets of typed data the handler takes to sign */
const asShown = (typedData: any) => ({ types: typedData.types, ...getSignedTypedData(typedData) });

describe('decodeTypedDataIntent', () => {
  it('reads a Permit2 PermitSingle', () => {
    expect(decodeTypedDataIntent(permitSingle)).toEqual({
      kind: 'permit2Allowance',
      spender: ROUTER,
      sigDeadline: '1795000000',
      tokens: [{ token: USDC, amount: MAX_UINT160, expiration: '1795000000' }],
    });
  });

  it('reads a Permit2 PermitBatch', () => {
    const batch = {
      ...permitSingle,
      types: {
        ...permitSingle.types,
        PermitBatch: [
          { name: 'details', type: 'PermitDetails[]' },
          { name: 'spender', type: 'address' },
          { name: 'sigDeadline', type: 'uint256' },
        ],
      },
      primaryType: 'PermitBatch',
      message: {
        ...permitSingle.message,
        details: [
          permitSingle.message.details,
          {
            token: DAI, amount: '7', expiration: '0', nonce: '1',
          },
        ],
      },
    };

    expect(decodeTypedDataIntent(batch)).toMatchObject({
      kind: 'permit2Allowance',
      tokens: [
        { token: USDC, amount: MAX_UINT160 },
        { token: DAI, amount: '7', expiration: '0' },
      ],
    });
  });

  it('reads a Permit2 PermitTransferFrom', () => {
    expect(decodeTypedDataIntent(permitTransferFrom)).toEqual({
      kind: 'permit2Transfer',
      spender: ROUTER,
      deadline: '1795000000',
      tokens: [{ token: USDC, amount: '5000000' }],
      hasWitness: false,
    });
  });

  it.each([
    ['PermitBatchTransferFrom', [], {}, false],
    [
      'PermitBatchWitnessTransferFrom',
      [{ name: 'witness', type: 'Order' }],
      { witness: { id: '1' } },
      true,
    ],
  ])('reads a Permit2 %s of each token', (primaryType, witnessFields, witness, hasWitness) => {
    const batch = {
      ...permitTransferFrom,
      types: {
        TokenPermissions: TOKEN_PERMISSIONS,
        Order: [{ name: 'id', type: 'uint256' }],
        [primaryType as string]: [
          { name: 'permitted', type: 'TokenPermissions[]' },
          ...permitTransferFrom.types.PermitTransferFrom.slice(1),
          ...witnessFields as object[],
        ],
      },
      primaryType,
      message: {
        ...permitTransferFrom.message,
        permitted: [{ token: USDC, amount: '5000000' }, { token: DAI, amount: MAX_UINT256 }],
        ...witness as object,
      },
    };

    expect(decodeTypedDataIntent(batch as any)).toEqual({
      kind: 'permit2Transfer',
      spender: ROUTER,
      deadline: '1795000000',
      tokens: [{ token: USDC, amount: '5000000' }, { token: DAI, amount: MAX_UINT256 }],
      hasWitness,
    });
  });

  it('reads a Permit2 transfer with a witness, as UniswapX signs an order', () => {
    const withWitness = {
      ...permitTransferFrom,
      types: {
        ...permitTransferFrom.types,
        PermitWitnessTransferFrom: [
          ...permitTransferFrom.types.PermitTransferFrom,
          { name: 'witness', type: 'ExclusiveDutchOrder' },
        ],
        ExclusiveDutchOrder: [{ name: 'decayStartTime', type: 'uint256' }],
      },
      primaryType: 'PermitWitnessTransferFrom',
      message: { ...permitTransferFrom.message, witness: { decayStartTime: '1' } },
    };

    expect(decodeTypedDataIntent(withWitness))
      .toMatchObject({ kind: 'permit2Transfer', hasWitness: true });
  });

  it('reads a Permit2 transfer with a witness of any name, as Permit2 takes it from the dapp', () => {
    const withWitness = {
      ...permitTransferFrom,
      types: {
        ...permitTransferFrom.types,
        PermitWitnessTransferFrom: [
          ...permitTransferFrom.types.PermitTransferFrom,
          { name: 'order', type: 'Order' },
        ],
        Order: [{ name: 'id', type: 'uint256' }],
      },
      primaryType: 'PermitWitnessTransferFrom',
      message: { ...permitTransferFrom.message, order: { id: '1' } },
    };

    expect(decodeTypedDataIntent(withWitness)).toMatchObject({
      kind: 'permit2Transfer',
      tokens: [{ token: USDC, amount: '5000000' }],
      hasWitness: true,
    });
  });

  it.each([
    ['an amount in binary', single(), single({ details: { amount: `0b${'1'.repeat(160)}` } })],
    ['an amount in upper-case binary', single(), single({ details: { amount: `0B${'1'.repeat(160)}` } })],
    ['an expiration of -0', single({ details: { expiration: '0' } }), single({ details: { expiration: '-0' } })],
    ['a spender without 0x', single(), single({ spender: ROUTER.slice(2) })],
    ['a token without 0x', single(), single({ details: { token: USDC.slice(2) } })],
    [
      'a verifying contract without 0x',
      single(),
      single({}, { verifyingContract: PERMIT2_ADDRESS.slice(2) }),
    ],
    [
      'an amount as a number above 2^53',
      { ...permit, message: { ...permit.message, value: BigInt(1e30).toString() } },
      { ...permit, message: { ...permit.message, value: 1e30 } },
    ],
    [
      'a transferred value in hex',
      transferWithAuthorization,
      { ...transferWithAuthorization, message: { ...transferWithAuthorization.message, value: '0x12a05f200' } },
    ],
  ])('reads what is signed, written as %s', (_, canonical, variant) => {
    const intent = decodeTypedDataIntent(asShown(canonical));

    expect(hashTypedData(variant as any)).toBe(hashTypedData(canonical as any));
    expect(intent).toBeDefined();
    expect(decodeTypedDataIntent(asShown(variant))).toEqual(intent);
  });

  it('reads an EIP-2612 permit of the token that verifies it', () => {
    expect(decodeTypedDataIntent(permit)).toEqual({
      kind: 'permit', token: USDC, spender: ROUTER, amount: MAX_UINT256, deadline: MAX_UINT256,
    });
  });

  it('reads a permit of DAI', () => {
    expect(decodeTypedDataIntent(daiPermit)).toEqual({
      kind: 'daiPermit', token: DAI, spender: ROUTER, allowed: true, expiry: '0',
    });
  });

  it.each([
    'TransferWithAuthorization',
    // Only the recipient can submit it, the tokens leave all the same
    'ReceiveWithAuthorization',
  ])('reads an EIP-3009 %s of the token that verifies it', (primaryType) => {
    const authorization = {
      ...transferWithAuthorization,
      types: { EIP712Domain: permit.types.EIP712Domain, [primaryType]: TRANSFER_AUTHORIZATION },
      primaryType,
    };

    expect(decodeTypedDataIntent(asShown(authorization))).toEqual({
      kind: 'transferAuthorization',
      token: USDC,
      recipient: PAYEE,
      amount: '5000000000',
      validBefore: '1795000000',
    });
  });

  it('reads numbers given in hex', () => {
    const hexPermit = { ...permit, message: { ...permit.message, value: '0x3e8', deadline: 100 } };

    expect(decodeTypedDataIntent(hexPermit)).toMatchObject({ amount: '1000', deadline: '100' });
  });

  it.each([
    ['the name Permit2 on another contract', {
      ...permitSingle, domain: { ...PERMIT2_DOMAIN, verifyingContract: USDC },
    }],
    ['another name on the Permit2 contract', {
      ...permitSingle, domain: { ...PERMIT2_DOMAIN, name: 'Permit 2' },
    }],
    ['a field more', {
      ...permit,
      types: { ...permit.types, Permit: [...permit.types.Permit, { name: 'memo', type: 'string' }] },
    }],
    ['a renamed field', {
      ...permit,
      types: {
        ...permit.types,
        Permit: permit.types.Permit.map((field) => (field.name === 'spender' ? { ...field, name: 'to' } : field)),
      },
    }],
    ['another field type', {
      ...permitSingle,
      types: {
        ...permitSingle.types,
        PermitDetails: PERMIT_DETAILS.map((field) => (field.name === 'amount' ? { ...field, type: 'uint256' } : field)),
      },
    }],
    ['a malformed address', { ...permit, message: { ...permit.message, spender: '0x1234' } }],
    ['a negative amount', { ...permit, message: { ...permit.message, value: -1 } }],
    ['a fractional amount', { ...permit, message: { ...permit.message, value: '1.5' } }],
    ['no verifying contract', { ...permit, domain: { ...permit.domain, verifyingContract: undefined } }],
    ['an empty batch', {
      ...permitSingle,
      types: {
        ...permitSingle.types,
        PermitBatch: [
          { name: 'details', type: 'PermitDetails[]' },
          { name: 'spender', type: 'address' },
          { name: 'sigDeadline', type: 'uint256' },
        ],
      },
      primaryType: 'PermitBatch',
      message: { ...permitSingle.message, details: [] },
    }],
    // Permit2 hashes exactly one witness word
    ['a witness transfer with a field more', {
      ...permitTransferFrom,
      types: {
        ...permitTransferFrom.types,
        PermitWitnessTransferFrom: [
          ...permitTransferFrom.types.PermitTransferFrom,
          { name: 'witness', type: 'uint256' },
          { name: 'memo', type: 'uint256' },
        ],
      },
      primaryType: 'PermitWitnessTransferFrom',
    }],
    ['a witness transfer without the witness', {
      ...permitTransferFrom,
      primaryType: 'PermitWitnessTransferFrom',
      types: {
        ...permitTransferFrom.types,
        PermitWitnessTransferFrom: permitTransferFrom.types.PermitTransferFrom,
      },
    }],
    ['other typed data', {
      types: { Mail: [{ name: 'contents', type: 'string' }] },
      primaryType: 'Mail',
      domain: { verifyingContract: USDC },
      message: { contents: 'Hello' },
    }],
    ['the domain alone', { ...permit, primaryType: 'EIP712Domain', message: undefined }],
    ['a transfer authorization with its fields in another order', authorizationTyped([
      ...TRANSFER_AUTHORIZATION.slice(0, 3),
      TRANSFER_AUTHORIZATION[4],
      TRANSFER_AUTHORIZATION[3],
      TRANSFER_AUTHORIZATION[5],
    ])],
    ['a transfer authorization with a field more', authorizationTyped([
      ...TRANSFER_AUTHORIZATION,
      { name: 'memo', type: 'string' },
    ])],
    ['a transfer authorization with a number for a nonce', authorizationTyped([
      ...TRANSFER_AUTHORIZATION.slice(0, 5),
      { name: 'nonce', type: 'uint256' },
    ])],
  ])('gives nothing for %s', (_, typedData) => {
    expect(decodeTypedDataIntent(typedData as any)).toBeUndefined();
  });
});
