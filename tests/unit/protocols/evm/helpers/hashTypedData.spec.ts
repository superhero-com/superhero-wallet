import { signMessageWithPrivateKey } from 'web3-eth-accounts';
import { getSignedTypedData, hashTypedData } from '@/protocols/evm/helpers/hashTypedData';

// Expected hashes are computed by `@metamask/eth-sig-util` (TypedDataUtils.eip712Hash, V4).

/** The example of the EIP-712 spec, signed by keccak256('cow') */
const MAIL = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  message: {
    from: { name: 'Cow', wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826' },
    to: { name: 'Bob', wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB' },
    contents: 'Hello, Bob!',
  },
};
const COW_PRIVATE_KEY = '0xc85ef7d79691fe79573b1a7064c19c1a9819ebdbd1faaab1a8ec92344438aaf4';

/** Signed by Uniswap before a swap */
const PERMIT2_SINGLE = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    PermitSingle: [
      { name: 'details', type: 'PermitDetails' },
      { name: 'spender', type: 'address' },
      { name: 'sigDeadline', type: 'uint256' },
    ],
    PermitDetails: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
      { name: 'nonce', type: 'uint48' },
    ],
  },
  domain: { name: 'Permit2', chainId: '1', verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3' },
  primaryType: 'PermitSingle',
  message: {
    details: {
      token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      amount: '1461501637330902918203684832716283019655932542975',
      expiration: '1731600000',
      nonce: '0',
    },
    spender: '0x66a9893cc07d91d95644aedd05d03f95e1dba8af',
    sigDeadline: '1729010000',
  },
};

/** Signed by Uniswap to allow several tokens at once */
const PERMIT2_BATCH = {
  types: {
    EIP712Domain: PERMIT2_SINGLE.types.EIP712Domain,
    PermitBatch: [
      { name: 'details', type: 'PermitDetails[]' },
      { name: 'spender', type: 'address' },
      { name: 'sigDeadline', type: 'uint256' },
    ],
    PermitDetails: PERMIT2_SINGLE.types.PermitDetails,
  },
  domain: PERMIT2_SINGLE.domain,
  primaryType: 'PermitBatch',
  message: {
    details: [
      PERMIT2_SINGLE.message.details,
      {
        token: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        amount: '1000000000000000000',
        expiration: '1731600000',
        nonce: '1',
      },
    ],
    spender: PERMIT2_SINGLE.message.spender,
    sigDeadline: PERMIT2_SINGLE.message.sigDeadline,
  },
};

function single(type: string, value: unknown) {
  return {
    types: { M: [{ name: 'v', type }] }, primaryType: 'M', domain: {}, message: { v: value },
  };
}

describe('hashTypedData', () => {
  it('hashes and signs the EIP-712 example as the spec does', () => {
    const hash = hashTypedData(MAIL);
    expect(hash).toBe('0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2');
    expect(signMessageWithPrivateKey(hash, COW_PRIVATE_KEY).signature).toBe(
      '0x4355c47d63924e8a72e509b65029052eb6c299d53a04e167c5775fd466751c9d07299936d304c153f6443dfa05f40ff007d72911b6f72307f996231605b915621c',
    );
  });

  it('hashes a Permit2 permit', () => {
    expect(hashTypedData(PERMIT2_SINGLE))
      .toBe('0x4903f0fb7a175bc57de1fe5e79dfe645f50fa32a642944050722a45f7a8ea88e');
  });

  it('hashes an array of structs', () => {
    expect(hashTypedData(PERMIT2_BATCH))
      .toBe('0xe2c905c54ea4f88266b5979fcb681256a10bf640b2ce862ab14aa895109bd387');
  });

  it('hashes nested and fixed-size arrays', () => {
    expect(hashTypedData({
      types: { M: [{ name: 'v', type: 'uint256[][]' }, { name: 'w', type: 'address[2]' }] },
      primaryType: 'M',
      domain: {},
      message: {
        v: [[1, 2], [], ['0x3']],
        w: ['0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826', '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'],
      },
    })).toBe('0x78caa6a15a59ebd9bce74296938aca44a510a03e7aed4e543236cd7c118402df');
  });

  it('hashes a null struct value as zero', () => {
    expect(hashTypedData({
      types: {
        Person: [{ name: 'name', type: 'string' }],
        Pair: [{ name: 'a', type: 'Person' }, { name: 'b', type: 'Person' }],
      },
      primaryType: 'Pair',
      domain: {},
      message: { a: { name: 'x' }, b: null },
    })).toBe('0x86ff9820c9bb230daa1a848d420453e22345d47b05fd150dbc18bd8c5067d14a');
  });

  it('hashes a missing struct value as zero', () => {
    expect(hashTypedData({
      types: { Person: [{ name: 'name', type: 'string' }], Pair: [{ name: 'a', type: 'Person' }] },
      primaryType: 'Pair',
      domain: {},
      message: {},
    })).toBe('0x013d3e95fd56845378939cff4c151a22860449bf48c77000d8fdc6ef8e0f25dd');
  });

  it('lists the types a struct depends on alphabetically', () => {
    expect(hashTypedData({
      types: {
        Order: [{ name: 'offer', type: 'OfferItem[]' }, { name: 'consideration', type: 'ConsiderationItem[]' }],
        OfferItem: [{ name: 'token', type: 'address' }],
        ConsiderationItem: [{ name: 'token', type: 'address' }, { name: 'recipient', type: 'address' }],
      },
      primaryType: 'Order',
      domain: {},
      message: {
        offer: [{ token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' }],
        consideration: [{
          token: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          recipient: '0x66a9893cc07d91d95644aedd05d03f95e1dba8af',
        }],
      },
    })).toBe('0x9ee76077a0131ff8ac3bde32eb442e95f6139bd68ed3f0e67647c67e9d4eaf70');
  });

  it('hashes a type that refers to itself', () => {
    expect(hashTypedData({
      types: { Node: [{ name: 'value', type: 'uint8' }, { name: 'next', type: 'Node' }] },
      primaryType: 'Node',
      domain: {},
      message: { value: 1, next: { value: 2, next: null } },
    })).toBe('0xb5d399647e8b21ca8bb8dd224e035e39895fa4e4e5346d17f296dfaf1690741d');
  });

  it('hashes only the domain when it is the primary type', () => {
    expect(hashTypedData({ ...MAIL, primaryType: 'EIP712Domain' }))
      .toBe('0xaa83c70305ec6c131e7a88f258c40813447bec8b9bcef94e5479603d9959da07');
  });

  it('treats a missing EIP712Domain type as an empty one', () => {
    expect(hashTypedData(single('uint8', 1)))
      .toBe('0x062ca8914f730aef4bab59b6d3293a0f277037517a26aa70359bc08c4e485ca8');
  });

  it('hashes many structs whose type has many dependencies in time', () => {
    // M(I[] items) I(D0 x) D0(D1 n) … D999()
    const types: Record<string, { name: string; type: string }[]> = {
      M: [{ name: 'items', type: 'I[]' }],
      I: [{ name: 'x', type: 'D0' }],
    };
    for (let i = 0; i < 1000; i += 1) types[`D${i}`] = i < 999 ? [{ name: 'n', type: `D${i + 1}` }] : [];
    const typedData = {
      types, primaryType: 'M', domain: {}, message: { items: Array(2000).fill({ x: null }) },
    };

    const start = performance.now();
    expect(hashTypedData(typedData))
      .toBe('0x6165880510d231dcfa78b72d136794afc0ada6aba777662468335d6c2d312e4b');
    // The wallet hashes before it asks the user, so a dapp must not be able to keep it busy
    expect(performance.now() - start).toBeLessThan(1000);
  });

  it.each([
    ['a text that looks like hex', 'string', '0x414243', '0x8c3f4c3663d4954f7cae20821c3f9e0b0be44f485a6cf77f4d9536b3bd22502b'],
    ['a text', 'string', 'ABC', '0x72e7cc41eb9b95750079cb8f546938492c485df94180f736e0585b3019c936f4'],
    ['bytes given as text', 'bytes', 'xy', '0xf0c66b3a76226541fb3d65bcd053666f1c4de26d46decfb2747d33153d91d514'],
  ])('hashes %s', (_, type, value, expected) => {
    expect(hashTypedData(single(type, value))).toBe(expected);
  });

  it.each([
    ['a bool given as a string', single('bool', 'false'), /Expected a boolean/],
    ['a string given as a number', single('string', 5), /Expected a string/],
    ['an array of the wrong size', single('uint8[2]', [1]), /Expected uint8\[2\]/],
    ['a number out of range', single('uint8', 256), /maximum/],
    ['a missing field', { ...single('uint8', 1), message: {} }, /Missing value for field v/],
    ['an unknown primary type', { ...single('uint8', 1), primaryType: 'N' }, /No type definition specified: N/],
    // Padded by the encoder on the right, unlike the 0x0123 the user reads
    ['fixed bytes of odd hex', single('bytes32', '0x123'), /Expected whole bytes/],
  ])('rejects %s', (_, typedData, error) => {
    expect(() => hashTypedData(typedData)).toThrow(error);
  });
});

describe('getSignedTypedData', () => {
  it('leaves out the fields the types do not declare', () => {
    expect(getSignedTypedData({
      ...PERMIT2_BATCH,
      domain: { ...PERMIT2_BATCH.domain, version: '1' },
      message: {
        ...PERMIT2_BATCH.message,
        memo: 'Allows 10 USDC',
        details: PERMIT2_BATCH.message.details.map((details) => ({ ...details, note: 'Safe' })),
      },
    })).toEqual({
      primaryType: PERMIT2_BATCH.primaryType,
      domain: PERMIT2_BATCH.domain,
      message: PERMIT2_BATCH.message,
    });
  });

  it('shows a type named like an array with the fields it is hashed with', () => {
    expect(getSignedTypedData({
      types: { M: [{ name: 'x', type: 'Foo[]' }], 'Foo[]': [{ name: '0', type: 'uint8' }] },
      primaryType: 'M',
      domain: {},
      message: { x: [7, 9] },
    }).message).toEqual({ x: { 0: 7 } });
  });

  it('leaves out the message when only the domain gets signed', () => {
    expect(getSignedTypedData({ ...MAIL, primaryType: 'EIP712Domain' }))
      .toEqual({ primaryType: 'EIP712Domain', domain: MAIL.domain });
  });
});
