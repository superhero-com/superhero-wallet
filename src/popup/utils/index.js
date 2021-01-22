import { mnemonicToSeed } from '@aeternity/bip39';
import { TxBuilder } from '@aeternity/aepp-sdk/es';
import { testAccount, txParams } from './config';
import runMigrations from '../../store/migrations';

export const formatDate = (time) =>
  // TODO: Use the current language from i18n module
  new Date(+time).toLocaleString(navigator.language, {
    timeStyle: 'short',
    dateStyle: 'short',
  });

export const getLoginState = async ({
  backedUpSeed,
  balance,
  name,
  pendingTransaction,
  network,
}) => {
  const { mnemonic, publicKey } = testAccount;
  const account = {
    publicKey,
    privateKey: mnemonicToSeed(mnemonic).toString('hex'),
  };
  return {
    ...(await runMigrations()),
    account,
    mnemonic,
    backedUpSeed,
    current: { network: network || 'Testnet', token: 0, currency: 'usd' },
    balance,
    ...(name && { names: { defaults: { [`${account.publicKey}-ae_uat`]: name } } }),
    ...(pendingTransaction && { transactions: { latest: [], pending: [pendingTransaction] } }),
  };
};

export const buildTx = (txtype) => TxBuilder.buildTx({ ...txParams[txtype] }, txtype);
