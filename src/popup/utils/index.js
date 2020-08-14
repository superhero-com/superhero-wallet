import { mnemonicToSeed } from '@aeternity/bip39';
import { TxBuilder } from '@aeternity/aepp-sdk/es';
import { testAccount, txParams } from './config';
import runMigrations from '../../store/migrations';

export const formatDate = time =>
  new Date(+time).toLocaleString(navigator.language, {
    timeStyle: 'short',
    dateStyle: 'short',
    hourCycle: 'h23',
  });

export const getLoginState = async ({ backedUpSeed, balance, name, pendingTransaction }) => {
  const { mnemonic, publicKey } = testAccount;
  const account = {
    publicKey,
    privateKey: mnemonicToSeed(mnemonic).toString('hex'),
  };
  return {
    ...(await runMigrations()),
    account,
    subaccounts: [
      {
        name: 'Main Account',
        publicKey: account.publicKey,
        balance: 10,
        root: true,
      },
    ],
    mnemonic,
    backedUpSeed,
    balance,
    ...(name && { names: { defaults: { [`${account.publicKey}-ae_uat`]: name } } }),
    ...(pendingTransaction && { transactions: { latest: [], pending: [pendingTransaction] } }),
  };
};

export const buildTx = txtype => TxBuilder.buildTx({ ...txParams[txtype] }, txtype);
