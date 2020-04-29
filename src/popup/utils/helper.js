import { Crypto, TxBuilder } from '@aeternity/aepp-sdk/es';
import Swagger from '@aeternity/aepp-sdk/es/utils/swagger';
import { AE_AMOUNT_FORMATS, formatAmount } from '@aeternity/aepp-sdk/es/utils/amount-formatter';
import {
  MAGNITUDE_EXA,
  MAGNITUDE_GIGA,
  MAGNITUDE_PICO,
  CONNECTION_TYPES,
  networks,
  DEFAULT_NETWORK,
} from './constants';
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

export const convertToAE = balance => +(balance / 10 ** 18).toFixed(7);

export const extractHostName = url => new URL(url.includes('://') ? url : `http://${url}`).hostname;

export const validateUrl = url => {
  const urlRegex = /(https?:\/\/)?([\w-])+\.{1}([a-zA-Z]{2,63})([/\w-]*)*\/?\??([^#\n\r]*)?#?([^\n\r]*)/g;
  return urlRegex.test(url);
};

export const detectBrowser = () => {
  if ((navigator.userAgent.indexOf('Opera') || navigator.userAgent.indexOf('OPR')) !== -1) {
    return 'Opera';
  }
  if (navigator.userAgent.indexOf('Chrome') !== -1) {
    return 'Chrome';
  }
  if (navigator.userAgent.indexOf('Safari') !== -1) {
    return 'Safari';
  }
  if (navigator.userAgent.indexOf('Firefox') !== -1) {
    return 'Firefox';
  }
  if (navigator.userAgent.indexOf('MSIE') !== -1 || !!document.documentMode === true) {
    return 'IE';
  }
  return 'unknown';
};

const getExtensionProtocol = () => {
  let extensionUrl = 'chrome-extension';
  if (detectBrowser() === 'Firefox') {
    extensionUrl = 'moz-extension';
  }
  return extensionUrl;
};

export const detectConnectionType = port => {
  const extensionProtocol = getExtensionProtocol();
  const senderUrl = port.sender.url.split('?');
  let type = CONNECTION_TYPES.OTHER;
  if (
    port.name === CONNECTION_TYPES.EXTENSION &&
    (senderUrl[0] === `${extensionProtocol}://${browser.runtime.id}/popup/popup.html` ||
      detectBrowser() === 'Firefox')
  ) {
    type = CONNECTION_TYPES.EXTENSION;
  } else if (
    port.name === CONNECTION_TYPES.POPUP &&
    (senderUrl[0] === `${extensionProtocol}://${browser.runtime.id}/popup/popup.html` ||
      detectBrowser() === 'Firefox')
  ) {
    type = CONNECTION_TYPES.POPUP;
  } else {
    type = CONNECTION_TYPES.OTHER;
  }
  return type;
};

export const fetchData = (url, method, fetchedData) => {
  if (method === 'post') {
    return fetch(url, {
      method,
      body: fetchedData,
    }).then(response => response.json());
  }

  return fetch(url).then(response => response.json());
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

export const middleware = async (network, current) => {
  const swag = await fetchJson(`${network[current.network].middlewareUrl}/middleware/api`);
  swag.paths['/names/auctions/{name}/info'] = {
    get: {
      operationId: 'getAuctionInfoByName',
      parameters: [
        {
          in: 'path',
          name: 'name',
          required: true,
          type: 'string',
        },
      ],
    },
  };
  return Swagger.compose({
    methods: {
      urlFor: path => network[current.network].middlewareUrl + path,
      axiosError: () => '',
    },
  })({ swag });
};

export const convertAmountToCurrency = (currency, amount) => currency * amount;

export const checkAddress = value =>
  Crypto.isAddressValid(value, 'ak') ||
  Crypto.isAddressValid(value, 'ct') ||
  Crypto.isAddressValid(value, 'ok');

export const isInt = n => n % 1 === 0;

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

export const escapeCallParams = params =>
  params.map(p => {
    if (typeof p === 'string' && !checkAddress(p)) {
      return `"${p}"`;
    }
    return p.toString();
  });

export const getAddressByNameEntry = (nameEntry, pointer = 'account_pubkey') =>
  ((nameEntry.pointers && nameEntry.pointers.find(({ key }) => key === pointer)) || {}).id;

const toFiatFixedValue = v => (v.e < -2 ? '0.01' : v.toFixed(2));

export const currencyAmount = (value, { symbol, isCrypto = true }) => {
  let v;
  if (typeof value === 'string') v = value;
  else v = isCrypto ? value.toFixed(8) : toFiatFixedValue(value);
  return `${!isCrypto ? symbol : ''}${v}${isCrypto ? ` ${symbol}` : ''}`;
};

const prefixes = [
  { name: 'Exa', magnitude: MAGNITUDE_EXA },
  { name: 'Giga', magnitude: MAGNITUDE_GIGA },
  { name: '', magnitude: 0 },
  { name: 'Pico', magnitude: MAGNITUDE_PICO },
];

const getNearestPrefix = exponent =>
  prefixes.reduce((p, n) =>
    Math.abs(n.magnitude - exponent) < Math.abs(p.magnitude - exponent) ? n : p,
  );

const getLowerBoundPrefix = exponent =>
  prefixes.find(p => p.magnitude <= exponent) || prefixes[prefixes.length - 1];

export const prefixedAmount = value => {
  const { name, magnitude } = (value.e < 0 ? getNearestPrefix : getLowerBoundPrefix)(value.e);
  const v = value
    .shiftedBy(-magnitude)
    .precision(9 + Math.min(value.e - magnitude, 0))
    .toFixed();
  return `${v}${name ? ' ' : ''}${name}`;
};

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

export const getContractInstance = async (source, options = {}) => {
  try {
    let store = await import('../../store');
    store = store.default;
    return await store.state.sdk.getContractInstance(source, { ...options, forceCodeCheck: true });
  } catch (e) {
    return {};
  }
};

export const getUniqueId = (length = 6) => {
  const ID_LENGTH = length;
  const START_LETTERS_ASCII = 97;
  const ALPHABET_LENGTH = 26;

  return [...new Array(ID_LENGTH)]
    .map(() => String.fromCharCode(START_LETTERS_ASCII + Math.random() * ALPHABET_LENGTH))
    .join('');
};

const getUserNetworks = async () => {
  const { userNetworks } = await getState();
  return !userNetworks ? {} : userNetworks.reduce((p, n) => ({ ...p, [n.name]: { ...n } }), {});
};

export const getAllNetworks = async () => {
  const userNetworks = await getUserNetworks();
  return { ...userNetworks, ...networks };
};

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

  const { tipContract } = networks[DEFAULT_NETWORK];
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
  const { current } = await getState();
  const networkName = current ? current.network : DEFAULT_NETWORK;
  return {
    network: all[networkName],
    all,
  };
};

export const getTwitterAccountUrl = url => {
  const match = url.match(/https:\/\/twitter.com\/[a-zA-Z0-9_]+/g);
  return match ? match[0] : false;
};
