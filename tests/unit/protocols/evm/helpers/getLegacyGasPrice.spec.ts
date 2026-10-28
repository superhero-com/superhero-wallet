import { getLegacyGasPrice } from '@/protocols/evm/helpers';

const node = () => ({ getGasPrice: vi.fn(async () => 1000000000n) });

describe('getLegacyGasPrice', () => {
  it('returns the gas price picked on the form', async () => {
    const web3Eth = node();

    expect(await getLegacyGasPrice(web3Eth, '0.000000020000000000')).toBe(20000000000n);
    expect(web3Eth.getGasPrice).not.toHaveBeenCalled();
  });

  it.each([undefined, '', '0.000000000000000000'])(
    'asks the node when the form picked none (%s)',
    async (picked) => {
      expect(await getLegacyGasPrice(node(), picked)).toBe(1000000000n);
    },
  );
});
