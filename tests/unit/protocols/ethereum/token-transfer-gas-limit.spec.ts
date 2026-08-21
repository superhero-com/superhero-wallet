/**
 * [BLACK-BOX] `getTokenTransferGasLimit` - the fee the send form displays and validates
 * against, so it must match the broadcasting adapter on decimals scaling and headroom.
 */
const RECIPIENT = '0x0000000000000000000000000000000000000002';
const TOKEN_CONTRACT = '0x0000000000000000000000000000000000000003';
const FROM_ACCOUNT = '0x0000000000000000000000000000000000000001';

const contractMockState = {
  decimals: 18,
  estimateGas: 65000,
  transferCalls: [] as Array<{ recipient: string; amount: any }>,
};

async function loadHelper() {
  vi.resetModules();

  // The helper imports the DEFAULT export (`import Contract from 'web3-eth-contract'`),
  // so that is what has to be replaced - mocking the named export leaves the real
  // contract in place and the estimate hits the network.
  vi.doMock('web3-eth-contract', async (importOriginal) => ({
    ...await importOriginal<typeof import('web3-eth-contract')>(),
    // vitest constructs this directly (`new Contract(...)`), which throws on an arrow fn.
    // eslint-disable-next-line prefer-arrow-callback
    default: vi.fn().mockImplementation(function ContractMock() {
      return {
        setProvider: vi.fn(),
        methods: {
          decimals: () => ({ call: () => Promise.resolve(contractMockState.decimals) }),
          transfer: (recipient: string, amount: any) => {
            contractMockState.transferCalls.push({ recipient, amount });
            return { estimateGas: () => Promise.resolve(contractMockState.estimateGas) };
          },
        },
      };
    }),
  }));

  const BigNumber = (await import('bignumber.js')).default;
  const { getTokenTransferGasLimit } = await import('@/protocols/ethereum/helpers');
  return { getTokenTransferGasLimit, BigNumber };
}

let getTokenTransferGasLimit: any;
let BigNumber: any;

beforeAll(async () => {
  const loaded = await loadHelper();
  getTokenTransferGasLimit = loaded.getTokenTransferGasLimit;
  BigNumber = loaded.BigNumber;
});

beforeEach(() => {
  contractMockState.decimals = 18;
  contractMockState.estimateGas = 65000;
  contractMockState.transferCalls.length = 0;
});

const estimate = (amount: string) => getTokenTransferGasLimit(
  TOKEN_CONTRACT,
  RECIPIENT,
  FROM_ACCOUNT,
  new BigNumber(amount),
  'http://localhost:8545',
);

const lastTransferAmount = () => BigInt(
  contractMockState.transferCalls.at(-1)!.amount as string,
);

describe('getTokenTransferGasLimit', () => {
  it('scales the estimated amount by a 6-decimal token\'s own decimals', async () => {
    contractMockState.decimals = 6;

    await estimate('1');

    expect(lastTransferAmount()).toBe(BigInt(1000000));
  });

  it('scales the estimated amount by an 18-decimal token\'s decimals', async () => {
    contractMockState.decimals = 18;

    await estimate('1');

    expect(lastTransferAmount()).toBe(BigInt('1000000000000000000'));
  });

  it('adds the same 15% headroom as the adapter, then rounds up to the next thousand', async () => {
    // 65000 -> 74750 -> 75000.
    contractMockState.estimateGas = 65000;

    expect(await estimate('1')).toBe(75000);
  });
});
