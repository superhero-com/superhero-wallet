import { TxBuilder } from '@aeternity/aepp-sdk/es';
import { ABI_VERSIONS, TX_TYPE, VM_VERSIONS } from '@aeternity/aepp-sdk/es/tx/builder/schema';
import BigNumber from 'bignumber.js';
import { i18n } from '../../store/plugins/languages';

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

export const HDWALLET_METHODS = ['generateWallet', 'getKeypair', 'getAccount', 'isLoggedIn'];

export const AEX2_METHODS = {
  CHANGE_ACCOUNT: 'CHANGE_ACCOUNT',
  ADD_ACCOUNT: 'ADD_ACCOUNT',
  SWITCH_NETWORK: 'SWITCH_NETWORK',
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
export const MAX_UINT256 = BigNumber(2).exponentiatedBy(256).minus(1);

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
  return BigNumber(MIN_FEE).shiftedBy(-MAGNITUDE);
};

export const defaultNetworks = [
  {
    url: 'https://testnet.aeternity.io',
    networkId: 'ae_uat',
    middlewareUrl: 'https://testnet.aeternity.io/mdw',
    explorerUrl: 'https://testnet.aeternal.io',
    compilerUrl: 'https://latest.compiler.aepps.com',
    backendUrl: 'https://test-tipping.aeternity.art',
    tipContractV1: 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd',
    tipContractV2: 'ct_2ZEoCKcqXkbz2uahRrsWeaPooZs9SdCv6pmC4kc55rD4MhqYSu',
    name: 'Testnet',
  },
  {
    url: 'https://mainnet.aeternity.io',
    networkId: 'ae_mainnet',
    middlewareUrl: 'https://mainnet.aeternity.io/mdw',
    explorerUrl: 'https://mainnet.aeternal.io',
    compilerUrl: 'https://compiler.aepps.com',
    backendUrl: 'https://raendom-backend.z52da5wt.xyz',
    tipContractV1: 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z',
    name: 'Mainnet',
  },
];

export const defaultNetwork =
  process.env.NETWORK === 'Testnet' ? defaultNetworks[0] : defaultNetworks[1];

export const AGGREGATOR_URL = 'https://superhero.com/';

export const TXS_PER_PAGE = 30;
export const AENS_DOMAIN = '.chain';
export const MAX_AUCTION_NAME_LENGTH = 12 + AENS_DOMAIN.length;
export const MIN_NAME_LENGTH = 14;
export const AUTO_EXTEND_NAME_BLOCKS_INTERVAL = 17000;

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
