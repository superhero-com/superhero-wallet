import BigNumber from 'bignumber.js';
import {
  AssetList,
  ITokenResolved,
  ITransaction,
  TxFunctionParsed,
} from '@/types';
import {
  AE_SYMBOL,
  AE_COIN_PRECISION,
  AE_CONTRACT_ID,
  AE_PROTOCOL_NAME,
} from '@/protocols/aeternity/config';
import { ASSET_TYPES, PROTOCOLS } from '@/constants';

interface TransactionResolverReturnData {
  tokens: ITokenResolved[];
  sender?: any;
  recipient?: any;
}

type TransactionResolver = (
  transaction: ITransaction,
  tokens?: AssetList | null,
  tokenAddressMapper?: (address: string) => string,
) => TransactionResolverReturnData;

type TransactionResolverGenerator = (
  tokenAMapper: (t: ITransaction) => ITokenResolved,
  tokenBMapper: (t: ITransaction) => ITokenResolved,
  poolTokenAmountMapper?: (t: ITransaction) => BigNumber,
  liquidityMethod?: 'add' | 'remove'
) => TransactionResolver;

type TransactionResolvers = Partial<Record<TxFunctionParsed, TransactionResolver>>;

const defaultToken: ITokenResolved = {
  symbol: AE_SYMBOL,
  name: AE_PROTOCOL_NAME,
  decimals: AE_COIN_PRECISION,
  contractId: AE_CONTRACT_ID,
};
const defaultPoolToken = {
  symbol: 'Pool Token',
  decimals: AE_COIN_PRECISION,
};

// liquidityMethod: null - not a liquidity, add, remove
const genLiquiditySwapResolver: TransactionResolverGenerator = (
  tokenAMapper,
  tokenBMapper,
  poolTokenAmountMapper = undefined,
  liquidityMethod = undefined,
) => (transaction, tokens = null) => {
  const tokenA = tokenAMapper(transaction);
  const tokenB = tokenBMapper(transaction);
  let returns: any[] = [];
  if (
    transaction.tx.return
    && (
      transaction.tx.return.type === 'tuple'
      || (!poolTokenAmountMapper && transaction.tx.return.type === 'list')
    )
  ) {
    returns = transaction.tx.return.value;
  }
  let poolTokenSymbol;
  if ((tokens?.[tokenA.contractId!] || tokenA.isWrappedCoin)
    && (tokens?.[tokenB.contractId!] || tokenB.isWrappedCoin)) {
    const symbolA = tokenA.isWrappedCoin ? AE_SYMBOL : tokens?.[tokenA.contractId!].symbol;
    const symbolB = tokenB.isWrappedCoin ? AE_SYMBOL : tokens?.[tokenB.contractId!].symbol;
    poolTokenSymbol = `${symbolA}/${symbolB}`;
  }

  return {
    tokens: [{
      ...tokenA,
      amount: returns?.[0]?.value || tokenA.amount,
      ...defaultToken,
      ...tokens?.[tokenA.contractId!], /** token_a: IAEX9Minimal */
      isReceived: liquidityMethod === 'remove',
    }, {
      ...tokenB,
      amount: returns?.[1]?.value || tokenB.amount,
      ...defaultToken,
      ...tokens?.[tokenB.contractId!], /** token_b: IAEX9Minimal */
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
 * @return {{ tokens: [tokenA, tokenB, poolToken] }}
 */
const addLiquidity = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[0]?.value,
    minAmount: _arguments[4]?.value, // amount_a_min: int
    amount: _arguments[2]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[1]?.value,
    minAmount: _arguments[5]?.value, // amount_b_min: int
    amount: _arguments[3]?.value, // amount_b_desired: int
  }),
  // min_liquidity: int
  ({ tx: { arguments: _arguments } }) => new BigNumber(_arguments?.[2]?.value)
    .times(_arguments?.[3]?.value)
    .sqrt()
    .minus(_arguments?.[7]?.value[1]?.value),
  'add',
);

/**
 * @description gets liquidity from a pair of token*wae
 * ref: AedexV2Router.add_liquidity_ae
 * @return {{ tokens: [tokenA, tokenB, poolToken] }}
 */
const addLiquidityAe = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[0]?.value,
    minAmount: _arguments[2]?.value, // amount_a_min: int
    amount: _arguments[1]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments = [], contractId, amount } }) => ({
    contractId,
    minAmount: _arguments[3]?.value, // amount_b_min: int
    amount, // amount_b_desired: int
    isWrappedCoin: true,
  }),
  // min_liquidity: int
  ({ tx: { arguments: args = [], amount } }) => new BigNumber(args?.[1]?.value)
    .times(amount)
    .sqrt()
    .minus(args[5]?.value[1]?.value),
  'add',
);

/**
 * ref: AedexV2Router.remove_liquidity
 * @return {{ tokens: [tokenA, tokenB, poolToken] }}
 */
const removeLiquidity = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[0]?.value,
    minAmount: _arguments[3]?.value, // amount_a_min: int
    amount: _arguments[3]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[1]?.value,
    minAmount: _arguments[4]?.value, // amount_b_min: int
    amount: _arguments[4]?.value, // amount_b_desired: int
  }),
  ({ tx: { arguments: args = [] } }) => args[2]?.value, // min_liquidity: int
  'remove',
);

/**
 * ref: AedexV2Router.remove_liquidity_ae
 * @return {{ tokens: [tokenA, tokenB, poolToken] }}
 */
const removeLiquidityAe = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[0]?.value,
    minAmount: _arguments[2]?.value, // amount_a_min: int
    amount: _arguments[2]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments = [], contractId } }) => ({
    contractId,
    minAmount: _arguments[3]?.value, // amount_b_min: int
    amount: _arguments[3]?.value, // amount_b_desired: int
    isWrappedCoin: true,
  }),
  ({ tx: { arguments: args = [] } }) => args[1]?.value, // min_liquidity: int
  'remove',
);

/**
 * ref: AedexV2Router.swap_exact_tokens_for_tokens
 * @returns {{ tokens: [fromToken, toToken] }}
 */
const swapExactTokensForTokens = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[2]?.value?.[0]?.value,
    amount: _arguments[0]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[2]?.value?.at(-1)?.value,
    minAmount: _arguments[1]?.value, // amount_b_min: int
    amount: _arguments[1]?.value, // amount_b_desired: int
  }),
);

/**
 * ref: AedexV2Router.swap_tokens_for_exact_tokens
 * @returns {{ tokens: [fromToken, toToken] }}
 */
const swapTokensForExactTokens = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[2]?.value?.[0]?.value,
    maxAmount: _arguments[1]?.value, // amount_a_max: int
    amount: _arguments[1]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[2]?.value?.at(-1)?.value,
    amount: _arguments[0]?.value, // amount_b_desired: int
  }),
);

/**
 * ref: AedexV2Router.swap_exact_ae_for_tokens
 * @returns {{ tokens: [fromToken, toToken] }}
 */
const swapExactAeForTokens = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments = [], amount } }) => ({
    contractId: _arguments[1]?.value?.[0]?.value,
    amount, // amount_a_desired: int
    isWrappedCoin: true,
  }),
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[1]?.value?.at(-1)?.value,
    minAmount: _arguments[0]?.value,
    amount: _arguments[0]?.value, // amount_b_desired: int
  }),
);

/**
 * ref: AedexV2Router.swap_tokens_for_exact_ae
 * @returns {{ tokens: [fromToken, toToken] }}
 */
const swapTokensForExactAe = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[2]?.value?.[0]?.value,
    maxAmount: _arguments[1]?.value,
    amount: _arguments[1]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[2]?.value?.at(-1)?.value,
    minAmount: _arguments[0]?.value,
    amount: _arguments[0]?.value, // amount_b_desired: int
    isWrappedCoin: true,
  }),
);

/**
 * ref: AedexV2Router.swap_exact_tokens_for_ae
 * @returns {{ tokens: [fromToken, toToken] }}
 */
const swapExactTokensForAe = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[2]?.value?.[0]?.value,
    minAmount: _arguments[0]?.value,
    amount: _arguments[0]?.value, // amount_a_desired: int
  }),
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[2]?.value?.at(-1)?.value,
    maxAmount: _arguments[1]?.value,
    amount: _arguments[1]?.value, // amount_b_desired: int
    isWrappedCoin: true,
  }),
);

/**
 * ref: AedexV2Router.swap_ae_for_exact_tokens
 */
const swapAeForExactTokens = genLiquiditySwapResolver(
  ({ tx: { arguments: _arguments = [], amount } }) => ({
    contractId: _arguments[1]?.value?.[0]?.value,
    amount, // amount_a_desired: int
    isWrappedCoin: true,
  }),
  ({ tx: { arguments: _arguments = [] } }) => ({
    contractId: _arguments[1]?.value?.at(-1)?.value,
    amount: _arguments[0]?.value, // amount_b_desired: int
  }),
);

/**
 * ref: AedexV2Pair.create_allowance
 */
const changeAllowance: TransactionResolver = (transaction, tokens = null) => ({
  tokens: [{
    amount: transaction.tx.arguments?.[1]?.value, // value: int
    ...defaultToken,
    symbol: 'Amount',
    ...tokens?.[transaction.tx.contractId],
  }],
});

/**
 * ref: AedexV2Pair.transfer_allowance
 * @returns {{ tokens: [token], sender, recipient }}
 */
const transferAllowance: TransactionResolver = (transaction, tokens = null) => {
  const [sender, recipient, amount] = transaction.tx.arguments || [];

  // path: list(IAEX9Minimal)
  const token = {
    amount: amount?.value,
    ...defaultToken,
    symbol: 'Amount',
    ...tokens?.[transaction.tx.contractId],
  };

  return {
    tokens: [token],
    sender: sender?.value,
    recipient: recipient?.value,
  };
};

/**
 * ref: WAE.deposit
 */
const deposit: TransactionResolver = (transaction, tokens = null) => ({
  tokens: [
    {
      ...defaultToken,
      amount: transaction.tx.amount,
      isReceived: false,
      isWrappedCoin: true,
    },
    {
      ...defaultToken,
      amount: transaction.tx.amount,
      symbol: 'WAE',
      ...tokens?.[transaction.tx.contractId],
      isReceived: true,
    },
  ],
});

/**
 * ref: WAE.withdraw
 */
const withdraw: TransactionResolver = (transaction, tokens = null) => ({
  tokens: [
    {
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
      isWrappedCoin: true,
    },
  ],
});

/**
 * Token Sale Buy
 */
const buy: TransactionResolver = (transaction, tokens = null, tokenAddressMapper = undefined) => {
  const tokenAddress: string | undefined = tokenAddressMapper?.(transaction.tx.contractId);

  const [amount] = transaction.tx.arguments!;
  const token = {
    amount: amount?.value,
    ...defaultToken,
    symbol: tokenAddress && tokens?.[tokenAddress]?.symbol,
    ...(tokenAddress ? tokens?.[tokenAddress] : {}),
    isReceived: true,
  };
  const aeToken = {
    ...defaultToken,
    assetType: ASSET_TYPES.coin,
    protocol: PROTOCOLS.aeternity,
    amount: transaction.tx.amount,
    isReceived: false,
  };

  return {
    tokens: [token, aeToken],
  };
};

/**
 * Token Sale Sell
 */
const sell: TransactionResolver = (transaction, tokens = null, tokenAddressMapper = undefined) => {
  const isConfirm = !transaction.tx.return;
  const tokenAddress: string | undefined = tokenAddressMapper?.(transaction.tx.contractId);

  const amount = isConfirm ? transaction.tx.arguments?.[0]?.value : transaction.tx.arguments?.[0]!;
  const aeAmount = isConfirm ? transaction.tx.arguments?.[1]?.value : transaction.tx.return?.value;
  const token = {
    amount: amount?.value,
    ...defaultToken,
    symbol: tokenAddress && tokens?.[tokenAddress]?.symbol,
    ...(tokenAddress ? tokens?.[tokenAddress] : {}),
    isReceived: false,
  };
  const aeToken = {
    ...defaultToken,
    assetType: ASSET_TYPES.coin,
    protocol: PROTOCOLS.aeternity,
    amount: aeAmount,
    isReceived: true,
  };
  return {
    tokens: [aeToken, token],
  };
};

const resolvers: TransactionResolvers = {
  addLiquidity,
  addLiquidityAe,
  removeLiquidity,
  removeLiquidityAe,
  swapExactTokensForTokens,
  swapExactTokensForAe,
  swapExactAeForTokens,
  swapTokensForExactTokens,
  swapTokensForExactAe,
  swapAeForExactTokens,
  changeAllowance,
  createAllowance: changeAllowance,
  transferAllowance,
  deposit,
  withdraw,
  buy,
  sell,
};

export function getTransactionTokenInfoResolver(txFunctionName: TxFunctionParsed) {
  return resolvers[txFunctionName];
}
