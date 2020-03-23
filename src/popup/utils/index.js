/* eslint-disable radix */
import { mnemonicToSeed } from '@aeternity/bip39';
import { TxBuilder } from '@aeternity/aepp-sdk/es';
import { testAccount, txParams } from './config';

export const setTxInQueue = async tx => {
  const { processingTx } = await browser.storage.local.get('processingTx');
  let list = [];
  if (typeof processingTx !== 'undefined' && processingTx.length) {
    list = [...list, ...processingTx];
  }
  list.push(tx);
  await browser.storage.local.set({ processingTx: list });
};

export const setPendingTx = async tx => {
  const { pendingTxs } = await browser.storage.local.get('pendingTxs');
  let list = [];
  if (pendingTxs && pendingTxs.length) {
    list = [...list, ...pendingTxs];
  }
  list.push(tx);
  await setTxInQueue(tx.hash);
  await browser.storage.local.set({ pendingTxs: list });
  return true;
};

export const formatTime = time => new Date(parseInt(time)).toLocaleTimeString(navigator.language, { timeStyle: 'short', hourCycle: 'h24', hour: '2-digit', minute: '2-digit' });

export const formatDate = time =>
  new Date(parseInt(time)).toLocaleString(navigator.language, {
    timeStyle: 'short',
    dateStyle: 'short',
    hourCycle: 'h24',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

export const mockLogin = async (options = {}) => {
  const { mnemonic, publicKey } = testAccount;
  const seed = mnemonicToSeed(mnemonic).toString('hex');
  const keypair = {
    publicKey,
    privateKey: seed,
  };
  await browser.storage.local.set({ userAccount: keypair, isLogged: true, termsAgreed: true });
  const sub = [];
  sub.push({
    name: 'Main Account',
    publicKey: keypair.publicKey,
    balance: 0,
    root: true,
    aename: options.name ? options.name : null,
  });
  await browser.storage.local.set({ subaccounts: sub, activeAccount: 0, mnemonic });

  if (options.balance) await browser.storage.local.set({ tokenBal: options.balance });
  if (options.lastRoute) await localStorage.setItem('lsroute', options.lastRoute);
  if (options.backupSeed) await browser.storage.local.set({ backed_up_Seed: true });
};

export const buildTx = txtype => TxBuilder.buildTx({ ...txParams[txtype] }, txtype);
