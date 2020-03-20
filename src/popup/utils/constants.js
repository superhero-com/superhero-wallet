/* eslint-disable prettier/prettier */
import BigNumber from 'bignumber.js';
import { TxBuilder } from '@aeternity/aepp-sdk/es';
import { TX_TYPE, VM_VERSIONS, ABI_VERSIONS } from '@aeternity/aepp-sdk/es/tx/builder/schema';

export const MAGNITUDE = 18;
export const MAGNITUDE_EXA = 18;
export const MAGNITUDE_GIGA = 9;
export const MAGNITUDE_MICRO = -6;
export const MAGNITUDE_PICO = -12;
export const MINPASSWORDLENGTH = 8;
export const TX_TYPES = {
  txSign: TX_TYPE.spend,
  contractCall: TX_TYPE.contractCall,
  contractCreate: TX_TYPE.contractCreate,
  namePreClaim: TX_TYPE.namePreClaim,
  nameClaim: TX_TYPE.nameClaim,
  nameBid: TX_TYPE.nameClaim,
  nameUpdate: TX_TYPE.nameUpdate,
};

export const HDWALLET_METHODS = ['unlockWallet', 'generateWallet', 'getKeypair', 'getAccount', 'isLoggedIn'];

export const AEX2_METHODS = {
  CHANGE_ACCOUNT: 'CHANGE_ACCOUNT',
  ADD_ACCOUNT: 'ADD_ACCOUNT',
  SWITCH_NETWORK: 'SWITCH_NETWORK',
  LOGOUT: 'LOGOUT',
  INIT_RPC_WALLET: 'INIT_RPC_WALLET',
};

export const NOTIFICATION_METHODS = {
  SWITCH_NETWORK: 'SWITCH_NETWORK',
};

export const CONNECTION_TYPES = {
  EXTENSION: 'EXTENSION',
  POPUP: 'POPUP',
  OTHER: 'OTHER',
};

const STUB_ADDRESS = 'ak_enAPooFqpTQKkhJmU47J16QZu9HbPQQPwWBVeGnzDbDnv9dxp';
const STUB_CALLDATA =
  'cb_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDJfUrsdAtW6IZtMvhp0+eVDUiQivrquyBwXrl/ujPLcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQQwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUEMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJvjRF';
export const MAX_UINT256 = BigNumber(2)
  .exponentiatedBy(256)
  .minus(1);
const MIN_SPEND_TX_FEE_STRING = TxBuilder.calculateMinFee('spendTx', {
  params: {
    senderId: STUB_ADDRESS,
    recipientId: STUB_ADDRESS,
    amount: MAX_UINT256,
    ttl: MAX_UINT256,
    nonce: MAX_UINT256,
  },
});

export const calculateFee = (type, params) => {
  const MIN_FEE = TxBuilder.calculateMinFee(type, {
    params: {
      senderId: STUB_ADDRESS,
      recipientId: STUB_ADDRESS,
      amount: MAX_UINT256,
      ttl: MAX_UINT256,
      nonce: MAX_UINT256,
      ctVersion: { abiVersion: ABI_VERSIONS.SOPHIA, vmVersion: VM_VERSIONS.SOPHIA },
      abiVersion: ABI_VERSIONS.SOPHIA,
      callData: STUB_CALLDATA,
      ...params,
    },
  });
  const min = BigNumber(MIN_FEE).shiftedBy(-MAGNITUDE);
  const max = min.multipliedBy(10);
  return {
    min,
    max,
  };
};

export const MIN_SPEND_TX_FEE = BigNumber(MIN_SPEND_TX_FEE_STRING).shiftedBy(-MAGNITUDE);
export const MAX_REASONABLE_FEE = MIN_SPEND_TX_FEE.multipliedBy(10);

export const toMicro = value => value.shiftedBy(-MAGNITUDE_MICRO).toFixed();

export const MIN_SPEND_TX_FEE_MICRO = toMicro(MIN_SPEND_TX_FEE);
export const MAX_REASONABLE_FEE_MICRO = toMicro(MAX_REASONABLE_FEE);
export const DEFAULT_NETWORK = typeof process.env.NETWORK !== 'undefined' ? process.env.NETWORK.trim() : 'Mainnet';
export const defaultNetworks = {
  Testnet: {
    url: 'https://sdk-testnet.aepps.com/',
    internalUrl: 'https://sdk-testnet.aepps.com/',
    networkId: 'ae_uat',
    middlewareUrl: 'https://testnet.aeternal.io',
    explorerUrl: 'https://testnet.aeternal.io',
    compilerUrl: 'https://latest.compiler.aepps.com',
    tokenRegistry: 'ct_UAzV9RcXEMsFcUCmrPN4iphbZroM7EHk3wvdidDYgZGGBo3hV',
    tokenRegistryLima: 'ct_Dnwribmd21YrxSQnqXCB5vTFPrgYJx2eg2TrbLvbdyEbTMejw',
    tipContract: 'ct_YpQpntd6fi6r3VXnGW7vJiwPYtiKvutUDY35L4PiqkbKEVRqj',
    name: 'Testnet',
  },
  Mainnet: {
    url: 'https://mainnet.aeternity.io',
    internalUrl: 'https://mainnet.aeternity.io',
    networkId: 'ae_mainnet',
    middlewareUrl: 'https://mainnet.aeternal.io',
    explorerUrl: 'https://mainnet.aeternal.io',
    compilerUrl: 'https://compiler.aepps.com',
    tokenRegistry: 'ct_UAzV9RcXEMsFcUCmrPN4iphbZroM7EHk3wvdidDYgZGGBo3hV',
    tokenRegistryLima: 'ct_UAzV9RcXEMsFcUCmrPN4iphbZroM7EHk3wvdidDYgZGGBo3hV',
    tipContract: 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z',
    name: 'Mainnet',
  },
};
export const networks = {
  [DEFAULT_NETWORK]: { ...defaultNetworks[DEFAULT_NETWORK] },
};
export const BACKEND_URL = 'https://raendom-backend.z52da5wt.xyz';
export const TIP_SERVICE = `${BACKEND_URL}/claim/submit`;
export const NO_POPUP_AEPPS = ['youdonotneedacapetobeahero.com', 'superhero.com', 'localhost'];

export const BLACKLIST_AEPPS = ['coronanews.org'];

export const TX_LIMIT_PER_DAY = 2000;
export const MAX_AMOUNT_WITHOUT_CONFIRM = 10;
export const TIPPING_CONTRACT = `@compiler >= 4

include "List.aes"
include "Func.aes"
include "Option.aes"

contract OracleService =
  record success_claim = { success : bool, caller : address, percentage : int }

  stateful entrypoint check_persist_claim : (string, address, bool) => success_claim
  payable stateful entrypoint query_oracle : (string, address) => unit

contract Tipping =
  type tip_id = int
  type url_id = int
  type retip_id = int
  type url = string
  type claim_gen = int

  record tip = { sender : address, title : string, claim_gen : claim_gen, timestamp : int, url_id : url_id, amount : int }
  record retip = { sender : address, amount : int, claim_gen : claim_gen, tip_id : tip_id }
  record state = { urls : map(url, url_id), claims : map(url_id, claim_gen * int), url_index : map(url_id, url), tips : map(tip_id, tip), retips : map(retip_id, retip), owner : address, oracle_service : OracleService }

  payable stateful entrypoint tip : (string, string) => unit
  payable stateful entrypoint retip : (tip_id) => unit
  payable stateful entrypoint pre_claim : (string, address) => unit
  stateful entrypoint claim : (string, address, bool) => unit
  entrypoint get_state : () => state
  entrypoint unclaimed_for_url : (string) => int`;
