import Universal from '@aeternity/aepp-sdk/es/ae/universal';
import { Crypto } from '@aeternity/aepp-sdk/es';
import Swagger from '@aeternity/aepp-sdk/es/utils/swagger';
import axios from 'axios';
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory';
import Node from '@aeternity/aepp-sdk/es/node';
import { MAGNITUDE_EXA, MAGNITUDE_GIGA, MAGNITUDE_PICO, CONNECTION_TYPES } from './constants';

const shuffleArray = array => {
  let currentIndex = array.length;
  let temporaryValue;
  let randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

const convertToAE = balance => +(balance / 10 ** 18).toFixed(7);

const extractHostName = url => {
  let hostname;
  // find & remove protocol (http, ftp, etc.) and get hostname

  if (url.indexOf('//') > -1) {
    hostname = url.split('/')[2];
  } else {
    hostname = url.split('/')[0];
  }

  // find & remove port number
  hostname = hostname.split(':')[0];
  // find & remove "?"
  hostname = hostname.split('?')[0];

  return hostname;
};

const detectBrowser = () => {
  if ((navigator.userAgent.indexOf('Opera') || navigator.userAgent.indexOf('OPR')) != -1) {
    return 'Opera';
  }
  if (navigator.userAgent.indexOf('Chrome') != -1) {
    return 'Chrome';
  }
  if (navigator.userAgent.indexOf('Safari') != -1) {
    return 'Safari';
  }
  if (navigator.userAgent.indexOf('Firefox') != -1) {
    return 'Firefox';
  }
  if (navigator.userAgent.indexOf('MSIE') != -1 || !!document.documentMode == true) {
    return 'IE';
  }
  return 'unknown';
};

const getExtensionProtocol = () => {
  let extensionUrl = 'chrome-extension';
  if (detectBrowser() == 'Firefox') {
    extensionUrl = 'moz-extension';
  }
  return extensionUrl;
};

const detectConnectionType = port => {
  const extensionProtocol = getExtensionProtocol();
  const senderUrl = port.sender.url.split('?');
  let type = CONNECTION_TYPES.OTHER;
  if (port.name == CONNECTION_TYPES.EXTENSION && (senderUrl[0] == `${extensionProtocol}://${browser.runtime.id}/popup/popup.html` || detectBrowser() == 'Firefox')) {
    type = CONNECTION_TYPES.EXTENSION;
  } else if (port.name == CONNECTION_TYPES.POPUP && (senderUrl[0] == `${extensionProtocol}://${browser.runtime.id}/popup/popup.html` || detectBrowser() == 'Firefox')) {
    type = CONNECTION_TYPES.POPUP;
  } else {
    type = CONNECTION_TYPES.OTHER;
  }
  return type;
};

const fetchData = (url, method, fetchedData) => {
  if (method == 'post') {
    fetch(url, {
      method,
      body: fetchedData,
    })
      .then(response => response.json())
      .then(json => console.log(json));
  }
  if (method == 'get') {
    return fetch(url).then(response => response.json());
  }
};

const setConnectedAepp = (host, account) =>
  new Promise((resolve, reject) => {
    browser.storage.local.get('connectedAepps').then(aepps => {
      let list = [];
      if (aepps.hasOwnProperty('connectedAepps') && aepps.connectedAepps.hasOwnProperty('list')) {
        list = aepps.connectedAepps.list;
      }

      if (list.length && typeof list.find(l => l.host == host) !== 'undefined') {
        const hst = list.find(h => h.host == host);
        const index = list.findIndex(h => h.host == host);
        if (typeof hst === 'undefined') {
          resolve();
          return;
        }
        if (hst.accounts.includes(account)) {
          resolve();
          return;
        }

        list[index].accounts = [...hst.accounts, account];
      } else {
        list.push({ host, accounts: [account] });
      }

      browser.storage.local.set({ connectedAepps: { list } }).then(() => {
        resolve();
      });
    });
  });

const checkAeppConnected = host =>
  new Promise((resolve, reject) => {
    browser.storage.local.get('connectedAepps').then(aepps => {
      browser.storage.local.get('subaccounts').then(subaccounts => {
        browser.storage.local.get('activeAccount').then(active => {
          let activeIdx = 0;
          if (active.hasOwnProperty('activeAccount')) {
            activeIdx = active.activeAccount;
          }
          const address = subaccounts.subaccounts[activeIdx].publicKey;

          if (!aepps.hasOwnProperty('connectedAepps')) {
            return resolve(false);
          }
          if (aepps.hasOwnProperty('connectedAepps') && aepps.connectedAepps.hasOwnProperty('list')) {
            const { list } = aepps.connectedAepps;
            if (list.find(ae => ae.host == host && ae.accounts.includes(address))) {
              return resolve(true);
            }
            return resolve(false);
          }

          return resolve(false);
        });
      });
    });
  });

const redirectAfterLogin = ctx => {};

const getAeppAccountPermission = (host, account) =>
  new Promise((resolve, reject) => {
    browser.storage.local.get('connectedAepps').then(aepps => {
      if (!aepps.hasOwnProperty('connectedAepps')) {
        return resolve(false);
      }
      if (aepps.hasOwnProperty('connectedAepps') && aepps.connectedAepps.hasOwnProperty('list')) {
        const { list } = aepps.connectedAepps;
        if (list.find(ae => ae.host == host && ae.accounts.includes(account))) {
          return resolve(true);
        }
        return resolve(false);
      }

      return resolve(false);
    });
  });

const setPermissionForAccount = (host, account) =>
  new Promise((resolve, reject) => {
    browser.storage.local.get('connectedAepps').then(aepps => {
      let list = [];
      if (aepps.hasOwnProperty('connectedAepps') && aepps.connectedAepps.hasOwnProperty('list')) {
        list = aepps.connectedAepps.list;
      }

      if (list.length && typeof list.find(l => l.host == host) !== 'undefined') {
        const hst = list.find(h => h.host == host);
        const index = list.findIndex(h => h.host == host);
        if (typeof hst === 'undefined') {
          resolve();
          return;
        }
        if (hst.accounts.includes(account)) {
          resolve();
          return;
        }

        list[index].accounts = [...hst.accounts, account];
      } else {
        list.push({ host, accounts: [account] });
      }
      // return;
      browser.storage.local.set({ connectedAepps: { list } }).then(() => {
        resolve();
      });
    });
  });

export const fetchJson = async (...args) => {
  const response = await fetch(...args);
  return response.json();
};

const swag = async (network, current) => {
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

let countErr = 0;
const createSDKObject = (ctx, { network, current, account, wallet, activeAccount = 0, background, res }, backgr) =>
  new Promise(async (resolve, reject) => {
    const account = MemoryAccount({ keypair: { ...res } });
    const node = await Node({ url: network[current.network].internalUrl, internalUrl: network[current.network].internalUrl });
    Universal({
      nodes: [{ name: current.network, instance: node }],
      accounts: [account],
      networkId: typeof network !== 'undefined' ? network[current.network].networkId : 'ae_uat',
      nativeMode: true,
      compilerUrl: typeof network !== 'undefined' ? network[current.network].compilerUrl : 'https://compiler.aepps.com',
    })
      .then(sdk => {
        if (!backgr) {
          ctx.$store.dispatch('initSdk', sdk).then(() => {
            ctx.hideLoader();
          });
        }
        resolve(sdk);
      })
      .catch(err => {
        if (!backgr) {
          ctx.hideLoader();
          ctx.showConnectError();
        }
        if (countErr < 3) {
          createSDKObject(ctx, { network, current, account, activeAccount, background, res }, backgr);
        } else {
          reject({ error: true });
        }
        countErr++;
      });
  });

const getCurrencies = async () => {
  const result = await browser.storage.local.get('convertTimer');
  const time = new Date().getTime();
  if (
    !result.hasOwnProperty('convertTimer') ||
    (result.hasOwnProperty('convertTimer') && (result.convertTimer == '' || result.convertTimer == 'undefined' || result.convertTimer <= time))
  ) {
    const fetched = await fetchData(
      'https://api.coingecko.com/api/v3/simple/price?ids=aeternity&vs_currencies=usd,eur,aud,ron,brl,cad,chf,cny,czk,dkk,gbp,hkd,hrk,huf,idr,ils,inr,isk,jpy,krw,mxn,myr,nok,nzd,php,pln,ron,rub,sek,sgd,thb,try,zar,xau',
      'get',
      ''
    );
    await browser.storage.local.set({ convertTimer: time + 3600000 });
    await browser.storage.local.set({ allCurrencies: JSON.stringify(fetched.aeternity) });

    return fetched.aeternity;
  }

  const { allCurrencies } = await browser.storage.local.get('allCurrencies');
  return JSON.parse(allCurrencies);
};

const convertAmountToCurrency = (currency, amount) => currency * amount;

const contractEncodeCall = async (sdk, source, name, args = []) => await sdk.contractEncodeCall(source, name, args);

const contractDecodeData = async (sdk, source, fn, callValue, callResults, options = {}) => await sdk.contractDecodeData(source, fn, callValue, callResults, options);

const removeTxFromStorage = id =>
  new Promise((resolve, reject) => {
    browser.storage.local.get('pendingTransaction').then(data => {
      browser.storage.local.remove('showAeppPopup').then(() => {
        let list = {};
        if (data.hasOwnProperty('pendingTransaction') && data.pendingTransaction.hasOwnProperty('list')) {
          list = data.pendingTransaction.list;
          delete list[id];
        }
        resolve(list);
      });
    });
  });

const checkAddress = value => Crypto.isAddressValid(value, 'ak') || Crypto.isAddressValid(value, 'ct');

const isInt = n => n % 1 === 0;

const chekAensName = value => value.endsWith('.test') || value.endsWith('.chain');

const stringifyForStorage = state =>
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

    // if (value instanceof BigInt64Array) {
    //     return { type: 'BigInt64Array', data: Array.from(value) };
    // }

    // if (value instanceof BigUint64Array) {
    //     return { type: 'BigUint64Array', data: Array.from(value) };
    // }

    return value;
  });

const parseFromStorage = state =>
  JSON.parse(state, (key, value) => {
    if (value && value.type === 'ArrayBuffer') {
      return new Uint8Array(value.data).buffer;
    }
    if (value && value.type === 'Uint8Array') {
      return new Uint8Array(value.data);
    }
    if (value && value.type == 'Buffer') {
      return new Uint8Array(value.data);
    }
    if (value && value.type == 'Int8Array') {
      return new Int8Array(value.data);
    }

    if (value && value.type == 'Int16Array') {
      return new Int16Array(value.data);
    }

    if (value && value.type == 'Uint16Array') {
      return new Uint16Array(value.data);
    }

    if (value && value.type == 'Int32Array') {
      return new Int32Array(value.data);
    }

    if (value && value.type == 'Uint32Array') {
      return new Uint32Array(value.data);
    }

    if (value && value.type == 'Float32Array') {
      return new Float32Array(value.data);
    }

    if (value && value.type == 'Float64Array') {
      return new Float64Array(value.data);
    }

    //   if(value && value.type == 'BigInt64Array' ) {
    //     return new BigInt64Array(value.data);
    //   }

    //   if(value && value.type == 'BigUint64Array' ) {
    //     return new BigUint64Array(value.data);
    //   }

    return value;
  });

const escapeCallParams = params =>
  params.map(p => {
    if (typeof p === 'string' && !checkAddress(p)) {
      return `"${p}"`;
    }
    return p.toString();
  });

const addRejectedToken = async token => {
  let { rejected_token } = await browser.storage.local.get('rejected_token');
  if (typeof rejected_token === 'undefined') {
    rejected_token = [];
  }
  rejected_token.push(token);
  return await browser.storage.local.set({ rejected_token });
};

export const handleUnknownError = error => console.warn('Unknown rejection', error);

export const isAccountNotFoundError = error => isNotFoundError(error) && get(error, 'response.data.reason') === 'Account not found';

export const getAddressByNameEntry = nameEntry => ((nameEntry.pointers && nameEntry.pointers.find(({ key }) => key === 'account_pubkey')) || {}).id;

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

const getNearestPrefix = exponent => prefixes.reduce((p, n) => (Math.abs(n.magnitude - exponent) < Math.abs(p.magnitude - exponent) ? n : p));

const getLowerBoundPrefix = exponent => prefixes.find(p => p.magnitude <= exponent) || prefixes[prefixes.length - 1];

export const prefixedAmount = value => {
  const { name, magnitude } = (value.e < 0 ? getNearestPrefix : getLowerBoundPrefix)(value.e);
  const v = value
    .shiftedBy(-magnitude)
    .precision(9 + Math.min(value.e - magnitude, 0))
    .toFixed();
  return `${v}${name ? ' ' : ''}${name}`;
};

const contractCall = async ({ instance, method, params = [], decode = false, async = true }) => {
  let call;
  try {
    if (params.length) {
      call = await instance.methods[method](...params);
    } else {
      call = await instance.methods[method]();
    }
  } catch (e) {
    if (e.message.indexOf('wrong_abi_version') > -1) {
      instance.setOptions({ backend: 'aevm' });
      return await contractCall({ instance, method, params, decode, async });
    }
    throw e.message;
  }

  return async ? (decode ? call.decodedResult : call) : params.length ? instance.methods[method](...params) : instance.methods[method]();
};

const checkContractAbiVersion = ({ address, middleware }, test = false) =>
  new Promise((resolve, reject) => {
    axios
      .get(`${middleware}/middleware/contracts/transactions/address/${address}`)
      .then(res => {
        if (!res.data.transactions.length) {
          return resolve(3);
        }
        const {
          tx: { abi_version },
        } = res.data.transactions.find(({ tx: { type } }) => type == 'ContractCreateTx');
        return resolve(abi_version);
      })
      .catch(err => {
        console.log(err);
        resolve(0);
      });
  });

const setContractInstance = async (tx, sdk, contractAddress = null) => {
  let contractInstance = false;
  try {
    let backend = 'fate';
    if (typeof tx.abi_version !== 'undefined' && tx._abi_version != 3) {
      backend = 'aevm';
    }
    try {
      contractInstance = await sdk.getContractInstance(tx.source, { contractAddress, forceCodeCheck: true });
      contractInstance.setOptions({ backend });
    } catch (e) {
      console.log(e);
    }
    return Promise.resolve(contractInstance);
  } catch (e) {
    console.log(e);
  }
  return Promise.resolve(contractInstance);
};

const getContractInstance = async (source, options = {}) => {
  try {
    let store = await import('../../store');
    store = store.default;
    return await store.state.sdk.getContractInstance(source, { ...options, forceCodeCheck: true });
  } catch (e) {
    return {};
  }
};

const getUniqueId = (length = 6) => {
  const ID_LENGTH = length;
  const START_LETTERS_ASCII = 97;
  const ALPHABET_LENGTH = 26;

  return [...new Array(ID_LENGTH)].map(() => String.fromCharCode(START_LETTERS_ASCII + Math.random() * ALPHABET_LENGTH)).join('');
};

const getUserNetworks = async () => {
  const { userNetworks } = await browser.storage.local.get('userNetworks');
  const networks = {};
  if (userNetworks) {
    userNetworks.forEach(net => (networks[net.name] = net));
  }
  return new Promise((resolve, reject) => {
    resolve(networks);
  });
};
const setTxInQueue = async tx => {
  const { processingTx } = await browser.storage.local.get('processingTx');
  let list = [];
  if (typeof processingTx !== 'undefined' && processingTx.length) {
    list = [...list, ...processingTx];
  }
  list.push(tx);
  await browser.storage.local.set({ processingTx: list });
};

const setPendingTx = async tx => {
  const { pendingTxs } = await browser.storage.local.get('pendingTxs');
  let list = [];
  if (pendingTxs && pendingTxs.length) {
    list = [...list, ...pendingTxs];
  }
  list.push(tx);
  await setTxInQueue(tx.hash);
  return await browser.storage.local.set({ pendingTxs: list });
};

const escapeSpecialChars = str => str.replace(/(\r\n|\n|\r|\n\r)/gm, ' ').replace(/[\""]/g, '');

const formatTime = time => new Date(parseInt(time)).toLocaleTimeString(navigator.language, { timeStyle: 'short', hourCycle: 'h24', hour: '2-digit', minute: '2-digit' });

const formatDate = time =>
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

export {
  shuffleArray,
  convertToAE,
  extractHostName,
  fetchData,
  detectBrowser,
  setConnectedAepp,
  checkAeppConnected,
  redirectAfterLogin,
  swag,
  getCurrencies,
  convertAmountToCurrency,
  contractEncodeCall,
  contractDecodeData,
  removeTxFromStorage,
  checkAddress,
  chekAensName,
  isInt,
  stringifyForStorage,
  parseFromStorage,
  escapeCallParams,
  addRejectedToken,
  contractCall,
  checkContractAbiVersion,
  setContractInstance,
  getContractInstance,
  getAeppAccountPermission,
  setPermissionForAccount,
  getUniqueId,
  getUserNetworks,
  setTxInQueue,
  getExtensionProtocol,
  detectConnectionType,
  setPendingTx,
  escapeSpecialChars,
  formatTime,
  formatDate,
};
