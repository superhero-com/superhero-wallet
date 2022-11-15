import BigNumber from 'bignumber.js';
import { AETERNITY_SYMBOL } from './constants';

const defaultToken = {
  decimals: 18,
  symbol: AETERNITY_SYMBOL,
};
const defaultPoolToken = {
  symbol: 'Pool Token',
  decimals: 18,
};

// liquidityMethod: null - not a liquidity, add, remove
const genLiquiditySwapResolver = (
  tokenAMapper, tokenBMapper, poolTokenAmountMapper = null, liquidityMethod = null,
) => (transaction, tokens = null) => {
  const tokenA = tokenAMapper(transaction);
  const tokenB = tokenBMapper(transaction);
  let returns = [];
  if (transaction.tx.return && (transaction.tx.return.type === 'tuple'
    || (!poolTokenAmountMapper && transaction.tx.return.type === 'list'))) {
    returns = transaction.tx.return.value;
  }
  let poolTokenSymbol;
  if ((tokens?.[tokenA.contractId] || tokenA.isAe)
    && (tokens?.[tokenB.contractId] || tokenB.isAe)) {
    const symbolA = tokenA.isAe ? AETERNITY_SYMBOL : tokens?.[tokenA.contractId].symbol;
    const symbolB = tokenB.isAe ? AETERNITY_SYMBOL : tokens?.[tokenB.contractId].symbol;
    poolTokenSymbol = `${symbolA}/${symbolB}`;
  }

  return {
    tokens: [{
      ...tokenA,
      amount: returns?.[0]?.value || tokenA.amount,
      ...defaultToken,
      symbol: 'Token A',
      ...tokens?.[tokenA.contractId], /** token_a: IAEX9Minimal */
      isReceived: liquidityMethod === 'remove',
    }, {
      ...tokenB,
      amount: returns?.[1]?.value || tokenB.amount,
      ...defaultToken,
      symbol: 'Token B',
      ...tokens?.[tokenB.contractId], /** token_b: IAEX9Minimal */
      isReceived: liquidityMethod === 'remove' || !liquidityMethod,
    }, ...poolTokenAmountMapper ? [{
      ...defaultPoolToken,
      ...(poolTokenSymbol ? { symbol: poolTokenSymbol } : {}),
      amount: returns?.[2]?.value || poolTokenAmountMapper(transaction), // min_liquidity: int
      ...tokens?.[transaction.tx.log?.[0]?.address],
      isReceived: liquidityMethod && liquidityMethod === 'add',
      isPool: true,
    }] : []],
  };
};

/**
 * @description gets liquidity from a pair of tokenA*tokenB
 * ref: AedexV2Router.add_liquidity
 * @param transaction
 * @param tokens
 * @return {{ tokens: [tokenA, tokenB, poolToken] }}
 */
export const addLiquidity = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[0]?.value,
    minAmount: _arguments[4]?.value, // amount_a_min: int
    amount: _arguments[2]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[1]?.value,
    minAmount: _arguments[5]?.value, // amount_b_min: int
    amount: _arguments[3]?.value, // amount_b_desired: int
  }),
  // min_liquidity: int
  ({ tx: { arguments: _arguments } }) => new BigNumber(_arguments[2]?.value)
    .times(_arguments[3]?.value)
    .sqrt()
    .minus(_arguments[7]?.value[1]?.value),
  'add',
);

/**
 * @description gets liquidity from a pair of token*wae
 * ref: AedexV2Router.add_liquidity_ae
 * @param transaction
 * @param tokens
 * @return {{ tokens: [tokenA, tokenB, poolToken] }}
 */
export const addLiquidityAe = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[0]?.value,
    minAmount: _arguments[2]?.value, // amount_a_min: int
    amount: _arguments[1]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments, contractId, amount } }) => ({
    contractId,
    minAmount: _arguments[3]?.value, // amount_b_min: int
    amount, // amount_b_desired: int
    isAe: true,
  }),
  // min_liquidity: int
  ({ tx: { arguments: _arguments, amount } }) => new BigNumber(_arguments[1]?.value)
    .times(amount)
    .sqrt()
    .minus(_arguments[5]?.value[1]?.value),
  'add',
);

/**
 * ref: AedexV2Router.remove_liquidity
 * @param transaction
 * @param tokens
 * @return {{ tokens: [tokenA, tokenB, poolToken] }}
 */
export const removeLiquidity = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[0]?.value,
    minAmount: _arguments[3]?.value, // amount_a_min: int
    amount: _arguments[3]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[1]?.value,
    minAmount: _arguments[4]?.value, // amount_b_min: int
    amount: _arguments[4]?.value, // amount_b_desired: int
  }),
  ({ tx: { arguments: _arguments } }) => _arguments[2]?.value, // min_liquidity: int
  'remove',
);

/**
 * ref: AedexV2Router.remove_liquidity_ae
 * @param transaction
 * @param tokens
 * @return {{ tokens: [tokenA, tokenB, poolToken] }}
 */
export const removeLiquidityAe = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[0]?.value,
    minAmount: _arguments[2]?.value, // amount_a_min: int
    amount: _arguments[2]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments, contractId } }) => ({
    contractId,
    minAmount: _arguments[3]?.value, // amount_b_min: int
    amount: _arguments[3]?.value, // amount_b_desired: int
    isAe: true,
  }),
  ({ tx: { arguments: _arguments } }) => _arguments[1]?.value, // min_liquidity: int
  'remove',
);

/**
 * ref: AedexV2Router.swap_exact_tokens_for_tokens
 * @param transaction
 * @param tokens
 * @returns {{ tokens: [fromToken, toToken] }}
 */
export const swapExactTokensForTokens = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[2]?.value?.[0]?.value,
    amount: _arguments[0]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[2]?.value?.[_arguments[2]?.value?.length - 1]?.value,
    minAmount: _arguments[1]?.value, // amount_b_min: int
    amount: _arguments[1]?.value, // amount_b_desired: int
  }),
);

/**
 * ref: AedexV2Router.swap_tokens_for_exact_tokens
 * @param transaction
 * @param tokens
 * @returns {{ tokens: [fromToken, toToken] }}
 */
export const swapTokensForExactTokens = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[2]?.value?.[0]?.value,
    maxAmount: _arguments[1]?.value, // amount_a_max: int
    amount: _arguments[1]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[2]?.value?.[_arguments[2]?.value?.length - 1]?.value,
    amount: _arguments[0]?.value, // amount_b_desired: int
  }),
);

/**
 * ref: AedexV2Router.swap_exact_ae_for_tokens
 * @param transaction
 * @param tokens
 * @returns {{ tokens: [fromToken, toToken] }}
 */
export const swapExactAeForTokens = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments, amount } }) => ({
    contractId: _arguments[1]?.value?.[0]?.value,
    amount, // amount_a_desired: int
    isAe: true,
  }),
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[1]?.value?.[_arguments[1]?.value?.length - 1]?.value,
    minAmount: _arguments[0]?.value,
    amount: _arguments[0]?.value, // amount_b_desired: int
  }),
);

/**
 * ref: AedexV2Router.swap_tokens_for_exact_ae
 * @param transaction
 * @param tokens
 * @returns {{ tokens: [fromToken, toToken] }}
 */
export const swapTokensForExactAe = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[2]?.value?.[0]?.value,
    maxAmount: _arguments[1]?.value,
    amount: _arguments[1]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[2]?.value?.[_arguments[2]?.value?.length - 1]?.value,
    minAmount: _arguments[0]?.value,
    amount: _arguments[0]?.value, // amount_b_desired: int
    isAe: true,
  }),
);

/**
 * ref: AedexV2Router.swap_exact_tokens_for_ae
 * @param transaction
 * @param tokens
 * @returns {{ tokens: [fromToken, toToken] }}
 */
export const swapExactTokensForAe = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[2]?.value?.[0]?.value,
    minAmount: _arguments[0]?.value,
    amount: _arguments[0]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[2]?.value?.[_arguments[2]?.value?.length - 1]?.value,
    maxAmount: _arguments[1]?.value,
    amount: _arguments[1]?.value, // amount_b_desired: int
    isAe: true,
  }),
);

/**
 * ref: AedexV2Router.swap_ae_for_exact_tokens
 * @param transaction
 * @param tokens
 * @returns {{ tokens: [fromToken, toToken] }}
 */
export const swapAeForExactTokens = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments, amount } }) => ({
    contractId: _arguments[1]?.value?.[0]?.value,
    amount, // amount_a_desired: int
    isAe: true,
  }),
  ({ tx: { arguments: _arguments } }) => ({
    contractId: _arguments[1]?.value?.[_arguments[1]?.value?.length - 1]?.value,
    amount: _arguments[0]?.value, // amount_b_desired: int
  }),
);

/**
 * ref: AedexV2Pair.create_allowance
 * @param transaction
 * @param tokens
 * @returns {{ tokens: [token] }}
 */
export const createAllowance = (transaction, tokens = null) => ({
  tokens: [{
    amount: transaction.tx.arguments?.[1]?.value, // value: int
    ...defaultToken,
    symbol: 'Amount',
    ...tokens?.[transaction.tx.contractId],
  }],
});

/**
 * ref: AedexV2Pair.change_allowance
 * @param transaction
 * @param tokens
 * @returns {{ tokens: [tokenIn] }}
 */
export { createAllowance as changeAllowance };

/**
 * ref: AedexV2Pair.transfer_allowance
 * @param transaction
 * @param tokens
 * @returns {{ tokens: [token], sender, recipient }}
 */
export function transferAllowance(transaction, tokens = null) {
  const _arguments = transaction.tx.arguments; // arguments: [sender, recipient, amount]

  // path: list(IAEX9Minimal)
  const token = {
    amount: _arguments[3]?.value,
    ...defaultToken,
    symbol: 'Amount',
    ...tokens?.[transaction.tx.contractId],
  };

  return { tokens: [token], sender: _arguments[0]?.value, recipient: _arguments[1]?.value };
}

/**
 * ref: WAE.deposit
 * @param transaction
 * @param tokens
 * @returns {{ tokens: [token] }}
 */
export const deposit = (transaction, tokens = null) => ({
  tokens: [{
    ...defaultToken,
    amount: transaction.tx.amount,
    isReceived: false,
    isAe: true,
  },
  {
    ...defaultToken,
    amount: transaction.tx.amount,
    symbol: 'WAE',
    ...tokens?.[transaction.tx.contractId],
    isReceived: true,
  }],
});

/**
 * ref: WAE.withdraw
 * @param transaction
 * @param tokens
 * @returns {{ tokens: [token] }}
 */
export const withdraw = (transaction, tokens = null) => ({
  tokens: [{
    ...defaultToken,
    amount: transaction.tx.arguments?.[0]?.value,
    symbol: 'WAE',
    ...tokens?.[transaction.tx.contractId],
    isReceived: false,
  },
  {
    ...defaultToken,
    amount: transaction.tx.arguments?.[0]?.value,
    isReceived: true,
    isAe: true,
  }],
});
