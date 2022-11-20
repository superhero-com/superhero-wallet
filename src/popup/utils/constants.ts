import { SCHEMA } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import type { ICurrency, INetwork, INotificationSetting } from '../../types';
import { i18n } from '../../store/plugins/languages';

export const EXTENSION_HEIGHT = 600;
export const MAGNITUDE = 18;
export const SEED_LENGTH = 12;
export const AETERNITY_CONTRACT_ID = 'aeternity';
export const AETERNITY_SYMBOL = 'AE';

export const TX_TYPE_MDW = {
  SpendTx: SCHEMA.TX_TYPE.spend,
  ContractCallTx: SCHEMA.TX_TYPE.contractCall,
  ContractCreateTx: SCHEMA.TX_TYPE.contractCreate,
  NamePreclaimTx: SCHEMA.TX_TYPE.namePreClaim,
  NameClaimTx: SCHEMA.TX_TYPE.nameClaim,
  NameBidTx: SCHEMA.TX_TYPE.nameClaim,
  NameUpdateTx: SCHEMA.TX_TYPE.nameUpdate,
  PayingForTx: 'payingForTx', // TODO: remove after https://github.com/aeternity/aepp-sdk-js/issues/1583 is resolved
};

export const CONNECTION_TYPES = {
  POPUP: 'POPUP',
  OTHER: 'OTHER',
};

export const HASH_REGEX = /^[1-9A-HJ-NP-Za-km-z]{48,50}$/;

export const STUB_ADDRESS = 'ak_enAPooFqpTQKkhJmU47J16QZu9HbPQQPwWBVeGnzDbDnv9dxp';
export const STUB_CONTRACT_ADDRESS = 'ct_2rWUGgaVEVytGKuovkeJiUiLvrW63Fx7acvLBb5Ee9ypqoNxL6';
export const STUB_CALLDATA = 'cb_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDJfUrsdAtW6IZtMvhp0+eVDUiQivrquyBwXrl/ujPLcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQQwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUEMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJvjRF';
export const STUB_NONCE = 10000;
export const MAX_UINT256 = new BigNumber(2).exponentiatedBy(256).minus(1);

export const DEX_CONTRACTS = {
  ae_uat: {
    router: [
      'ct_2rWUGgaVEVytGKuovkeJiUiLvrW63Fx7acvLBb5Ee9ypqoNxL6',
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
  ae_mainnet: {
    router: ['ct_azbNZ1XrPjXfqBqbAh1ffLNTQ1sbnuUDFvJrXjYz7JQA1saQ3'],
    wae: ['ct_J3zBY8xxjsRr3QojETNw48Eb38fjvEuJKkQ6KzECvubvEcvCa'],
  },
};

export const NETWORK_MAINNET: INetwork = {
  url: 'https://mainnet.aeternity.io',
  networkId: 'ae_mainnet',
  middlewareUrl: 'https://mainnet.aeternity.io/mdw',
  explorerUrl: 'https://explorer.aeternity.io',
  compilerUrl: 'https://compiler.aepps.com',
  backendUrl: 'https://raendom-backend.z52da5wt.xyz',
  tipContractV1: 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z',
  name: 'Mainnet',
};

export const NETWORK_TESTNET: INetwork = {
  url: 'https://testnet.aeternity.io',
  networkId: 'ae_uat',
  middlewareUrl: 'https://testnet.aeternity.io/mdw',
  explorerUrl: 'https://explorer.testnet.aeternity.io',
  compilerUrl: 'https://latest.compiler.aepps.com',
  backendUrl: 'https://testnet.superhero.aeternity.art',
  tipContractV1: 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd',
  tipContractV2: 'ct_2ZEoCKcqXkbz2uahRrsWeaPooZs9SdCv6pmC4kc55rD4MhqYSu',
  name: 'Testnet',
};

export const defaultNetwork = process.env.NETWORK === 'Testnet' ? NETWORK_TESTNET : NETWORK_MAINNET;

export const NODE_STATUS_INIT_SERVICES = 'initServices';
export const NODE_STATUS_CONNECTING = 'connecting';
export const NODE_STATUS_CONNECTION_DONE = 'connectionDone';
export const NODE_STATUS_CONNECTED = 'connected';
export const NODE_STATUS_ERROR = 'error';
export const NODE_STATUS_OFFLINE = 'offline';

export const AGGREGATOR_URL = 'https://superhero.com/';

export const TXS_PER_PAGE = 30;
export const AENS_DOMAIN = '.chain';
export const AENS_NAME_MAX_LENGTH = 63 + AENS_DOMAIN.length;
export const AENS_NAME_AUCTION_MAX_LENGTH = 12 + AENS_DOMAIN.length;
export const AUTO_EXTEND_NAME_BLOCKS_INTERVAL = 17000;

export const BUG_REPORT_URL = 'https://spgrrc00ymg.typeform.com/to/Kk3Zyjdr';

export const NOTIFICATION_STATUS_CREATED = 'CREATED';
export const NOTIFICATION_STATUS_PEEKED = 'PEEKED';
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

export const NOTIFICATION_DEFAULT_SETTINGS: INotificationSetting[] = [
  {
    text: i18n.t('pages.notification-settings.wallet'),
    checked: true,
    type: NOTIFICATION_TYPE_WALLET,
  },
  {
    text: i18n.t('pages.notification-settings.commentOnTip'),
    checked: true,
    type: NOTIFICATION_TYPE_COMMENT_ON_TIP,
  },
  {
    text: i18n.t('pages.notification-settings.commentOnComment'),
    checked: false,
    type: NOTIFICATION_TYPE_COMMENT_ON_COMMENT,
  },
  {
    text: i18n.t('pages.notification-settings.retipOnTip'),
    checked: true,
    type: NOTIFICATION_TYPE_RETIP_ON_TIP,
  },
  {
    text: i18n.t('pages.notification-settings.tipOnComment'),
    checked: true,
    type: NOTIFICATION_TYPE_TIP_ON_COMMENT,
  },
  {
    text: i18n.t('pages.notification-settings.claimOfTip'),
    checked: true,
    type: NOTIFICATION_TYPE_CLAIM_OF_TIP,
  },
  {
    text: i18n.t('pages.notification-settings.claimOfRetip'),
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

export const FUNCTION_TYPE_DEX = {
  pool: ['remove_liquidity', 'remove_liquidity_ae', 'add_liquidity', 'add_liquidity_ae'],
  swap: [
    'deposit', 'withdraw', 'swap_exact_tokens_for_tokens', 'swap_tokens_for_exact_tokens',
    'swap_exact_ae_for_tokens', 'swap_tokens_for_exact_ae', 'swap_exact_tokens_for_ae',
    'swap_ae_for_exact_tokens',
  ],
  allowance: ['transfer_allowance', 'change_allowance', 'create_allowance'],
};

export const ZEIT_TOKEN_INTERFACE = `@compiler >= 6
contract interface PoS =
  stateful entrypoint set_paid : (int, int) => unit
main contract FungibleTokenFull =
  stateful entrypoint burn_trigger_pos : (int, PoS, int) => unit
  entrypoint balance : (address) => option(int)`;

export const APP_LINK_WEB = 'https://wallet.superhero.com';
export const APP_LINK_CHROME = 'https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne';
export const APP_LINK_FIREFOX = 'https://addons.mozilla.org/en-US/firefox/addon/superhero-wallet';
export const APP_LINK_ANDROID = 'https://play.google.com/store/apps/details?id=com.superhero.cordova';
export const APP_LINK_IOS = 'https://apps.apple.com/us/app/superhero-wallet/id1502786641';

export const SIMPLEX_URL = 'https://simplex.superhero.com';

export const CURRENCIES_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=aeternity&vs_currencies=usd,eur,aud,ron,brl,cad,chf,cny,czk,dkk,gbp,hkd,hrk,huf,idr,ils,inr,isk,jpy,krw,mxn,myr,nok,nzd,php,pln,ron,rub,sek,sgd,thb,try,zar,xau';
export const CURRENCY_URL = 'https://api.coingecko.com/api/v3/coins/markets?ids=aeternity&vs_currency=';

export const AVATAR_URL = 'https://avatars.z52da5wt.xyz/';

export const DEX_URL = 'https://aepp.dex.superhero.com';

export const BLOG_CLAIM_TIP_URL = 'https://blog.aeternity.com/superhero-how-to-send-receive-superhero-tips-34971b18c919#024e';

export const COMMIT_URL = 'https://github.com/aeternity/superhero-wallet/commit/';

export const MODAL_DEFAULT = 'default';
export const MODAL_ACCOUNT_CREATE = 'account-create';
export const MODAL_ACCOUNT_IMPORT = 'import-account';
export const MODAL_CLAIM_SUCCESS = 'claim-success';
export const MODAL_SPEND_SUCCESS = 'spend-success';
export const NODAL_CONFIRM = 'confirm';
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

export const DEX_PROVIDE_LIQUIDITY = 'provide_liquidity';
export const DEX_REMOVE_LIQUIDITY = 'remove_liquidity';
export const DEX_SWAP = 'swap';
export const DEX_ALLOW_TOKEN = 'allow_token';

export const DEX_TRANSACTION_TAGS = {
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
};

export const RETURN_TYPE_OK = 'ok';
