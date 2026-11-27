/**
 * The pool token estimate of a liquidity deposit that the middleware lists without its
 * return value, as for a call that failed. The arguments are as the wallet reads them from
 * the middleware, with long numbers as strings: an option such as `min_liquidity` is
 * `{ type: 'variant', value: [1, { type: 'int', value: 1000 }] }` on mainnet
 * (e.g. th_oJ6ZCndvYgRiJUSFGF1thnUTCEEA9xNkdpZSts4c3CETsnDX5), and a None is `[0]`.
 */
import { MemoryAccount } from '@aeternity/aepp-sdk';
import type { ITransaction } from '@/types';
import { getTransactionTokenInfoResolver } from '@/protocols/aeternity/helpers';

const CALLER = MemoryAccount.generate().address;
const newContract = () => MemoryAccount.generate().address.replace('ak_', 'ct_');
const TOKEN_A = newContract();
const TOKEN_B = newContract();

const int = (value: number | string) => ({ type: 'int', value });
const some = (value: number) => ({ type: 'variant', value: [1, int(value)] });
const none = { type: 'variant', value: [0] };

function getPoolTokenAmount(fn: 'addLiquidity' | 'addLiquidityAe', tx: object) {
  const { tokens } = getTransactionTokenInfoResolver(fn)!({ tx } as unknown as ITransaction);
  return tokens.find(({ isPool }) => isPool)?.amount?.toString();
}

describe('the pool token estimate of a liquidity deposit from the middleware', () => {
  it('takes the minimum liquidity of two tokens off the root of their product', () => {
    expect(getPoolTokenAmount('addLiquidity', {
      function: 'add_liquidity',
      arguments: [
        { type: 'contract', value: TOKEN_A },
        { type: 'contract', value: TOKEN_B },
        int('4000000000000000000'),
        int('9000000000000000000'),
        int('3800000000000000000'),
        int('8500000000000000000'),
        { type: 'address', value: CALLER },
        some(1000),
        int(1700000000000),
      ],
    })).toBe('5999999999999999000');
  });

  it('takes nothing off the root of the product without a minimum liquidity', () => {
    expect(getPoolTokenAmount('addLiquidity', {
      function: 'add_liquidity',
      arguments: [
        { type: 'contract', value: TOKEN_A },
        { type: 'contract', value: TOKEN_B },
        int('4000000000000000000'),
        int('9000000000000000000'),
        int('3800000000000000000'),
        int('8500000000000000000'),
        { type: 'address', value: CALLER },
        none,
        int(1700000000000),
      ],
    })).toBe('6000000000000000000');
  });

  it('takes the minimum liquidity of a token and the coin off the root of their product', () => {
    expect(getPoolTokenAmount('addLiquidityAe', {
      function: 'add_liquidity_ae',
      amount: '9000000000000000000',
      arguments: [
        { type: 'contract', value: TOKEN_A },
        int('4000000000000000000'),
        int('3800000000000000000'),
        int('8500000000000000000'),
        { type: 'address', value: CALLER },
        some(1000),
        int(1700000000000),
      ],
    })).toBe('5999999999999999000');
  });
});
