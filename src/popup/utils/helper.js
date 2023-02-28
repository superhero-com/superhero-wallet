import { mnemonicToSeed } from '@aeternity/bip39';
import { isURL } from 'validator';
import { derivePathFromKey, getKeyPair } from '@aeternity/hd-wallet/src/hd-key';
import {
  Crypto,
  TxBuilder,
  TxBuilderHelper,
} from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import {
  CONNECTION_TYPES,
  SEED_LENGTH,
  AENS_NAME_MAX_LENGTH,
} from './constants';
import { testAccount, txParams } from './testsConfig';
import runMigrations from '../../store/migrations';
import { IS_FIREFOX } from '../../lib/environment';

// eslint-disable-next-line no-console
export const handleUnknownError = (error) => console.warn('Unknown rejection', error);

export const calculateSupplyAmount = (_balance, _totalSupply, _reserve) => {
  if (!_balance || !_totalSupply || !_reserve) {
    return null;
  }
  const share = new BigNumber(_balance).times(100).div(_totalSupply);
  const amount = new BigNumber(_reserve).times(share).div(100);
  return amount.toFixed(0);
};

export const detectConnectionType = (port) => {
  const extensionProtocol = IS_FIREFOX ? 'moz-extension' : 'chrome-extension';
  const [senderUrl] = port.sender.url.split('?');
  const isExtensionSender = senderUrl.startsWith(`${extensionProtocol}://${browser.runtime.id}/index.html`)
    || IS_FIREFOX;
  if (CONNECTION_TYPES.POPUP === port.name && isExtensionSender) {
    return port.name;
  }
  return CONNECTION_TYPES.OTHER;
};

export const fetchJson = async (...args) => {
  const response = await fetch(...args);
  if (response.status === 204) return null;
  return response.json();
};

export const postJson = (url, options) => fetchJson(url, {
  method: 'post',
  headers: { 'Content-Type': 'application/json' },
  ...options,
  body: options.body && JSON.stringify(options.body),
});

export const checkAddress = (value) => Crypto.isAddressValid(value, 'ak')
  || Crypto.isAddressValid(value, 'ct')
  || Crypto.isAddressValid(value, 'ok');

export const checkAddressOrChannel = (value) => checkAddress(value) || Crypto.isAddressValid(value, 'ch');

export const checkAensName = (value) => (
  value.length <= AENS_NAME_MAX_LENGTH
  && /^[\p{L}\d]+\.chain$/gu.test(value)
);

export const getAddressByNameEntry = (nameEntry, pointer = 'account_pubkey') => ((nameEntry.pointers && nameEntry.pointers.find(({ key }) => key === pointer)) || {}).id;

export const validateSeedLength = (seed) => seed && seed.split(' ').length >= SEED_LENGTH;

export const contractCall = async ({
  instance,
  method,
  params = [],
  decode = false,
  async = true,
}) => {
  let call;
  try {
    call = await instance.methods[method](...params);
  } catch (e) {
    if (e.message.indexOf('wrong_abi_version') > -1) {
      instance.setOptions({ backend: 'aevm' });
      return contractCall({
        instance, method, params, decode, async,
      });
    }
    throw e.message;
  }

  if (async) return decode ? call.decodedResult : call;
  return instance.methods[method](...params);
};

export const setContractInstance = async (tx, sdk, contractAddress = null) => {
  let contractInstance = false;
  try {
    let backend = 'fate';
    if (typeof tx.abi_version !== 'undefined' && tx.abi_version !== 3) {
      backend = 'aevm';
    }
    contractInstance = await sdk.getContractInstance({
      source: tx.source,
      contractAddress,
    });
    contractInstance.setOptions({ backend });
  } catch (e) {
    handleUnknownError(e);
  }
  return Promise.resolve(contractInstance);
};

export const getTwitterAccountUrl = (url) => {
  const match = url.match(/https:\/\/twitter.com\/[a-zA-Z0-9_]+/g);
  return match ? match[0] : false;
};

export const isNotFoundError = (error) => error.statusCode === 404;

export const isAccountNotFoundError = (error) => isNotFoundError(error) && error?.response?.body?.reason === 'Account not found';

export const readValueFromClipboard = async () => {
  if (!process.env.UNFINISHED_FEATURES) return undefined;
  let value = '';
  switch (process.env.PLATFORM) {
    case 'cordova':
      value = await new Promise((...args) => window
        .cordova.plugins.clipboard.paste(...args));
      break;
    case 'extension':
      value = await browser.runtime.sendMessage({ method: 'paste' });
      break;
    default:
      try {
        value = await navigator.clipboard.readText();
      } catch (e) {
        if (!e.message.includes('Read permission denied.')) {
          handleUnknownError(e);
        }
      }
  }
  return value;
};

export const getAllPages = async (getFunction, getNextPage) => {
  const result = [];
  let nextPageUrl;
  while (nextPageUrl !== null) {
    // eslint-disable-next-line no-await-in-loop
    const { data, next } = await (nextPageUrl
      ? getNextPage(nextPageUrl)
      : getFunction());
    if (data?.length) result.push(...data);
    nextPageUrl = next || null;
  }
  return result;
};
export const getHdWalletAccount = (wallet, accountIdx = 0) => {
  const keyPair = getKeyPair(derivePathFromKey(`${accountIdx}h/0h/0h`, wallet).privateKey);
  return {
    ...keyPair,
    idx: accountIdx,
    address: TxBuilderHelper.encode(keyPair.publicKey, 'ak'),
  };
};

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

export const isValidURL = (url) => {
  const pattern = new RegExp(/((http(s)?:\/\/)?(localhost|127.0.0.1)((:)?[\0-9]{4})?\/?)/, 'i');
  return isURL(url) || !!pattern.test(url);
};
