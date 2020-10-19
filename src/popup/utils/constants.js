import { TxBuilder } from '@aeternity/aepp-sdk/es';
import { ABI_VERSIONS, TX_TYPE, VM_VERSIONS } from '@aeternity/aepp-sdk/es/tx/builder/schema';
import BigNumber from 'bignumber.js';
import { i18n } from './i18nHelper';

export const MAGNITUDE = 18;
export const TX_TYPES = {
  txSign: TX_TYPE.spend,
  contractCall: TX_TYPE.contractCall,
  contractCreate: TX_TYPE.contractCreate,
  namePreClaim: TX_TYPE.namePreClaim,
  nameClaim: TX_TYPE.nameClaim,
  nameBid: TX_TYPE.nameClaim,
  nameUpdate: TX_TYPE.nameUpdate,
};

export const HDWALLET_METHODS = [
  'unlockWallet',
  'generateWallet',
  'getKeypair',
  'getAccount',
  'isLoggedIn',
];

export const AEX2_METHODS = {
  CHANGE_ACCOUNT: 'CHANGE_ACCOUNT',
  ADD_ACCOUNT: 'ADD_ACCOUNT',
  SWITCH_NETWORK: 'SWITCH_NETWORK',
  LOGOUT: 'LOGOUT',
  INIT_RPC_WALLET: 'INIT_RPC_WALLET',
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

export const defaultNetworks = [
  {
    url: 'https://testnet.aeternity.io',
    internalUrl: 'https://testnet.aeternity.io',
    networkId: 'ae_uat',
    middlewareUrl: 'https://testnet.aeternity.io',
    explorerUrl: 'https://testnet.aeternal.io',
    compilerUrl: 'https://latest.compiler.aepps.com',
    backendUrl: 'https://test-tipping.aeternity.art',
    tokenRegistry: 'ct_UAzV9RcXEMsFcUCmrPN4iphbZroM7EHk3wvdidDYgZGGBo3hV',
    tokenRegistryLima: 'ct_Dnwribmd21YrxSQnqXCB5vTFPrgYJx2eg2TrbLvbdyEbTMejw',
    tipContract: 'ct_YpQpntd6fi6r3VXnGW7vJiwPYtiKvutUDY35L4PiqkbKEVRqj',
    name: 'Testnet',
  },
  {
    url: 'https://mainnet.aeternity.io',
    internalUrl: 'https://mainnet.aeternity.io',
    networkId: 'ae_mainnet',
    middlewareUrl: 'https://mainnet.aeternity.io',
    explorerUrl: 'https://mainnet.aeternal.io',
    compilerUrl: 'https://compiler.aepps.com',
    backendUrl: 'https://raendom-backend.z52da5wt.xyz',
    tokenRegistry: 'ct_UAzV9RcXEMsFcUCmrPN4iphbZroM7EHk3wvdidDYgZGGBo3hV',
    tokenRegistryLima: 'ct_UAzV9RcXEMsFcUCmrPN4iphbZroM7EHk3wvdidDYgZGGBo3hV',
    tipContract: 'superhero.chain',
    name: 'Mainnet',
  },
];

export const defaultNetwork =
  process.env.NETWORK === 'Testnet' ? defaultNetworks[0] : defaultNetworks[1];

export const AGGREGATOR_URL = 'https://superhero.com/';
export const NO_POPUP_AEPPS = [
  'youdonotneedacapetobeahero.com',
  'superhero.com',
  'alpha.superhero.com',
  'beta.superhero.com',
  ...(process.env.NODE_ENV === 'development' ? ['localhost'] : []),
];

export const TXS_PER_PAGE = 30;
export const MAX_AMOUNT_WITHOUT_CONFIRM = 10;
export const AENS_DOMAIN = '.chain';
export const MAX_AUCTION_NAME_LENGTH = 12 + AENS_DOMAIN.length;
export const MIN_NAME_LENGTH = 14;
export const AUTO_EXTEND_NAME_BLOCKS_INTERVAL = 100;
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

export const BUG_REPORT_URL = 'https://thesuperherowallet.typeform.com/to/vh8Ffu';

export const CHANGE_CRYPTO_AE_URL = 'https://app.jelly.market';

export const NOTIFICATION_SETTINGS = [
  {
    text: i18n.t('pages.notification-settings.commentOnTip'),
    checked: true,
    type: 'COMMENT_ON_TIP',
  },
  {
    text: i18n.t('pages.notification-settings.commentOnComment'),
    checked: false,
    type: 'COMMENT_ON_COMMENT',
  },
  {
    text: i18n.t('pages.notification-settings.retipOnTip'),
    checked: true,
    type: 'RETIP_ON_TIP',
  },
  {
    text: i18n.t('pages.notification-settings.wallet'),
    checked: true,
    type: 'wallet',
  },
  {
    text: i18n.t('pages.notification-settings.tipOnComment'),
    checked: true,
    type: 'TIP_ON_COMMENT',
  },
  {
    text: i18n.t('pages.notification-settings.claimOfTip'),
    checked: true,
    type: 'CLAIM_OF_TIP',
  },
  {
    text: i18n.t('pages.notification-settings.claimOfRetip'),
    checked: true,
    type: 'CLAIM_OF_RETIP',
  },
];
