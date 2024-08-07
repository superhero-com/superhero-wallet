import type { ICurrency, IPermission } from '@/types';

export const APP_NAME = 'Superhero Wallet';
export const APP_URL = 'wallet.superhero.com';

export const EXTENSION_HEIGHT = 600;
export const MOBILE_WIDTH = 480;
export const MOBILE_SCHEMA = 'superhero://';

export const LOCAL_STORAGE_PREFIX = 'sh-wallet';

export const PROTOCOLS = {
  aeternity: 'aeternity',
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  solana: 'solana',
} as const;

export const PROTOCOL_LIST = Object.values(PROTOCOLS);

export const PROTOCOL_VIEW_ACCOUNT_DETAILS = 'AccountDetails';
export const PROTOCOL_VIEW_ACCOUNT_DETAILS_ASSETS = 'AccountDetailsTokens';
export const PROTOCOL_VIEW_ACCOUNT_DETAILS_NAMES = 'AccountDetailsNames';
export const PROTOCOL_VIEW_TRANSACTION_DETAILS = 'TransactionDetails';
export const PROTOCOL_VIEW_TRANSFER_RECEIVE = 'TransferReceiveModal';
export const PROTOCOL_VIEW_TRANSFER_SEND = 'TransferSendModal';

/**
 * Components (names) required to be present in every protocol.
 */
export const DISTINCT_PROTOCOL_VIEWS = [
  PROTOCOL_VIEW_ACCOUNT_DETAILS,
  PROTOCOL_VIEW_TRANSACTION_DETAILS,
  PROTOCOL_VIEW_ACCOUNT_DETAILS_ASSETS,
  PROTOCOL_VIEW_ACCOUNT_DETAILS_NAMES,
  PROTOCOL_VIEW_TRANSFER_RECEIVE,
  PROTOCOL_VIEW_TRANSFER_SEND,
] as const;

/**
 * Address gap limit is currently set to 5.
 * If the software hits 5 unused addresses in a row,
 * it expects there are no used addresses beyond this point and stops searching the address chain.
*/
export const ADDRESS_GAP_LIMIT = 5;

export const SEED_LENGTH = 12;
export const MAXIMUM_ACCOUNTS_TO_DISCOVER = 5;

export const DECIMAL_PLACES_HIGH_PRECISION = 9;
export const DECIMAL_PLACES_LOW_PRECISION = 2;

export const TX_DIRECTION = {
  sent: 'sent',
  received: 'received',
} as const;

export const CONNECTION_TYPES = {
  POPUP: 'POPUP',
  OTHER: 'OTHER',
};

export const HASH_REGEX = /^[1-9A-HJ-NP-Za-km-z]{48,50}$/;

export const ACCOUNT_TYPES = {
  hdWallet: 'hd-wallet',
  airGap: 'airgap',
} as const;

export const ACCOUNT_TYPES_LIST = Object.values(ACCOUNT_TYPES);

export const NETWORK_TYPE_MAINNET = 'mainnet';
export const NETWORK_TYPE_TESTNET = 'testnet';
export const NETWORK_TYPE_CUSTOM = 'custom';

export const NETWORK_NAME_MAINNET = 'Mainnet';
export const NETWORK_NAME_TESTNET = 'Testnet';

export const NETWORK_NAME_MAX_LENGTH = 15;

export const DEFAULT_WAITING_HEIGHT = 15;
export const FIXED_TABS_SCROLL_HEIGHT = 30;

export const TXS_PER_PAGE = 30;
export const AUTO_EXTEND_NAME_BLOCKS_INTERVAL = 17000;

export const NOTIFICATION_STATUS_CREATED = 'CREATED';
export const NOTIFICATION_STATUS_READ = 'READ';

export const NOTIFICATION_TYPES = {
  wallet: 'wallet',
  commentOnTip: 'COMMENT_ON_TIP',
  commentOnComment: 'COMMENT_ON_COMMENT',
  tipOnComment: 'TIP_ON_COMMENT',
  claimOfTip: 'CLAIM_OF_TIP',
  claimOfRetip: 'CLAIM_OF_RETIP',
  retipOnTip: 'RETIP_ON_TIP',
} as const;

export const AENS = 'AENS';
export const DEX = 'DEX';

/**
 * List of string keys used to save app data in user's device (local/browser storage).
 * Doing any change to the existing values would require creating migration.
 */
export const STORAGE_KEYS = {
  mnemonic: 'mnemonic',
  accountsRaw: 'accounts-raw',
  activeAccountGlobalIdx: 'active-account-global-idx',
  protocolLastActiveAccountIdx: 'protocol-last-active-account-idx',
  balances: 'balances',
  currency: 'currency',
  currencyRates: 'currency-rates',
  customNetworks: 'custom-networks',
  activeNetworkName: 'active-network-name',
  hiddenCards: 'hidden-cards',
  otherSettings: 'other-settings',
  errorLog: 'error-log',
  invites: 'invites',
  multisigAccounts: 'multisig',
  multisigAccountsPending: 'multisig-pending',
  activeMultisigAccount: 'active-multisig-account',
  namesOwned: 'names-owned',
  namesDefault: 'names-default',
  notificationsSettings: 'notifications-settings',
  lastRoute: 'last-route',
  fungibleTokenList: 'fungible-token-list',
  fungibleTokenBalances: 'fungible-token-balances',
  permissions: 'permissions',
  appsBrowserHistory: 'apps-browser-history',
  transactionsLatest: 'transactions-latest',
  transactionsLoaded: 'transactions-loaded',
  transactionsPending: 'transactions-pending',
  transferSendData: 'transfer-send-data',
  secureLogin: 'secure-login',
  walletConnectSession: 'wallet-connect-session',
  addressBook: 'address-book',
} as const;

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

export const APP_LINK_WEB = `https://${APP_URL}`;
export const APP_LINK_CHROME = 'https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne';
export const APP_LINK_FIREFOX = 'https://addons.mozilla.org/en-US/firefox/addon/superhero-wallet';
export const APP_LINK_ANDROID = 'https://play.google.com/store/apps/details?id=com.superhero.cordova';
export const APP_LINK_IOS = 'https://apps.apple.com/us/app/superhero-wallet/id1502786641';

export const BUG_REPORT_URL = 'https://spgrrc00ymg.typeform.com/to/Kk3Zyjdr';
export const AGGREGATOR_URL = 'https://superhero.com/';
export const SUPERHERO_CHAT_URLS = [
  'https://chat.superhero.com',
  'https://chat.superhero.chat',
  'https://matrix.superhero.chat',
];
export const CONTACT_EMAIL = 'superherowallet@protonmail.com';

export const MODAL_ACCOUNT_CREATE = 'account-create';
export const MODAL_AE_ACCOUNT_CREATE = 'account-ae-create';
export const MODAL_ACCOUNT_IMPORT = 'import-account';
export const MODAL_ACCOUNT_SELECT_OPTIONS = 'account-select-options';
export const MODAL_ASSET_SELECTOR = 'asset-selector';
export const MODAL_CLAIM_SUCCESS = 'claim-success';
export const MODAL_CONFIRM = 'confirm';
export const MODAL_CONFIRM_TRANSACTION_SIGN = 'confirm-transaction-sign';
export const MODAL_CONFIRM_RAW_SIGN = 'confirm-raw-sign';
export const MODAL_CONFIRM_UNSAFE_SIGN = 'confirm-unsafe-sign';
export const MODAL_CONFIRM_CONNECT = 'confirm-connect';
export const MODAL_CONFIRM_ACCOUNT_LIST = 'confirm-account-list';
export const MODAL_CONSENSUS_INFO = 'consensus-info';
export const MODAL_DEFAULT = 'default';
export const MODAL_ERROR_LOG = 'error-log';
export const MODAL_FORM_SELECT_OPTIONS = 'form-select-options';
export const MODAL_HELP = 'help';
export const MODAL_MESSAGE_SIGN = 'confirm-message-sign';
export const MODAL_MULTISIG_PROPOSAL_CONFIRM_ACTION = 'multisig-proposal-confirm-action';
export const MODAL_MULTISIG_VAULT_CREATE = 'multisig-vault-create';
export const MODAL_NETWORK_SWITCHER = 'network-switcher';
export const MODAL_PAYLOAD_FORM = 'payload-form';
export const MODAL_SCAN_QR = 'scan-qr';
export const MODAL_RECIPIENT_HELPER = 'recipient-helper';
export const MODAL_RECIPIENT_INFO = 'recipient-info';
export const MODAL_RESET_WALLET = 'reset-wallet';
export const MODAL_TRANSFER_RECEIVE = 'transfer-receive';
export const MODAL_TRANSFER_SEND = 'transfer-send';
export const MODAL_DAPP_BROWSER_ACTIONS = 'browser-actions';
export const MODAL_WARNING_DAPP_BROWSER = 'warning-dapp-browser';
export const MODAL_WALLET_CONNECT = 'wallet-connect';
export const MODAL_CLAIM_GIFT_CARD = 'claim-gift-card';
export const MODAL_SECURE_LOGIN = 'secure-login';
export const MODAL_ENABLE_SECURE_LOGIN = 'enable-secure-login';
export const MODAL_AIR_GAP_IMPORT_ACCOUNTS = 'air-gap-import-accounts';
export const MODAL_SIGN_AIR_GAP_TRANSACTION = 'sign-air-gap-transaction';
export const MODAL_ADDRESS_BOOK_IMPORT = 'address-book-import';
export const MODAL_SHARE_ADDRESS = 'share-address';
export const MODAL_ADDRESS_BOOK_ACCOUNT_SELECTOR = 'address-book-account-selector';

export const POPUP_TYPE_CONNECT = 'connectConfirm';
export const POPUP_TYPE_ACCOUNT_LIST = 'account-list';
export const POPUP_TYPE_SIGN = 'sign';
export const POPUP_TYPE_MESSAGE_SIGN = 'messageSign';
export const POPUP_TYPE_RAW_SIGN = 'rawSign';
export const POPUP_TYPE_UNSAFE_SIGN = 'unsafeSign';

export const POPUP_TYPES = [
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_ACCOUNT_LIST,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_UNSAFE_SIGN,
] as const;

export const POPUP_CONNECT_ADDRESS_PERMISSION = 'address';
export const POPUP_CONNECT_TRANSACTIONS_PERMISSION = 'transactions';

export const POPUP_ACTIONS = {
  getProps: 'getProps',
  resolve: 'resolve',
  reject: 'reject',
} as const;

export const POPUP_METHODS = {
  openPopup: 'openPopup',
  removePopup: 'removePopup',
  getPopup: 'getPopup',
  reload: 'reload',
  paste: 'paste',
  checkHasAccount: 'checkHasAccount', // TODO check if still used
} as const;

export const AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE = 'airgap-signed-transaction';

export const PERMISSION_DEFAULTS: IPermission = {
  host: '',
  name: '',
  address: false,
  addressList: false,
  messageSign: false,
  dailySpendLimit: false,
  transactionSignLimit: 0,
  transactionSignSpent: 0,
  transactionSignFirstAskedOn: null,
};

export const NOTIFICATION_ENTITY_TYPE_TIP = 'TIP';

export const INPUT_MESSAGE_STATUSES = {
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const;

export const DASHBOARD_CARD_ID: Record<string, string | null> = {
  buyAe: 'buyAe',
  claimName: 'claimName',
  faucet: 'faucet',
  daeppBrowser: null, // Closing this card is disabled due to stakeholders decision
} as const;

export const ALLOWED_ICON_STATUSES = [
  'alert',
  'critical',
  'help',
  'info',
  'not-secure',
  'success',
  'warning',
  'qr-scan',
] as const;

/**
 * Pixel size is defined in css variables in global.scss
 */
export const ICON_SIZES = {
  xs: 'xs', // 12px
  sm: 'sm', // 16px
  rg: 'rg', // 18px
  md: 'md', // 20px
  lg: 'lg', // 24px
  xl: 'xl', // 28px
  xxl: 'xxl', // 44px
} as const;

export const TRANSFER_SEND_STEPS = {
  form: 'form',
  review: 'review',
  reviewTip: 'tip',
  airGapSign: 'airGapSign',
} as const;

export const DEFAULT_LOCALE = 'en-US';

/**
 * @description List of all possible actions through the in-app browser.
 */
export const BROWSER_ACTIONS = {
  refresh: 'refresh',
  share: 'share',
  favourite: 'favourite',
} as const;

export const PAGE_TRANSITION_DURATION = 150;

export const MAX_BROWSER_HISTORY_ITEMS = 10;

export const ASSET_TYPES = {
  coin: 'coin',
  token: 'token',
} as const;

/** 10 minutes is the time we are 100% sure the transaction was mined */
export const TRANSACTION_CERTAINLY_MINED_TIME = 600000;

export const POLLING_INTERVAL_TRANSACTIONS = 15000;

// toBase64Url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }))
export const JWT_HEADER = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9';
