import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET, PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

const EVM_ADDRESS = '0x909C407d6FD235DE14db97e2234fCB71E99d6E1c';
const AE_ADDRESS = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';

describe.each([
  PROTOCOLS.ethereum,
  PROTOCOLS.bnb,
  PROTOCOLS.avalanche,
  PROTOCOLS.polygonPos,
])('%s recipient address', (protocol) => {
  const adapter = ProtocolAdapterFactory.getAdapter(protocol);

  it.each([
    ['a checksummed address', EVM_ADDRESS, true],
    ['an all lowercase address', EVM_ADDRESS.toLowerCase(), true],
    ['an all uppercase address', `0x${EVM_ADDRESS.slice(2).toUpperCase()}`, true],
    ['a mixed case address with a wrong checksum', '0x909c407d6FD235DE14db97e2234fCB71E99d6E1c', false],
    ['an address one byte short', EVM_ADDRESS.slice(0, -2), false],
    ['an aeternity address', AE_ADDRESS, false],
  ])('%s, %s, is valid: %s', (_, address, isValid) => {
    expect(adapter.isAccountAddressValid(address)).toBe(isValid);
  });
});

describe('aeternity recipient address', () => {
  const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity);

  it.each([
    ['an account address', AE_ADDRESS, true],
    ['an account address with a changed character', `${AE_ADDRESS.slice(0, -1)}6`, false],
    ['a contract address', 'ct_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5', false],
    ['an EVM address', EVM_ADDRESS, false],
  ])('%s, %s, is valid: %s', (_, address, isValid) => {
    expect(adapter.isAccountAddressValid(address)).toBe(isValid);
  });
});

describe('Solana recipient address', () => {
  const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.solana);

  // Any 32 bytes in base58 pass, programs and token mints included: no on-chain check
  it.each([
    ['a wallet address', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', true],
    ['the System Program id', '11111111111111111111111111111111', true],
    ['the USDC mint', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', true],
    ['a string with characters outside base58', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt10', false],
    ['an EVM address', EVM_ADDRESS, false],
  ])('%s, %s, is valid: %s', (_, address, isValid) => {
    expect(adapter.isAccountAddressValid(address)).toBe(isValid);
  });
});

describe.each([
  [PROTOCOLS.dogecoin, 'D5nFgspqgExJFLXP8prT1EfEqxAGsqmeNU', 'nUqKQtZkcDR28K6aAeVuFeFY5pYZtf92ht'],
  [PROTOCOLS.bitcoin, 'bc1qqurswpc8qurswpc8qurswpc8qurswpc89fe3yv', 'tb1qqurswpc8qurswpc8qurswpc8qurswpc800zzll'],
])('%s recipient address', (protocol, mainnetAddress, testnetAddress) => {
  const adapter = ProtocolAdapterFactory.getAdapter(protocol);

  it.each([
    ['a mainnet address', mainnetAddress, NETWORK_TYPE_MAINNET, true],
    ['a mainnet address', mainnetAddress, NETWORK_TYPE_TESTNET, false],
    ['a testnet address', testnetAddress, NETWORK_TYPE_TESTNET, true],
    ['a testnet address', testnetAddress, NETWORK_TYPE_MAINNET, false],
    ['a mainnet address with a changed character', `${mainnetAddress.slice(0, -1)}z`, NETWORK_TYPE_MAINNET, false],
  ])('%s, %s, is valid on %s: %s', (_, address, networkType, isValid) => {
    expect(adapter.isAccountAddressValid(address, networkType)).toBe(isValid);
  });
});

describe.each([
  PROTOCOLS.ethereum,
  PROTOCOLS.bnb,
  PROTOCOLS.avalanche,
  PROTOCOLS.polygonPos,
])('%s address normalization', (protocol) => {
  const adapter = ProtocolAdapterFactory.getAdapter(protocol);

  it.each([
    ['a checksummed address', EVM_ADDRESS],
    ['an all lowercase address', EVM_ADDRESS.toLowerCase()],
    ['an all uppercase address', `0x${EVM_ADDRESS.slice(2).toUpperCase()}`],
    ['an address without 0x', EVM_ADDRESS.slice(2).toLowerCase()],
    ['an address with 0X', `0X${EVM_ADDRESS.slice(2)}`],
  ])('checksums %s, %s', (_, address) => {
    expect(adapter.isAccountAddressValid(address)).toBe(true);
    expect(adapter.normalizeAddress(address)).toBe(EVM_ADDRESS);
  });

  it.each([
    ['a mixed case address with a wrong checksum', '0x909c407d6FD235DE14db97e2234fCB71E99d6E1c'],
    ['an address one byte short', EVM_ADDRESS.slice(0, -2)],
    ['an aeternity address', AE_ADDRESS],
    ['an empty value', ''],
    ['no value', undefined],
  ])('keeps %s, %s', (_, value) => {
    expect(adapter.normalizeAddress(value)).toBe(value);
  });
});

it.each([
  [PROTOCOLS.aeternity, AE_ADDRESS],
  [PROTOCOLS.bitcoin, 'BC1QQURSWPC8QURSWPC8QURSWPC8QURSWPC89FE3YV'],
  [PROTOCOLS.dogecoin, 'D5nFgspqgExJFLXP8prT1EfEqxAGsqmeNU'],
  [PROTOCOLS.solana, 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'],
])('keeps a %s address as it is', (protocol, address) => {
  expect(ProtocolAdapterFactory.getAdapter(protocol).normalizeAddress(address)).toBe(address);
});
