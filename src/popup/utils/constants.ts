import { SCHEMA } from '@aeternity/aepp-sdk';
import { Encoded } from '@aeternity/aepp-sdk-13';
import BigNumber from 'bignumber.js';
import type {
  TxFunctionRaw,
  ICurrency,
  IDexContracts,
  INetwork,
  INotificationSetting,
  IPermission,
  TxType,
  IToken,
} from '../../types';
import { i18n } from '../../store/plugins/languages';

export const EXTENSION_HEIGHT = 600;
export const MOBILE_WIDTH = 480;

export const LOCAL_STORAGE_PREFIX = 'sh-wallet';

export const SEED_LENGTH = 12;
export const AETERNITY_CONTRACT_ID = 'aeternity';
export const AETERNITY_SYMBOL = 'AE';
export const AETERNITY_COIN_ID = 'aeternity';
export const AETERNITY_COIN_SYMBOL = 'AE Coin';
export const AETERNITY_COIN_NAME = 'Aeternity';
export const AETERNITY_COIN_PRECISION = 18; // Amount of decimals

export const AETERNITY_TOKEN_BASE_DATA: IToken = {
  contractId: AETERNITY_CONTRACT_ID,
  decimals: AETERNITY_COIN_PRECISION,
  name: AETERNITY_COIN_NAME,
  symbol: AETERNITY_COIN_SYMBOL,
  convertedBalance: 0,
};

export const TX_DIRECTION = {
  sent: 'sent',
  received: 'received',
} as const;

export const TX_FUNCTIONS = {
  tip: 'tip',
  retip: 'retip',
  tipToken: 'tip_token',
  retipToken: 'retip_token',
  transfer: 'transfer',
  deposit: 'deposit',
  propose: 'propose', // Multisig
  addLiquidity: 'add_liquidity',
  addLiquidityAe: 'add_liquidity_ae',
  removeLiquidity: 'remove_liquidity',
  removeLiquidityAe: 'remove_liquidity_ae',
  swapExactTokensForTokens: 'swap_exact_tokens_for_tokens',
  swapTokensForExactTokens: 'swap_tokens_for_exact_tokens',
  swapExactAeForTokens: 'swap_exact_ae_for_tokens',
  swapTokensForExactAe: 'swap_tokens_for_exact_ae',
  swapExactTokensForAe: 'swap_exact_tokens_for_ae',
  swapAeForExactTokens: 'swap_ae_for_exact_tokens',
  createAllowance: 'create_allowance',
  changeAllowance: 'change_allowance',
  transferAllowance: 'transfer_allowance',
  transferPayload: 'transfer_payload',
  withdraw: 'withdraw',
  claim: 'claim',
} as const;

export const TX_TYPE_MDW: Partial<Record<TxType, string>> = {
  SpendTx: SCHEMA.TX_TYPE.spend,
  ContractCallTx: SCHEMA.TX_TYPE.contractCall,
  ContractCreateTx: SCHEMA.TX_TYPE.contractCreate,
  NamePreclaimTx: SCHEMA.TX_TYPE.namePreClaim,
  NameClaimTx: SCHEMA.TX_TYPE.nameClaim,
  NameBidTx: SCHEMA.TX_TYPE.nameClaim,
  NameUpdateTx: SCHEMA.TX_TYPE.nameUpdate,
  PayingForTx: 'payingForTx', // TODO: remove after https://github.com/aeternity/aepp-sdk-js/issues/1583 is resolved
  GAMetaTx: 'gaMetaTx',
  GAAttachTx: 'gaAttachTx',
};

export const CONNECTION_TYPES = {
  POPUP: 'POPUP',
  OTHER: 'OTHER',
};

export const HASH_REGEX = /^[1-9A-HJ-NP-Za-km-z]{48,50}$/;

export const HASH_PREFIX_ACCOUNT = 'ak';
export const HASH_PREFIX_CHANNEL = 'ch';
export const HASH_PREFIX_CONTRACT = 'ct';
export const HASH_PREFIX_NAME = 'nm';
export const HASH_PREFIX_ORACLE = 'ok';
export const HASH_PREFIX_TRANSACTION = 'th';

export const HASH_PREFIXES_ALLOWED = [
  HASH_PREFIX_ACCOUNT,
  HASH_PREFIX_CHANNEL,
  HASH_PREFIX_CONTRACT,
  HASH_PREFIX_NAME,
  HASH_PREFIX_ORACLE,
  HASH_PREFIX_TRANSACTION,
] as const;

export const ABORT_TX_TYPE = 'abort';
export const STUB_ADDRESS = 'ak_enAPooFqpTQKkhJmU47J16QZu9HbPQQPwWBVeGnzDbDnv9dxp';
export const STUB_CONTRACT_ADDRESS = 'ct_2rWUGgaVEVytGKuovkeJiUiLvrW63Fx7acvLBb5Ee9ypqoNxL6';
export const STUB_CALLDATA = 'cb_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDJfUrsdAtW6IZtMvhp0+eVDUiQivrquyBwXrl/ujPLcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQQwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUEMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJvjRF';
export const STUB_NONCE = 10000;
export const MAX_UINT256 = new BigNumber(2).exponentiatedBy(256).minus(1);
export const STUB_TOKEN_CONTRACT_ADDRESS = 'ct_T6MWNrowGVC9dyTDksCBrCCSaeK3hzBMMY5hhMKwvwr8wJvM8';

export const ACCOUNT_HD_WALLET = 'hd-wallet';
export const ACCOUNT_LEDGER_WALLET = 'ledger';

/**
 * Default `networkId` values returned by the Node after establishing the connection.
 * Nodes returns different values when connecting to the Hyperchains.
 */
export const NETWORK_ID_MAINNET = 'ae_mainnet';
export const NETWORK_ID_TESTNET = 'ae_uat';

export const NETWORK_MAINNET: INetwork = {
  url: 'https://mainnet.aeternity.io',
  networkId: NETWORK_ID_MAINNET,
  middlewareUrl: 'https://mainnet.aeternity.io/mdw',
  explorerUrl: 'https://aescan.io',
  compilerUrl: 'https://compiler.aepps.com',
  backendUrl: 'https://raendom-backend.z52da5wt.xyz',
  tipContractV1: 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z' as Encoded.ContractAddress,
  multisigBackendUrl: 'https://ga-multisig-backend-mainnet.prd.aepps.com',
  name: 'Mainnet',
};

export const NETWORK_TESTNET: INetwork = {
  url: 'https://testnet.aeternity.io',
  networkId: NETWORK_ID_TESTNET,
  middlewareUrl: 'https://testnet.aeternity.io/mdw',
  explorerUrl: 'https://testnet.aescan.io',
  compilerUrl: 'https://latest.compiler.aepps.com',
  backendUrl: 'https://testnet.superhero.aeternity.art',
  tipContractV1: 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd' as Encoded.ContractAddress,
  tipContractV2: 'ct_2ZEoCKcqXkbz2uahRrsWeaPooZs9SdCv6pmC4kc55rD4MhqYSu' as Encoded.ContractAddress,
  multisigBackendUrl: 'https://ga-multisig-backend-testnet.prd.aepps.com',
  name: 'Testnet',
};

export const NETWORK_DEFAULT = process.env.NETWORK === 'Testnet' ? NETWORK_TESTNET : NETWORK_MAINNET;

export const DEFAULT_WAITING_HEIGHT = 15;

export const NODE_STATUS_CONNECTING = 'connecting';
export const NODE_STATUS_CONNECTED = 'connected';
export const NODE_STATUS_ERROR = 'error';

export const AGGREGATOR_URL = 'https://superhero.com/';
export const CONTACT_EMAIL = 'superherowallet@protonmail.com';

export const TXS_PER_PAGE = 30;
export const AENS_DOMAIN = '.chain';
export const AENS_NAME_MAX_LENGTH = 63 + AENS_DOMAIN.length;
export const AENS_NAME_AUCTION_MAX_LENGTH = 12 + AENS_DOMAIN.length;
export const AENS_BID_MIN_RATIO = 1.05;
export const AUTO_EXTEND_NAME_BLOCKS_INTERVAL = 17000;

export const NOTIFICATION_STATUS_CREATED = 'CREATED';
export const NOTIFICATION_STATUS_READ = 'READ';

export const NOTIFICATION_TYPE_WALLET = 'wallet';
export const NOTIFICATION_TYPE_COMMENT_ON_TIP = 'COMMENT_ON_TIP';
export const NOTIFICATION_TYPE_COMMENT_ON_COMMENT = 'COMMENT_ON_COMMENT';
export const NOTIFICATION_TYPE_TIP_ON_COMMENT = 'TIP_ON_COMMENT';
export const NOTIFICATION_TYPE_CLAIM_OF_TIP = 'CLAIM_OF_TIP';
export const NOTIFICATION_TYPE_CLAIM_OF_RETIP = 'CLAIM_OF_RETIP';
export const NOTIFICATION_TYPE_RETIP_ON_TIP = 'RETIP_ON_TIP';

export const AENS = 'AENS';
export const DEX = 'DEX';

/**
 * Estimated time we need to wait for the middleware to sync it's state
 * with the node. There is a high risk that in some cases this won't be enough
 * so consider using this constant as a workaround.
 */
export const MDW_TO_NODE_APPROX_DELAY_TIME = 5000;

export const DASHBOARD_TRANSACTION_LIMIT = 3;

export const NOTIFICATION_DEFAULT_SETTINGS: INotificationSetting[] = [
  {
    // @ts-ignore - type coming from VueI18n is excessively deep and possibly infinite
    text: i18n.global.t('pages.notification-settings.wallet'),
    checked: true,
    type: NOTIFICATION_TYPE_WALLET,
  },
  {
    text: i18n.global.t('pages.notification-settings.commentOnTip'),
    checked: true,
    type: NOTIFICATION_TYPE_COMMENT_ON_TIP,
  },
  {
    text: i18n.global.t('pages.notification-settings.commentOnComment'),
    checked: false,
    type: NOTIFICATION_TYPE_COMMENT_ON_COMMENT,
  },
  {
    text: i18n.global.t('pages.notification-settings.retipOnTip'),
    checked: true,
    type: NOTIFICATION_TYPE_RETIP_ON_TIP,
  },
  {
    text: i18n.global.t('pages.notification-settings.tipOnComment'),
    checked: true,
    type: NOTIFICATION_TYPE_TIP_ON_COMMENT,
  },
  {
    text: i18n.global.t('pages.notification-settings.claimOfTip'),
    checked: true,
    type: NOTIFICATION_TYPE_CLAIM_OF_TIP,
  },
  {
    text: i18n.global.t('pages.notification-settings.claimOfRetip'),
    checked: true,
    type: NOTIFICATION_TYPE_CLAIM_OF_RETIP,
  },
];

export const CURRENCIES: ICurrency[] = [
  {
    name: 'United States Dollar',
    code: 'usd',
    symbol: '$',
  },
  {
    name: 'Euro',
    code: 'eur',
    symbol: '€',
  },
  {
    name: 'Australia Dollar',
    code: 'aud',
    symbol: 'AU$',
  },
  {
    name: 'Brasil Real',
    code: 'brl',
    symbol: 'R$',
  },
  {
    name: 'Canada Dollar',
    code: 'cad',
    symbol: 'CA$',
  },
  {
    name: 'Swiss Franc',
    code: 'chf',
    symbol: 'CHF',
  },
  {
    name: 'China Yuan Renminbi',
    code: 'cny',
    symbol: '¥',
  },
  {
    name: 'Czech Republic Koruna',
    code: 'czk',
    symbol: 'Kč',
  },
  {
    name: 'Denmark Krone',
    code: 'dkk',
    symbol: 'Kr',
  },
  {
    name: 'United Kingdom Pound',
    code: 'gbp',
    symbol: '£',
  },
  {
    name: 'Hong Kong Dollar',
    code: 'hkd',
    symbol: 'HK$',
  },
  {
    name: 'Hungary Forint',
    code: 'huf',
    symbol: 'Ft',
  },
  {
    name: 'Indonesia Rupiah',
    code: 'idr',
    symbol: 'Rp',
  },
  {
    name: 'Israel Shekel',
    code: 'ils',
    symbol: '₪',
  },
  {
    name: 'India Rupee',
    code: 'inr',
    symbol: '₹',
  },
  {
    name: 'Japan Yen',
    code: 'jpy',
    symbol: '¥',
  },
  {
    name: 'South Korea Won',
    code: 'krw',
    symbol: '₩',
  },
  {
    name: 'Mexico Peso',
    code: 'mxn',
    symbol: 'MX$',
  },
  {
    name: 'Malaysia Ringgit',
    code: 'myr',
    symbol: 'MR',
  },
  {
    name: 'Norway Krone',
    code: 'nok',
    symbol: 'Kr',
  },
  {
    name: 'New Zealand Dollar',
    code: 'nzd',
    symbol: 'NZ$',
  },
  {
    name: 'Philippines Peso',
    code: 'php',
    symbol: '₱',
  },
  {
    name: 'Poland Zloty',
    code: 'pln',
    symbol: 'zł',
  },
  {
    name: 'Russia Ruble',
    code: 'rub',
    symbol: '₽',
  },
  {
    name: 'Sweden Krona',
    code: 'sek',
    symbol: 'Kr',
  },
  {
    name: 'Singapore Dollar',
    code: 'sgd',
    symbol: 'SG$',
  },
  {
    name: 'Thailand Baht',
    code: 'thb',
    symbol: '฿',
  },
  {
    name: 'Turkey Lira',
    code: 'try',
    symbol: '₺',
  },
  {
    name: 'South Africa Rand',
    code: 'zar',
    symbol: 'R',
  },
  {
    name: 'Gold Ounce',
    code: 'xau',
    symbol: 'XAU',
  },
];

export const FUNCTION_TYPE_DEX: Record<'pool' | 'addLiquidity' | 'removeLiquidity' | 'swap' | 'allowance' | 'maxSpent' | 'minReceived', TxFunctionRaw[]> = {
  pool: ['remove_liquidity', 'remove_liquidity_ae', 'add_liquidity', 'add_liquidity_ae'],
  removeLiquidity: ['remove_liquidity', 'remove_liquidity_ae'],
  addLiquidity: ['add_liquidity', 'add_liquidity_ae'],
  swap: [
    'deposit', 'withdraw', 'swap_exact_tokens_for_tokens', 'swap_tokens_for_exact_tokens',
    'swap_exact_ae_for_tokens', 'swap_tokens_for_exact_ae', 'swap_exact_tokens_for_ae',
    'swap_ae_for_exact_tokens',
  ],
  allowance: ['transfer_allowance', 'change_allowance', 'create_allowance'],
  maxSpent: ['swap_tokens_for_exact_tokens', 'swap_tokens_for_exact_ae', 'swap_ae_for_exact_tokens'],
  minReceived: ['swap_exact_tokens_for_tokens', 'swap_exact_ae_for_tokens', 'swap_exact_tokens_for_ae'],
};

export const FUNCTION_TYPE_MULTISIG: Record<string, string> = {
  propose: 'propose',
  confirm: 'confirm',
  refuse: 'refuse',
  revoke: 'revoke',
} as const;

export const APP_LINK_WEB = 'https://wallet.superhero.com';
export const APP_LINK_CHROME = 'https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne';
export const APP_LINK_FIREFOX = 'https://addons.mozilla.org/en-US/firefox/addon/superhero-wallet';
export const APP_LINK_ANDROID = 'https://play.google.com/store/apps/details?id=com.superhero.cordova';
export const APP_LINK_IOS = 'https://apps.apple.com/us/app/superhero-wallet/id1502786641';

export const SIMPLEX_URL = 'https://simplex.superhero.com';
export const FAUCET_URL = 'https://faucet.aepps.com';
export const DEX_URL = 'https://aepp.dex.superhero.com';
export const BUG_REPORT_URL = 'https://spgrrc00ymg.typeform.com/to/Kk3Zyjdr';

export const AVATAR_URL = 'https://avatars.z52da5wt.xyz/';

export const BLOG_CLAIM_TIP_URL = 'https://blog.aeternity.com/superhero-how-to-send-receive-superhero-tips-34971b18c919#024e';

export const COMMIT_URL = 'https://github.com/aeternity/superhero-wallet/commit/';

export const MODAL_DEFAULT = 'default';
export const MODAL_ACCOUNT_CREATE = 'account-create';
export const MODAL_MULTISIG_VAULT_CREATE = 'multisig-vault-create';
export const MODAL_ACCOUNT_IMPORT = 'import-account';
export const MODAL_CLAIM_SUCCESS = 'claim-success';
export const MODAL_CONFIRM = 'confirm';
export const MODAL_CONFIRM_TRANSACTION_SIGN = 'confirm-transaction-sign';
export const MODAL_CONFIRM_RAW_SIGN = 'confirm-raw-sign';
export const MODAL_CONFIRM_CONNECT = 'confirm-connect';
export const MODAL_MESSAGE_SIGN = 'confirm-message-sign';
export const MODAL_ERROR_LOG = 'error-log';
export const MODAL_HELP = 'help';
export const MODAL_READ_QR_CODE = 'read-qr-code';
export const MODAL_TRANSFER_RECEIVE = 'transfer-receive';
export const MODAL_TRANSFER_SEND = 'transfer-send';
export const MODAL_ASSET_SELECTOR = 'asset-selector';
export const MODAL_RESET_WALLET = 'reset-wallet';
export const MODAL_RECIPIENT_HELPER = 'recipient-helper';
export const MODAL_RECIPIENT_INFO = 'recipient-info';
export const MODAL_CONSENSUS_INFO = 'consensus-info';
export const MODAL_PAYLOAD_FORM = 'payload-form';
export const MODAL_FORM_SELECT_OPTIONS = 'form-select-options';
export const MODAL_ACCOUNT_SELECT_OPTIONS = 'account-select-options';
export const MODAL_MULTISIG_PROPOSAL_CONFIRM_ACTION = 'multisig-proposal-confirm-action';

export const DEX_CONTRACTS: Record<string, IDexContracts> = {
  [NETWORK_ID_MAINNET]: {
    router: [
      'ct_azbNZ1XrPjXfqBqbAh1ffLNTQ1sbnuUDFvJrXjYz7JQA1saQ3',
    ],
    wae: [
      'ct_J3zBY8xxjsRr3QojETNw48Eb38fjvEuJKkQ6KzECvubvEcvCa',
    ],
  },
  [NETWORK_ID_TESTNET]: {
    router: [
      STUB_CONTRACT_ADDRESS,
      'ct_6iyAWnbGoEbX6hxWsjKMLSM3Hx542PM9dZeG8mHo1bXzB7DDW',
      'ct_N3fFG5QqyTb2dhqw8YcTQ3gqQjxjCJT9MTvDWfqBes7wEu4r9',
      'ct_2eyXvDw3V3WSbcCpSiWcsCYHShBmEJEkU8PpUg7ymDLfZ4cSy4',
      'ct_2mZo6oniJYbbAuBqJxqydc2ZzUhgrdFbTaR4vq2QxocChGUymJ',
      'ct_MLXQEP12MBn99HL6WDaiTqDbG4bJQ3Q9Bzr57oLfvEkghvpFb',
    ],
    wae: [
      'ct_RzxedNERBDa9Kfx8FENNKQ33TQTt5FzV8i1WppiaTSC4adRXd',
      'ct_y1sufvYLCwbbumgV16p8Bk9f5uHGFiteRDC1x8WNxxyvGJEw2',
      'ct_2kc9naWGGnx4TWGK7UR9gut2cVcDvf7pv8CBYG1a8WML2jzUeb',
      'ct_24gNuddxAbMYtT32sh8Xm1PpB2fZ3HMGtfST5sA3irect3Yu76',
      'ct_2mdY71wG4zAjrdmqDJPXU6h8dYpzNs4mMZ81ujeNnrQPU2jMto',
      'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
    ],
  },
};

export const DEX_PROVIDE_LIQUIDITY = 'provide_liquidity';
export const DEX_REMOVE_LIQUIDITY = 'remove_liquidity';
export const DEX_SWAP = 'swap';
export const DEX_ALLOW_TOKEN = 'allow_token';

export const AEX9_TRANSFER_EVENT = 'Aex9TransferEvent';

export const DEX_TRANSACTION_TAGS: Record<TxFunctionRaw, string> = {
  add_liquidity: DEX_PROVIDE_LIQUIDITY,
  add_liquidity_ae: DEX_PROVIDE_LIQUIDITY,

  remove_liquidity: DEX_REMOVE_LIQUIDITY,
  remove_liquidity_ae: DEX_REMOVE_LIQUIDITY,

  swap_exact_tokens_for_tokens: DEX_SWAP,
  swap_exact_ae_for_tokens: DEX_SWAP,
  swap_tokens_for_exact_tokens: DEX_SWAP,
  swap_tokens_for_exact_ae: DEX_SWAP,
  swap_exact_tokens_for_ae: DEX_SWAP,
  swap_ae_for_exact_tokens: DEX_SWAP,

  create_allowance: DEX_ALLOW_TOKEN,
  change_allowance: DEX_ALLOW_TOKEN,
  transfer_allowance: DEX_ALLOW_TOKEN,

  deposit: DEX_SWAP,
  withdraw: DEX_SWAP,

  // TODO establish transaction tags for the following tx functions:
  tip: '',
  retip: '',
  tip_token: '',
  retip_token: '',
  transfer: '',
  transfer_payload: '',
  claim: '',
  propose: '',
} as const;

export const RETURN_TYPE_OK = 'ok';

export const SUPPORTED_TX_TYPES = [
  SCHEMA.TX_TYPE.spend,
  SCHEMA.TX_TYPE.contractCreate,
  SCHEMA.TX_TYPE.contractCall,
  SCHEMA.TX_TYPE.namePreClaim,
  SCHEMA.TX_TYPE.nameClaim,
  SCHEMA.TX_TYPE.nameUpdate,
  SCHEMA.TX_TYPE.nameTransfer,
];

export const POPUP_TYPE_CONNECT = 'connectConfirm';
export const POPUP_TYPE_SIGN = 'sign';
export const POPUP_TYPE_MESSAGE_SIGN = 'messageSign';
export const POPUP_TYPE_RAW_SIGN = 'rawSign';
export const POPUP_TYPE_TX_SIGN = 'transaction.sign';

export const POPUP_TYPES = [
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_TX_SIGN,
] as const;

export const POPUP_CONNECT_ADDRESS_PERMISSION = 'address';
export const POPUP_CONNECT_TRANSACTIONS_PERMISSION = 'transactions';

export const PERMISSION_DEFAULTS: IPermission = {
  host: '',
  name: '',
  address: false,
  messageSign: false,
  dailySpendLimit: false,
  transactionSignLimit: 0,
  transactionSignLimitLeft: 0,
  transactionSignFirstAskedOn: null,
};

export const NOTIFICATION_ENTITY_TYPE_TIP = 'TIP';

export const INPUT_MESSAGE_STATUSES = {
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const;

export const TRANSACTION_OWNERSHIP_STATUS = {
  other: 0,
  current: 1,
  subAccount: 2,
} as const;

export const MULTISIG_CREATION_PHASES = {
  prepared: 'prepared',
  signed: 'signed',
  deployed: 'deployed',
  created: 'created',
  accessible: 'accessible',
} as const;

export const MULTISIG_VAULT_MIN_NUM_OF_SIGNERS = 2;

export const MULTISIG_PROPOSAL_CONFIRM_ACTIONS = {
  confirm: 'confirm',
  revoke: 'revoke',
  refuse: 'refuse',
} as const;

export const DASHBOARD_CARD_ID = {
  buyAe: 'buyAe',
  claimName: 'claimName',
  faucet: 'faucet',
} as const;

export const SUPPORTED_MULTISIG_CONTRACT_VERSION = '2.0.0';

export const ALLOWED_ICON_STATUSES = [
  'alert',
  'critical',
  'help',
  'info',
  'not-secure',
  'success',
  'warning',
] as const;
