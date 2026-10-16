import { ref } from 'vue';

import { useFungibleTokens, useTransactionData } from '@/composables';
import { ASSET_TYPES, PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { EtherscanService } from '@/protocols/ethereum/libs/EtherscanService';
import { normalizeWeb3EthTransactionStructure } from '@/protocols/ethereum/helpers';

const OWNER = '0x1111111111111111111111111111111111111111';
const OTHER = '0x2222222222222222222222222222222222222222';
const LISTED_TOKEN = '0x3333333333333333333333333333333333333333';
const UNLISTED_TOKEN = '0x4444444444444444444444444444444444444444';
const SOME_CONTRACT = '0x5555555555555555555555555555555555555555';

const SOL_OWNER = 'SolOwner1111111111111111111111111111111111';
const SOL_OTHER = 'SolOther2222222222222222222222222222222222';
const LISTED_MINT = 'ListedMint111111111111111111111111111111111';
const UNLISTED_MINT = 'UnlistedMint1111111111111111111111111111111';
const SOME_PROGRAM = 'SomeProgram11111111111111111111111111111111';

const { tokenBalances } = useFungibleTokens();

beforeEach(() => {
  tokenBalances.value = [
    {
      protocol: PROTOCOLS.ethereum, contractId: LISTED_TOKEN, decimals: 6, symbol: 'USDC',
    },
    {
      protocol: PROTOCOLS.solana, contractId: LISTED_MINT, decimals: 6, symbol: 'USDC',
    },
  ];
});

const tokenRow = (amount, symbol) => ({ amount, symbol, assetType: ASSET_TYPES.token });
const coinRow = (protocol, amount) => ({
  amount,
  symbol: ProtocolAdapterFactory.getAdapter(protocol).coinSymbol,
  assetType: ASSET_TYPES.coin,
});

const normalizeEtherscanRow = (protocol, row) => EtherscanService
  .normalizeEtherscanTransactionStructure(protocol, row, OWNER);
const normalizeSolanaTransaction = (tx) => ProtocolAdapterFactory
  .getAdapter(PROTOCOLS.solana)
  .normalizeTransaction('sig', tx, SOL_OWNER);

/** Etherscan `tokentx` row: 1000 tokens with 6 decimals. */
function etherscanTokenTransfer({ protocol = PROTOCOLS.ethereum, contractId, isSent = true }) {
  return normalizeEtherscanRow(protocol, {
    confirmations: '100',
    contractAddress: contractId,
    from: isSent ? OWNER : OTHER,
    to: isSent ? OTHER : OWNER,
    gasPrice: '10000000000',
    gasUsed: '100000',
    hash: '0xhash',
    input: 'deprecated',
    nonce: '1',
    timeStamp: '1700000000',
    tokenDecimal: '6',
    tokenName: 'Some Token',
    tokenSymbol: 'SOME',
    value: '1000000000',
  });
}

/** SPL transfer of 1000 tokens out of the owner's account. */
function solanaTokenTransfer(mint) {
  const balance = (owner, uiAmount) => ({ owner, mint, uiTokenAmount: { uiAmount } });
  return normalizeSolanaTransaction({
    meta: {
      fee: 5000,
      preTokenBalances: [balance(SOL_OWNER, 1000), balance(SOL_OTHER, 0)],
      postTokenBalances: [balance(SOL_OWNER, 0), balance(SOL_OTHER, 1000)],
    },
    transaction: { message: { accountKeys: [], instructions: [] } },
  });
}

function getAssets(transaction) {
  const { transactionAssets } = useTransactionData({ transaction: ref(transaction) });
  return transactionAssets.value.map(({ amount, symbol, assetType }) => ({
    amount: +amount,
    symbol,
    assetType,
  }));
}

describe('useTransactionData token transfers', () => {
  it('shows a listed token with the fee on its own row', () => {
    const transaction = etherscanTokenTransfer({ contractId: LISTED_TOKEN });

    expect(getAssets(transaction)).toEqual([
      tokenRow(1000, 'USDC'),
      coinRow(PROTOCOLS.ethereum, transaction.tx.fee),
    ]);
  });

  it('shows an unlisted token as a token, not as the coin', () => {
    const sent = etherscanTokenTransfer({ contractId: UNLISTED_TOKEN });
    const received = etherscanTokenTransfer({ contractId: UNLISTED_TOKEN, isSent: false });

    expect(getAssets(sent)).toEqual([
      tokenRow(1000, undefined),
      coinRow(PROTOCOLS.ethereum, sent.tx.fee),
    ]);
    expect(getAssets(received)).toEqual([tokenRow(1000, undefined)]);
  });

  it('keeps the fee out of the token amount when the chain has no token list', () => {
    const transaction = etherscanTokenTransfer({
      protocol: PROTOCOLS.avalanche,
      contractId: UNLISTED_TOKEN,
    });

    expect(getAssets(transaction)).toEqual([
      tokenRow(1000, undefined),
      coinRow(PROTOCOLS.avalanche, transaction.tx.fee),
    ]);
  });

  it('shows an unlisted SPL token as a token, not as the coin', () => {
    const transaction = solanaTokenTransfer(UNLISTED_MINT);

    expect(getAssets(transaction)).toEqual([
      tokenRow(1000, undefined),
      coinRow(PROTOCOLS.solana, transaction.tx.fee),
    ]);
  });

  it('still shows a contract call fetched by hash as the coin with the fee', () => {
    const transaction = normalizeWeb3EthTransactionStructure({
      blockNumber: 1n,
      from: OWNER,
      to: SOME_CONTRACT,
      gas: '100000',
      gasPrice: '10000000000',
      hash: '0xhash',
      input: '0xa9059cbb',
      type: 2n,
      value: '500000000000000000',
    }, undefined, OWNER);

    expect(getAssets(transaction)).toEqual([
      coinRow(PROTOCOLS.ethereum, 0.5 + transaction.tx.fee),
    ]);
  });

  it('still shows a contract creation as the coin with the fee', () => {
    const transaction = normalizeEtherscanRow(PROTOCOLS.ethereum, {
      confirmations: '100',
      contractAddress: SOME_CONTRACT,
      from: OWNER,
      to: '',
      gasPrice: '10000000000',
      gasUsed: '100000',
      hash: '0xhash',
      input: '0x6080',
      nonce: '1',
      timeStamp: '1700000000',
      value: '0',
    });

    expect(getAssets(transaction)).toEqual([
      coinRow(PROTOCOLS.ethereum, transaction.tx.fee),
    ]);
  });

  it('still shows a Solana program call as the coin with the fee', () => {
    const transaction = normalizeSolanaTransaction({
      meta: {
        fee: 5000,
        preBalances: [2000000000, 0],
        postBalances: [1499995000, 0],
      },
      transaction: {
        message: {
          accountKeys: [{ toBase58: () => SOL_OWNER }, { toBase58: () => SOME_PROGRAM }],
          instructions: [{ programIdIndex: 1, accounts: [0] }],
          indexToProgramIds: new Map([[1, { toBase58: () => SOME_PROGRAM }]]),
        },
      },
    });

    expect(getAssets(transaction)).toEqual([coinRow(PROTOCOLS.solana, 0.500005)]);
  });
});
