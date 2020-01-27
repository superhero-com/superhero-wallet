import Universal from '@aeternity/aepp-sdk/es/ae/universal';
import { getHdWalletAccount } from './hdWallet';
import { Crypto } from '@aeternity/aepp-sdk/es';
import { postMesssage } from './connection';
import Swagger from '@aeternity/aepp-sdk/es/utils/swagger'
import axios from 'axios';
import { MAGNITUDE_EXA, MAGNITUDE_GIGA, MAGNITUDE_PICO } from './constants';
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'
import Node from '@aeternity/aepp-sdk/es/node'


const shuffleArray = (array) => {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

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

const convertToAE = (balance) => {
    return +(balance / 10 ** 18).toFixed(7);
};

const extractHostName = (url) => {
    let hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
};

const detectBrowser = () => {
    if((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1 ) {
        return 'Opera'
    }else if(navigator.userAgent.indexOf("Chrome") != -1 ){
        return 'Chrome'
    }else if(navigator.userAgent.indexOf("Safari") != -1){
        return 'Safari'
    }else if(navigator.userAgent.indexOf("Firefox") != -1 ) {
        return 'Firefox'
    }else if((navigator.userAgent.indexOf("MSIE") != -1 ) || (!!document.documentMode == true )){
        return 'IE'
    }else {
       return 'unknown'
    }
}

const fetchData = (url, method, fetchedData) => {
    if (method == 'post') {
        fetch(url, {
            method: method,
            body: fetchedData
        })
        .then(response => response.json())
        .then(json => console.log(json))
    }
    if (method == 'get') {
        return fetch(url)
            .then(response => response.json())
    }
}

const setConnectedAepp = (host, account) => {
    return new Promise((resolve, reject) => {
        browser.storage.local.get('connectedAepps').then((aepps) => {
            
            let list = []
            if(aepps.hasOwnProperty('connectedAepps') && aepps.connectedAepps.hasOwnProperty('list')) {
                list = aepps.connectedAepps.list
            }

            if (list.length && typeof list.find(l => l.host == host) != "undefined") {
                let hst = list.find(h => h.host == host)
                let index = list.findIndex(h => h.host == host)
                if(typeof hst == "undefined") {
                    resolve()
                    return 
                }
                if(hst.accounts.includes(account)) {
                    resolve()
                    return
                }

                list[index].accounts = [...hst.accounts, account]

            } else {
                list.push({ host, accounts: [account] })
            }   

            browser.storage.local.set({connectedAepps: { list }}).then(() => {
                resolve()
            })
        })
    })
}

const checkAeppConnected = (host) => {
    return new Promise((resolve, reject) => {
        browser.storage.local.get('connectedAepps').then((aepps) => {
            browser.storage.local.get('subaccounts').then((subaccounts) => {
                browser.storage.local.get('activeAccount').then((active) => {
                    let activeIdx = 0
                    if(active.hasOwnProperty("activeAccount")) {
                        activeIdx = active.activeAccount
                    }
                    let address = subaccounts.subaccounts[activeIdx].publicKey

                    if(!aepps.hasOwnProperty('connectedAepps')) {
                        return resolve(false)
                    }
                    if(aepps.hasOwnProperty('connectedAepps') && aepps.connectedAepps.hasOwnProperty('list')) {
                        let list = aepps.connectedAepps.list
                        if(list.find(ae => ae.host == host && ae.accounts.includes(address))) {
                            return resolve(true)
                        }
                        return resolve(false)
                    }
            
                    return resolve(false)
                })
            })
            
        })
    })
}


const redirectAfterLogin = (ctx) => {
  browser.storage.local.get('showAeppPopup').then((aepp) => {
    browser.storage.local.get('pendingTransaction').then((pendingTx) => {
        if(aepp.hasOwnProperty('showAeppPopup') && aepp.showAeppPopup.hasOwnProperty('type') && aepp.showAeppPopup.hasOwnProperty('data') && aepp.showAeppPopup.type != "" ) {
            browser.storage.local.remove('showAeppPopup').then(() => {
                ctx.$store.commit('SET_AEPP_POPUP',true)
                if(aepp.showAeppPopup.data.hasOwnProperty("tx") && aepp.showAeppPopup.data.tx.hasOwnProperty("params")) {
                    aepp.showAeppPopup.data.tx.params = parseFromStorage(aepp.showAeppPopup.data.tx.params)
                }
                if(aepp.showAeppPopup.type == 'connectConfirm') {
                    aepp.showAeppPopup.data.popup = true
                    ctx.$router.push({'name':'connect-confirm', params: {
                    data:aepp.showAeppPopup.data
                    }});
                }else if(aepp.showAeppPopup.type == 'txSign') {
                    aepp.showAeppPopup.data.popup = true
                    ctx.$router.push({'name':'sign', params: {
                    data:aepp.showAeppPopup.data
                    }});
                }else if(aepp.showAeppPopup.type == 'contractCall') {
                    aepp.showAeppPopup.data.popup = true
                    ctx.$router.push({'name':'sign', params: {
                        data:aepp.showAeppPopup.data
                    }});
                }else if(aepp.showAeppPopup.type == 'signMessage') {
                    aepp.showAeppPopup.data.popup = true
                    ctx.$router.push({'name':'sign-verify-message', params: {
                        data:aepp.showAeppPopup.data
                    }})
                }
                return;
            });
        }else if(pendingTx.hasOwnProperty('pendingTransaction') && pendingTx.pendingTransaction.hasOwnProperty('list') && Object.keys(pendingTx.pendingTransaction.list).length > 0) {
            ctx.$store.commit('SET_AEPP_POPUP',true)
            let tx = pendingTx.pendingTransaction.list[Object.keys(pendingTx.pendingTransaction.list)[0]];
            tx.popup = false
            tx.countTx =  Object.keys(pendingTx.pendingTransaction.list).length
            ctx.$router.push({'name':'sign', params: {
                data:tx
            }});
        } else if(process.env.RUNNING_IN_POPUP ) {
            ctx.$store.commit('SET_AEPP_POPUP',true)
            if(window.hasOwnProperty("name") && window.name.includes("popup")) {
                if(window.props.type == "connectConfirm") {
                    ctx.$router.push('/connect');
                }else if(window.props.type == "sign") {
                    ctx.$router.push('/popup-sign-tx');
                }
            }
        } else {
            ctx.$router.push('/account');
        }
    })
  })
}

const getAeppAccountPermission = (host, account) => {
    return new Promise((resolve, reject) => {
        browser.storage.sync.get('connectedAepps').then((aepps) => {
            if(!aepps.hasOwnProperty('connectedAepps')) {
                return resolve(false)
            }
            if(aepps.hasOwnProperty('connectedAepps') && aepps.connectedAepps.hasOwnProperty('list')) {
                let list = aepps.connectedAepps.list
                if(list.find(ae => ae.host == host && ae.accounts.includes(account))) {
                    return resolve(true)
                }
                return resolve(false)
            }

            return resolve(false)
        })
    })
}

const setPermissionForAccount = (host, account) => {
    return new Promise((resolve, reject) => {
        browser.storage.sync.get('connectedAepps').then((aepps) => {

            let list = []
            if(aepps.hasOwnProperty('connectedAepps') && aepps.connectedAepps.hasOwnProperty('list')) {
                list = aepps.connectedAepps.list
            }

            if (list.length && typeof list.find(l => l.host == host) != "undefined") {
                let hst = list.find(h => h.host == host)
                let index = list.findIndex(h => h.host == host)
                if(typeof hst == "undefined") {
                    resolve()
                    return 
                }
                if(hst.accounts.includes(account)) {
                    resolve()
                    return
                }

                list[index].accounts = [...hst.accounts, account]

            } else {
                list.push({ host, accounts: [account] })
            }   
            // return;
            browser.storage.sync.set({connectedAepps: { list }}).then(() => {
                resolve()
            })
        })
    })
}

export const fetchJson = async (...args) => {
    const response = await fetch(...args);
    return response.json();
};

const swag = async (network, current) => {
    const swag = await fetchJson(`${network[current.network].middlewareUrl}/middleware/api`);
    swag.paths['/names/auctions/{name}/info'] = {
        get: {
        operationId: 'getAuctionInfoByName',
        parameters: [{
            in: 'path',
            name: 'name',
            required: true,
            type: 'string',
        }],
        },
    };
    return Swagger.compose({
        methods: {
        urlFor: path => network[current.network].middlewareUrl + path,
        axiosError: () => '',
        },
    })({ swag });
}

const initializeSDK = (ctx, { network, current, account, wallet, activeAccount = 0, background },backgr = false) => {
    if(!backgr) {
        ctx.hideConnectError()
    }
    return new Promise (async (resolve,reject) => {
        if(!backgr) {
            postMesssage(background, { type: 'getKeypair' , payload: {  activeAccount, account } } ).then(async ({ res }) => {
                if(typeof res.error != 'undefined') {
                    resolve({error:true})
                } else {
                    res = parseFromStorage(res)
                    let sdk = await createSDKObject(ctx, { network, current, account, wallet, activeAccount, background, res },backgr)
                    sdk.middleware = (await swag(network,current)).api;
                    resolve(sdk)
                }
            })
        }else {
            let sdk = await createSDKObject(ctx, { network, current, account, activeAccount, background, res: account },backgr)
            resolve(sdk)
        }       
    })
}
let countErr = 0;
const createSDKObject = (ctx, { network, current, account, wallet, activeAccount = 0, background, res }, backgr ) => {
    return new Promise(async (resolve, reject) => {
        const account = MemoryAccount({ keypair: { ...res} })
        const node = await Node({ url: network[current.network].internalUrl, internalUrl:  network[current.network].internalUrl })
        Universal({
            nodes: [
                { name: current.network, instance: node },
            ],
            accounts:[account],
            networkId: (typeof network != 'undefined' ? network[current.network].networkId : "ae_uat" ), 
            nativeMode: true,
            compilerUrl: (typeof network != 'undefined' ? network[current.network].compilerUrl : "https://compiler.aepps.com" )
        }).then((sdk) => {
            if(!backgr) {
                ctx.$store.dispatch('initSdk',sdk).then(() => {
                    ctx.hideLoader()
                })
            }
            resolve(sdk)
        })
        .catch(err => {
            if(!backgr) {
                ctx.hideLoader()
                ctx.showConnectError()
            }
            if(countErr < 3) {
                createSDKObject(ctx, { network, current, account, activeAccount, background, res },backgr)
            }else {
                reject({error:true})
            }
            countErr++
        })
    })
}


const  currencyConv = async (ctx) => {
    browser.storage.local.get('convertTimer').then(async result => {
        var time = new Date().getTime();
      if ( !result.hasOwnProperty('convertTimer') || (result.hasOwnProperty('convertTimer') && (result.convertTimer == '' || result.convertTimer == 'undefined' || result.convertTimer <= time)) ) {
        const fetched = await fetchData('https://api.coingecko.com/api/v3/simple/price?ids=aeternity&vs_currencies=usd,eur,aud,ron,brl,cad,chf,cny,czk,dkk,gbp,hkd,hrk,huf,idr,ils,inr,isk,jpy,krw,mxn,myr,nok,nzd,php,pln,ron,rub,sek,sgd,thb,try,zar,xau','get','');
        browser.storage.local.set({ rateUsd : fetched.aeternity.usd}).then(() => { });
        browser.storage.local.set({ rateEur : fetched.aeternity.eur}).then(() => { });
        browser.storage.local.set({ convertTimer : time+3600000}).then(() => { });
        browser.storage.local.set({ allCurrencies : JSON.stringify(fetched.aeternity)}).then(() => { });
      }

      browser.storage.local.get('rateUsd').then(resusd => {
        ctx.usdRate = resusd.rateUsd;
        ctx.toUsd = resusd.rateUsd * ctx.balance;
      });
      browser.storage.local.get('rateEur').then(reseur => {
        ctx.eurRate = reseur.rateEur;
        ctx.toEur = reseur.rateEur * ctx.balance;
      });
      browser.storage.local.get('allCurrencies').then(resall => {
        let ar = JSON.parse(resall.allCurrencies)
        ctx.allCurrencies = ar;
      });

    });
}

const convertAmountToCurrency = (currency, amount) => {
    return currency * amount
}

const contractEncodeCall = async (sdk,source, name, args = []) => {
    return await sdk.contractEncodeCall(source,name,args)
}

const contractDecodeData = async (sdk,source, fn, callValue, callResults, options = {}) => {
    return await sdk.contractDecodeData(source, fn, callValue, callResults, options)
}

const removeTxFromStorage = (id) => {
    return new Promise((resolve,reject) => {
        browser.storage.local.get('pendingTransaction').then((data) => {
            browser.storage.local.remove('showAeppPopup').then(() => {
                let list = {}
                if(data.hasOwnProperty("pendingTransaction") && data.pendingTransaction.hasOwnProperty("list")) {
                    list = data.pendingTransaction.list
                    delete list[id]
                }
                resolve(list)
            }); 
        });
    }) 
}

const checkAddress = (value) => {
    return Crypto.isAddressValid(value, "ak") || Crypto.isAddressValid(value, "ct");
}

const isInt = (n) => {
    return n % 1 === 0;
}

const chekAensName = (value) => {
    return value.endsWith('.test');
}

const stringifyForStorage = state =>  {
    return JSON.stringify(state, (key, value) => {
        
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
    })
}
    
const parseFromStorage = state => {
    return JSON.parse(
        state,
        (key, value) => {
          if (value && value.type === 'ArrayBuffer') {
            return new Uint8Array(value.data).buffer;
          }
          if (value && value.type === 'Uint8Array') {
            return new Uint8Array(value.data);
          }
          if(value && value.type == 'Buffer' ) {
            return new Uint8Array(value.data);
          }
          if(value && value.type == 'Int8Array' ) {
            return new Int8Array(value.data);
          }

          if(value && value.type == 'Int16Array' ) {
            return new Int16Array(value.data);
          }

          if(value && value.type == 'Uint16Array' ) {
            return new Uint16Array(value.data);
          }

          if(value && value.type == 'Int32Array' ) {
            return new Int32Array(value.data);
          }

          if(value && value.type == 'Uint32Array' ) {
            return new Uint32Array(value.data);
          }

          if(value && value.type == 'Float32Array' ) {
            return new Float32Array(value.data);
          }

          if(value && value.type == 'Float64Array' ) {
            return new Float64Array(value.data);
          }

        //   if(value && value.type == 'BigInt64Array' ) {
        //     return new BigInt64Array(value.data);
        //   }

        //   if(value && value.type == 'BigUint64Array' ) {
        //     return new BigUint64Array(value.data);
        //   }
          
          return value;
        },
    );
}

const escapeCallParams = params => {
    return params.map(p => {
        if(typeof p == 'string' && !checkAddress(p)) {
            return `"${p}"`
        }else {
            return p.toString()
        }
    })
}

const addRejectedToken = async (token) => {
    let { rejected_token } = await browser.storage.local.get('rejected_token')
    if (typeof rejected_token == 'undefined') {
        rejected_token = []
    }
    rejected_token.push(token)
    return await browser.storage.local.set({ rejected_token })
}

export const handleUnknownError = error => console.warn('Unknown rejection', error);

export const isAccountNotFoundError = error => isNotFoundError(error)
  && get(error, 'response.data.reason') === 'Account not found';

export const getAddressByNameEntry = nameEntry => ((nameEntry.pointers
&& nameEntry.pointers.find(({ key }) => key === 'account_pubkey')) || {}).id;

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

const getNearestPrefix = exponent => prefixes.reduce((p, n) => (
  Math.abs(n.magnitude - exponent) < Math.abs(p.magnitude - exponent) ? n : p));

const getLowerBoundPrefix = exponent => prefixes
  .find(p => p.magnitude <= exponent) || prefixes[prefixes.length - 1];

export const prefixedAmount = (value) => {
  const { name, magnitude } = (value.e < 0 ? getNearestPrefix : getLowerBoundPrefix)(value.e);
  const v = value
    .shiftedBy(-magnitude)
    .precision(9 + Math.min(value.e - magnitude, 0))
    .toFixed();
  return `${v}${name ? ' ' : ''}${name}`;
};

const contractCall = async ({ instance, method,  params = [], decode = false, async = true }) => {
    let call
    try {
        if(params.length) {
            call = await instance.methods[method](...params)
        } else {
            call = await instance.methods[method]()
        }
    }catch(e) {
        if(e.message.indexOf("wrong_abi_version") > -1) {
            instance.setOptions({ backend: 'aevm'})
            return await contractCall({ instance, method, params, decode, async })
        } else {
            throw e.message
        }
    }

    return async ? (decode ? call.decodedResult : call ) : params.length ? instance.methods[method](...params) :  instance.methods[method]()
}

const checkContractAbiVersion = ({ address, middleware }, test = false) => {
    return new Promise((resolve, reject) => {
        axios.get(`${middleware}/middleware/contracts/transactions/address/${address}`)
        .then(res => {
            if(!res.data.transactions.length) {
                return resolve(3)
            }
            let { tx: { abi_version } } = res.data.transactions.find(({ tx: { type } }) => type == 'ContractCreateTx')
            return resolve(abi_version)
        })
        .catch(err => {
            console.log(err)
            resolve(0)
        })
    })
}

const setContractInstance = async (tx, sdk, contractAddress = null) => {
    let contractInstance = false;
    try {
        let backend = "fate";
        if(typeof tx.abi_version != "undefined" && tx._abi_version != 3) {
            backend = "aevm";
        }
        try {
            contractInstance = await sdk.getContractInstance(tx.source, { contractAddress, forceCodeCheck: true });
            contractInstance.setOptions({ backend })
        }catch(e) {
            console.log(e)
        }
        return Promise.resolve(contractInstance)
    } catch(e) {
        console.log(e)
    }
    return Promise.resolve(contractInstance)
}

const getContractInstance = async (source, options = {}) => {
    try {
        let store = await import('../../store');
        store = store.default
        return await store.state.sdk.getContractInstance(source, { ...options, forceCodeCheck: true });
    } catch(e) {
        return { }
    }
}

export { 
    shuffleArray, 
    convertToAE, 
    extractHostName, 
    fetchData, 
    detectBrowser, 
    setConnectedAepp, 
    checkAeppConnected, 
    redirectAfterLogin, 
    initializeSDK, 
    currencyConv, 
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
    setPermissionForAccount
}


