import { TxBuilder, SCHEMA } from '@aeternity/aepp-sdk';
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
};

export const CONNECTION_TYPES = {
  POPUP: 'POPUP',
  OTHER: 'OTHER',
};

const STUB_ADDRESS = 'ak_enAPooFqpTQKkhJmU47J16QZu9HbPQQPwWBVeGnzDbDnv9dxp';
const STUB_CALLDATA = 'cb_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDJfUrsdAtW6IZtMvhp0+eVDUiQivrquyBwXrl/ujPLcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQQwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUEMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJvjRF';
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
    backendUrl: 'https://testnet.superhero.aeternity.art',
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

export const ZEIT_TOKEN_CONTRACT = 'ct_pViaDUH9GwjATmAyT75Byhd9Uh91GBgLnBgwAaih2Z58BNN85';
export const ZEIT_INVOICE_CONTRACT = 'ct_tbzpYm5kSYWXB4AiYT2PYLxeXMXGyVLqQathcFjxxeMdNcWhz';
