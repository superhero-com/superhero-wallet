import { METHODS } from '@aeternity/aepp-sdk';
import type {
  ICurrency,
  INotificationSetting,
  IPermission,
} from '@/types';
import { tg } from '@/store/plugins/languages';

export const EXTENSION_HEIGHT = 600;
export const MOBILE_WIDTH = 480;

export const LOCAL_STORAGE_PREFIX = 'sh-wallet';

export const PROTOCOL_AETERNITY = 'aeternity';
export const PROTOCOL_BITCOIN = 'bitcoin';

export const PROTOCOLS = [
  PROTOCOL_AETERNITY,
  PROTOCOL_BITCOIN,
] as const;

export const PROTOCOL_VIEW_ACCOUNT_DETAILS = 'AccountDetails';
export const PROTOCOL_VIEW_ACCOUNT_DETAILS_TRANSACTIONS = 'AccountDetailsTransactions';
export const PROTOCOL_VIEW_TRANSACTION_DETAILS = 'TransactionDetails';
export const PROTOCOL_VIEW_TRANSFER_RECEIVE = 'TransferReceiveModal';
export const PROTOCOL_VIEW_TRANSFER_SEND = 'TransferSendModal';

/**
 * Components (names) required to be present in every protocol.
 */
export const DISTINCT_PROTOCOL_VIEWS = [
  PROTOCOL_VIEW_ACCOUNT_DETAILS,
  PROTOCOL_VIEW_ACCOUNT_DETAILS_TRANSACTIONS,
  PROTOCOL_VIEW_TRANSACTION_DETAILS,
  PROTOCOL_VIEW_TRANSFER_RECEIVE,
  PROTOCOL_VIEW_TRANSFER_SEND,
] as const;

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

export const ACCOUNT_HD_WALLET = 'hd-wallet';

export const NETWORK_TYPE_MAINNET = 'mainnet';
export const NETWORK_TYPE_TESTNET = 'testnet';
export const NETWORK_TYPE_CUSTOM = 'custom';

export const NETWORK_NAME_MAINNET = 'Mainnet';
export const NETWORK_NAME_TESTNET = 'Testnet';

export const NETWORK_NAME_MAX_LENGTH = 15;

export const DEFAULT_WAITING_HEIGHT = 15;

export const NODE_STATUS_CONNECTING = 'connecting';
export const NODE_STATUS_CONNECTED = 'connected';
export const NODE_STATUS_ERROR = 'error';

export const TXS_PER_PAGE = 30;
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

export const DASHBOARD_TRANSACTION_LIMIT = 3;

export const NOTIFICATION_DEFAULT_SETTINGS: INotificationSetting[] = [
  {
    text: tg('pages.notification-settings.wallet'),
    checked: true,
    type: NOTIFICATION_TYPE_WALLET,
  },
  {
    text: tg('pages.notification-settings.commentOnTip'),
    checked: true,
    type: NOTIFICATION_TYPE_COMMENT_ON_TIP,
  },
  {
    text: tg('pages.notification-settings.commentOnComment'),
    checked: false,
    type: NOTIFICATION_TYPE_COMMENT_ON_COMMENT,
  },
  {
    text: tg('pages.notification-settings.retipOnTip'),
    checked: true,
    type: NOTIFICATION_TYPE_RETIP_ON_TIP,
  },
  {
    text: tg('pages.notification-settings.tipOnComment'),
    checked: true,
    type: NOTIFICATION_TYPE_TIP_ON_COMMENT,
  },
  {
    text: tg('pages.notification-settings.claimOfTip'),
    checked: true,
    type: NOTIFICATION_TYPE_CLAIM_OF_TIP,
  },
  {
    text: tg('pages.notification-settings.claimOfRetip'),
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

export const APP_LINK_WEB = 'https://wallet.superhero.com';
export const APP_LINK_CHROME = 'https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne';
export const APP_LINK_FIREFOX = 'https://addons.mozilla.org/en-US/firefox/addon/superhero-wallet';
export const APP_LINK_ANDROID = 'https://play.google.com/store/apps/details?id=com.superhero.cordova';
export const APP_LINK_IOS = 'https://apps.apple.com/us/app/superhero-wallet/id1502786641';

export const BUG_REPORT_URL = 'https://spgrrc00ymg.typeform.com/to/Kk3Zyjdr';
export const AGGREGATOR_URL = 'https://superhero.com/';
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
export const MODAL_READ_QR_CODE = 'read-qr-code';
export const MODAL_RECIPIENT_HELPER = 'recipient-helper';
export const MODAL_RECIPIENT_INFO = 'recipient-info';
export const MODAL_RESET_WALLET = 'reset-wallet';
export const MODAL_TRANSFER_RECEIVE = 'transfer-receive';
export const MODAL_TRANSFER_SEND = 'transfer-send';

export const POPUP_TYPE_CONNECT = 'connectConfirm';
export const POPUP_TYPE_ACCOUNT_LIST = 'account-list';
export const POPUP_TYPE_SIGN = 'sign';
export const POPUP_TYPE_MESSAGE_SIGN = 'messageSign';
export const POPUP_TYPE_RAW_SIGN = 'rawSign';
export const POPUP_TYPE_TX_SIGN = METHODS.sign;

export const POPUP_TYPES = [
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_ACCOUNT_LIST,
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
  addressList: false,
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

export const DASHBOARD_CARD_ID = {
  buyAe: 'buyAe',
  claimName: 'claimName',
  faucet: 'faucet',
} as const;

export const ALLOWED_ICON_STATUSES = [
  'alert',
  'critical',
  'help',
  'info',
  'not-secure',
  'success',
  'warning',
] as const;

export const TRANSACTIONS_LOCAL_STORAGE_KEY = 'transactions';

export const TRANSFER_SEND_STEPS = {
  form: 'form',
  review: 'review',
  reviewTip: 'tip',
} as const;

export const DEFAULT_LOCALE = 'en-US';
