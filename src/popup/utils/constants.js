import {
  TxBuilder, Crypto, SCHEMA, TxBuilderHelper,
} from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import { i18n } from '../../store/plugins/languages';

export const MAGNITUDE = 18;

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

const STUB_ADDRESS = 'ak_enAPooFqpTQKkhJmU47J16QZu9HbPQQPwWBVeGnzDbDnv9dxp';
const STUB_CALLDATA = 'cb_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDJfUrsdAtW6IZtMvhp0+eVDUiQivrquyBwXrl/ujPLcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQQwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUEMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJvjRF';
const STUB_NONCE = 10000;
export const MAX_UINT256 = BigNumber(2).exponentiatedBy(256).minus(1);

export const calculateFee = (type, params) => {
  const MIN_FEE = TxBuilder.calculateMinFee(type, {
    params: {
      senderId: STUB_ADDRESS,
      recipientId: STUB_ADDRESS,
      amount: MAX_UINT256,
      ttl: MAX_UINT256,
      nonce: MAX_UINT256,
      ctVersion: { abiVersion: SCHEMA.ABI_VERSIONS.SOPHIA, vmVersion: SCHEMA.VM_VERSIONS.SOPHIA },
      abiVersion: SCHEMA.ABI_VERSIONS.SOPHIA,
      callData: STUB_CALLDATA,
      gas: 0,
      ...params,
    },
    ...type === 'nameClaimTx' ? { vsn: SCHEMA.VSN_2 } : {},
  });
  return BigNumber(MIN_FEE).shiftedBy(-MAGNITUDE);
};

export const calculateNameClaimFee = (name) => calculateFee(SCHEMA.TX_TYPE.nameClaim, {
  accountId: STUB_ADDRESS,
  name,
  nameSalt: Crypto.salt(),
  nameFee: TxBuilderHelper.getMinimumNameFee(name),
  nonce: STUB_NONCE,
  ttl: SCHEMA.NAME_TTL,
});

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

export const defaultNetworks = [
  {
    url: 'https://testnet.aeternity.io',
    networkId: 'ae_uat',
    middlewareUrl: 'https://testnet.aeternity.io/mdw',
    explorerUrl: 'https://explorer.testnet.aeternity.io',
    compilerUrl: 'https://latest.compiler.aepps.com',
    backendUrl: 'https://testnet.superhero.aeternity.art',
    tipContractV1: 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd',
    tipContractV2: 'ct_2ZEoCKcqXkbz2uahRrsWeaPooZs9SdCv6pmC4kc55rD4MhqYSu',
    name: 'Testnet',
  },
  {
    url: 'https://mainnet.aeternity.io',
    networkId: 'ae_mainnet',
    middlewareUrl: 'https://mainnet.aeternity.io/mdw',
    explorerUrl: 'https://explorer.aeternity.io',
    compilerUrl: 'https://compiler.aepps.com',
    backendUrl: 'https://raendom-backend.z52da5wt.xyz',
    tipContractV1: 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z',
    name: 'Mainnet',
  },
];

export const defaultNetwork = process.env.NETWORK === 'Testnet' ? defaultNetworks[0] : defaultNetworks[1];

export const AGGREGATOR_URL = 'https://superhero.com/';

export const TXS_PER_PAGE = 30;
export const AENS_DOMAIN = '.chain';
export const MAX_AUCTION_NAME_LENGTH = 12 + AENS_DOMAIN.length;
export const AUTO_EXTEND_NAME_BLOCKS_INTERVAL = 17000;

export const BUG_REPORT_URL = 'https://thesuperherowallet.typeform.com/to/vh8Ffu';

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

export const LEDGER_BRIDGE_URL = 'https://wallet.superhero.com/ledger-bridge';

export const BLOG_CLAIM_TIP_URL = 'https://blog.aeternity.com/superhero-how-to-send-receive-superhero-tips-34971b18c919#024e';

export const COMMIT_URL = 'https://github.com/aeternity/superhero-wallet/commit/';
