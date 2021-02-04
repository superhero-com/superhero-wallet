import { isFQDN } from 'validator';
import { detect } from 'detect-browser';
import { get } from 'lodash-es';
import { Crypto } from '@aeternity/aepp-sdk/es';
import { AE_AMOUNT_FORMATS, formatAmount } from '@aeternity/aepp-sdk/es/utils/amount-formatter';
import BigNumber from 'bignumber.js';
import { CONNECTION_TYPES, defaultNetworks, defaultNetwork } from './constants';
import { getState } from '../../store/plugins/persistState';

export const aeToAettos = (v) =>
  formatAmount(v, {
    denomination: AE_AMOUNT_FORMATS.AE,
    targetDenomination: AE_AMOUNT_FORMATS.AETTOS,
  });
export const aettosToAe = (v) =>
  formatAmount(v, {
    denomination: AE_AMOUNT_FORMATS.AETTOS,
    targetDenomination: AE_AMOUNT_FORMATS.AE,
  });

export const convertToken = (balance, precision) => BigNumber(balance).shiftedBy(precision);

export const IN_FRAME = window.parent !== window;
export const IN_POPUP = !!window.opener && window.name.startsWith('popup-');

export const convertToAE = (balance) => +(balance / 10 ** 18).toFixed(7);

export const toURL = (url) => new URL(url.includes('://') ? url : `https://${url}`);

export const extractHostName = (url) => toURL(url).hostname;

export const validateTipUrl = (urlAsString) => {
  try {
    const url = toURL(urlAsString);
    return ['http:', 'https:'].includes(url.protocol) && isFQDN(url.hostname);
  } catch (e) {
    return false;
  }
};

export const detectConnectionType = (port) => {
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

export const checkAddress = (value) =>
  Crypto.isAddressValid(value, 'ak') ||
  Crypto.isAddressValid(value, 'ct') ||
  Crypto.isAddressValid(value, 'ok');

export const validateAddress = (address, type) => Crypto.isAddressValid(address, type);

export const chekAensName = (value) => value.endsWith('.test') || value.endsWith('.chain');

export const stringifyForStorage = (state) =>
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

export const parseFromStorage = (state) =>
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

export const escapeSpecialChars = (str) =>
  str.replace(/(\r\n|\n|\r|\n\r)/gm, ' ').replace(/"/g, '');

export const checkHashType = async (hash) => {
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

export const getActiveNetwork = async () => {
  const all = await getAllNetworks();
  return all[get(await getState(), 'current.network', defaultNetwork.name)];
};

export const getTwitterAccountUrl = (url) => {
  const match = url.match(/https:\/\/twitter.com\/[a-zA-Z0-9_]+/g);
  return match ? match[0] : false;
};

export const isNotFoundError = (error) => error.isAxiosError && error?.response.status === 404;

// eslint-disable-next-line no-console
export const handleUnknownError = (error) => console.warn('Unknown rejection', error);

export const ellipseStringMid = (str, allowedLength) => {
  if (str.length > allowedLength) {
    return `${str.substr(0, (allowedLength / 3) * 2)}...${str.substr(-allowedLength / 3)}`;
  }
  return str;
};

export const setBalanceLocalStorage = (balance) => {
  localStorage.rxjs = JSON.stringify({ ...JSON.parse(localStorage.rxjs || '{}'), balance });
};

export const getBalanceLocalStorage = () =>
  localStorage.rxjs ? JSON.parse(localStorage.rxjs).balance : '0';

export const getAeppUrl = (v) => new URL(v.connection.port.sender.url);

export const categorizeContractCallTxObject = (transaction) => {
  if (transaction.tx.type !== 'ContractCallTx') return null;
  switch (transaction.tx.function) {
    case 'transfer':
    case 'change_allowance':
    case 'create_allowance':
      return {
        to: transaction.tx.arguments[0].value,
        amount: transaction.tx.arguments[1].value,
        token: transaction.tx.contractId,
      };
    case 'tip_token':
      return {
        url: transaction.tx.arguments[0].value,
        note: transaction.tx.arguments[1].value,
        amount: transaction.tx.arguments[3].value,
        token: transaction.tx.arguments[2].value,
      };
    case 'retip_token':
      return {
        url: transaction.tx.arguments[0].value,
        amount: transaction.tx.arguments[2].value,
        token: transaction.tx.arguments[1].value,
      };
    default:
      return null;
  }
};
