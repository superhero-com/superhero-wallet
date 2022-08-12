import { mnemonicToSeed } from '@aeternity/bip39';
import { TxBuilder } from '@aeternity/aepp-sdk';
import { testAccount, txParams } from './config';
import runMigrations from '../../store/migrations';

// TODO: Use the current language from i18n module
export const formatDate = (time) => new Date(+time)
  .toLocaleDateString(navigator.language, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });

export const formatTime = (time) => new Date(+time).toLocaleTimeString(navigator.language, {
  timeStyle: 'short',
});

export const getLoginState = async ({
  backedUpSeed,
  balance,
  name,
  pendingTransaction,
  network,
}) => {
  const { mnemonic, address } = testAccount;
  const account = {
    address,
    privateKey: mnemonicToSeed(mnemonic).toString('hex'),
  };
  return {
    ...(await runMigrations()),
    account,
    mnemonic,
    backedUpSeed,
    current: { network: network || 'Testnet', token: 0, currency: 'usd' },
    balance,
    ...(name && { names: { defaults: { [`${account.address}-ae_uat`]: name } } }),
    ...(pendingTransaction
        && { transactions: { loaded: [], pending: { ae_uat: [pendingTransaction] } } }),
  };
};

export const buildTx = (txtype) => TxBuilder.buildTx({ ...txParams[txtype] }, txtype);

export const deferPromised = (func, ...args) => new Promise((resolve, reject) => setTimeout(() => {
  try {
    resolve(func(...args));
  } catch (error) {
    reject(error);
  }
}));

export const getDexTransactionTag = {
  add_liquidity: 'provide_liquidity',
  add_liquidity_ae: 'provide_liquidity',

  remove_liquidity: 'remove_liquidity',
  remove_liquidity_ae: 'remove_liquidity',

  swap_exact_tokens_for_tokens: 'swap',
  swap_exact_ae_for_tokens: 'swap',
  swap_tokens_for_exact_tokens: 'swap',
  swap_tokens_for_exact_ae: 'swap',
  swap_exact_tokens_for_ae: 'swap',
  swap_ae_for_exact_tokens: 'swap',

  create_allowance: 'allow_token',
  change_allowance: 'allow_token',
  transfer_allowance: 'allow_token',

  deposit: 'swap',
  withdraw: 'swap',
};
