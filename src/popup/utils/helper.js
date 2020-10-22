import { isFQDN } from 'validator';
import { detect } from 'detect-browser';
import { get } from 'lodash-es';
import { Crypto, TxBuilder } from '@aeternity/aepp-sdk/es';
import { AE_AMOUNT_FORMATS, formatAmount } from '@aeternity/aepp-sdk/es/utils/amount-formatter';
import BigNumber from 'bignumber.js';
import { CONNECTION_TYPES, defaultNetworks, defaultNetwork } from './constants';
import { getState } from '../../store/plugins/persistState';

export const aeToAettos = v =>
  formatAmount(v, {
    denomination: AE_AMOUNT_FORMATS.AE,
    targetDenomination: AE_AMOUNT_FORMATS.AETTOS,
  });
export const aettosToAe = v =>
  formatAmount(v, {
    denomination: AE_AMOUNT_FORMATS.AETTOS,
    targetDenomination: AE_AMOUNT_FORMATS.AE,
  });

export const convertToken = (balance, precision) => BigNumber(balance).shiftedBy(precision);

export const shuffleArray = array => {
  const shuffle = array;
  let currentIndex = shuffle.length;
  let temporaryValue;
  let randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = shuffle[currentIndex];
    shuffle[currentIndex] = shuffle[randomIndex];
    shuffle[randomIndex] = temporaryValue;
  }

  return shuffle;
};

export const IN_FRAME = window.parent !== window;
export const IN_POPUP = !!window.opener && window.name.startsWith('popup-');

export const convertToAE = balance => +(balance / 10 ** 18).toFixed(7);

export const toURL = url => new URL(url.includes('://') ? url : `https://${url}`);

export const extractHostName = url => toURL(url).hostname;

export const validateTipUrl = urlAsString => {
  try {
    const url = toURL(urlAsString);
    return ['http:', 'https:'].includes(url.protocol) && isFQDN(url.hostname);
  } catch (e) {
    return false;
  }
};

export const detectConnectionType = port => {
  const extensionProtocol = detect().name === 'firefox' ? 'moz-extension' : 'chrome-extension';
  const [senderUrl] = port.sender.url.split('?');
  const isExtensionSender =
    senderUrl.startsWith(`${extensionProtocol}://${browser.runtime.id}/popup/popup.html`) ||
    detect().name === 'firefox';
  if (
    [CONNECTION_TYPES.EXTENSION, CONNECTION_TYPES.POPUP].includes(port.name) &&
    isExtensionSender
  ) {
    return port.name;
  }
  return CONNECTION_TYPES.OTHER;
};

export const getAeppAccountPermission = async (host, account) => {
  const { connectedAepps } = await getState();
  if (!Object.keys(connectedAepps).length) return false;
  if (!connectedAepps[host]) return false;
  if (connectedAepps[host].includes(account)) {
    return true;
  }
  return false;
};

export const fetchJson = async (...args) => {
  const response = await fetch(...args);
  return response.json();
};

export const postJson = (url, options) =>
  fetchJson(url, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body && JSON.stringify(options.body),
  });

export const checkAddress = value =>
  Crypto.isAddressValid(value, 'ak') ||
  Crypto.isAddressValid(value, 'ct') ||
  Crypto.isAddressValid(value, 'ok');

export const validateAddress = (address, type) => Crypto.isAddressValid(address, type);

export const chekAensName = value => value.endsWith('.test') || value.endsWith('.chain');

export const stringifyForStorage = state =>
  JSON.stringify(state, (key, value) => {
    if (value instanceof ArrayBuffer) {
      return { type: 'ArrayBuffer', data: Array.from(new Uint8Array(value)) };
    }
    if (value instanceof Uint8Array) {
      return { type: 'Uint8Array', data: Array.from(value) };
    }

    if (value instanceof Int8Array) {
      return { type: 'Int8Array', data: Array.from(value) };
    }

    if (value instanceof Int16Array) {
      return { type: 'Int16Array', data: Array.from(value) };
    }

    if (value instanceof Uint16Array) {
      return { type: 'Uint16Array', data: Array.from(value) };
    }

    if (value instanceof Int32Array) {
      return { type: 'Int32Array', data: Array.from(value) };
    }

    if (value instanceof Uint32Array) {
      return { type: 'Uint32Array', data: Array.from(value) };
    }

    if (value instanceof Float32Array) {
      return { type: 'Float32Array', data: Array.from(value) };
    }

    if (value instanceof Float64Array) {
      return { type: 'Float64Array', data: Array.from(value) };
    }

    return value;
  });

export const parseFromStorage = state =>
  JSON.parse(state, (key, value) => {
    if (value && value.type === 'ArrayBuffer') {
      return new Uint8Array(value.data).buffer;
    }
    if (value && value.type === 'Uint8Array') {
      return new Uint8Array(value.data);
    }
    if (value && value.type === 'Buffer') {
      return new Uint8Array(value.data);
    }
    if (value && value.type === 'Int8Array') {
      return new Int8Array(value.data);
    }

    if (value && value.type === 'Int16Array') {
      return new Int16Array(value.data);
    }

    if (value && value.type === 'Uint16Array') {
      return new Uint16Array(value.data);
    }

    if (value && value.type === 'Int32Array') {
      return new Int32Array(value.data);
    }

    if (value && value.type === 'Uint32Array') {
      return new Uint32Array(value.data);
    }

    if (value && value.type === 'Float32Array') {
      return new Float32Array(value.data);
    }

    if (value && value.type === 'Float64Array') {
      return new Float64Array(value.data);
    }

    return value;
  });

export const getAddressByNameEntry = (nameEntry, pointer = 'account_pubkey') =>
  ((nameEntry.pointers && nameEntry.pointers.find(({ key }) => key === pointer)) || {}).id;

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
      return contractCall({ instance, method, params, decode, async });
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
    contractInstance = await sdk.getContractInstance(tx.source, {
      contractAddress,
      forceCodeCheck: true,
    });
    contractInstance.setOptions({ backend });
  } catch (e) {
    console.error(`setContractInstance: ${e}`);
  }
  return Promise.resolve(contractInstance);
};

export const getAllNetworks = async () =>
  [...defaultNetworks, ...get(await getState(), 'userNetworks', [])].reduce(
    (p, n) => ({ ...p, [n.name]: { ...n } }),
    {},
  );

export const escapeSpecialChars = str => str.replace(/(\r\n|\n|\r|\n\r)/gm, ' ').replace(/"/g, '');

export const addTipAmount = async amount => {
  const { tippedAmount } = await browser.storage.local.get('tippedAmount');
  return browser.storage.local.set({ tippedAmount: tippedAmount ? tippedAmount + amount : amount });
};

export const resetTippedAmount = () => browser.storage.local.remove('tippedAmount');

export const getTippedAmount = async () =>
  (await browser.storage.local.get('tippedAmount')).tippedAmount;

export const getContractCallInfo = (transaction, contractAddress = null) => {
  if (!transaction) return { isTip: false, contractId: null, amount: 0 };

  const { tipContract } = defaultNetwork;
  const { tx } = TxBuilder.unpackTx(transaction);

  return {
    isTip: tx.contractId === tipContract || tx.contractId === contractAddress,
    contractId: tx.contractId,
    amount: convertToAE(tx.amount),
  };
};

export const checkHashType = async hash => {
  const accountPublicKeyRegex = RegExp('^ak_[1-9A-HJ-NP-Za-km-z]{48,50}$');
  const transactionHashRegex = RegExp('^th_[1-9A-HJ-NP-Za-km-z]{48,50}$');
  const nameRegex = RegExp('^nm_[1-9A-HJ-NP-Za-km-z]{48,50}$');
  let valid = true;
  let endpoint = null;

  if (transactionHashRegex.test(hash)) {
    endpoint = 'transactions';
  } else if (accountPublicKeyRegex.test(hash)) {
    endpoint = 'account/transactions';
  } else if (nameRegex.test(hash) || hash.endsWith('.chain')) {
    endpoint = 'names';
  } else {
    valid = false;
  }

  return { valid, endpoint };
};

// TODO: Use proper promises/reactivity instead of polling pattern
export const pollGetter = getter =>
  new Promise(resolve => {
    const id = setInterval(() => {
      if (!getter()) return;
      clearInterval(id);
      resolve();
    }, 300);
  });

export const getActiveNetwork = async () => {
  const all = await getAllNetworks();
  return all[get(await getState(), 'current.network', defaultNetwork.name)];
};

export const getTwitterAccountUrl = url => {
  const match = url.match(/https:\/\/twitter.com\/[a-zA-Z0-9_]+/g);
  return match ? match[0] : false;
};

export const removeDuplicates = arr => {
  const convertResultToSet = new Set([...arr]);
  return [...convertResultToSet];
};
