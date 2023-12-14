import { Encoding, Tag } from '@aeternity/aepp-sdk';
import type {
  DexFunctionType,
  IDefaultNetworkTypeData,
  IDexContracts,
  TxFunctionRaw,
} from '@/types';
import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';
import { AeTippingContractAddresses, IAeNetworkPredefinedSettings, IAeNetworkSettings } from './types';

export * from './libs/multisig';

export const AE_CONTRACT_ID = 'aeternity';
export const AE_SYMBOL = 'AE';
export const AE_SYMBOL_SHORT = '\xC6';
export const AE_COIN_SYMBOL = 'AE Coin';
export const AE_COIN_NAME = 'Aeternity';
export const AE_PROTOCOL_NAME = 'æternity';
export const AE_COIN_PRECISION = 18; // Amount of decimals

export const AE_COINGECKO_COIN_ID = 'aeternity';

/**
 * Default `networkId` values returned by the Node after establishing the connection.
 * Nodes returns different values when connecting to the Hyperchains.
 */
export const AE_NETWORK_MAINNET_ID = 'ae_mainnet';
export const AE_NETWORK_TESTNET_ID = 'ae_uat';

export const AE_NETWORK_MAINNET_NODE_URL = 'https://mainnet.aeternity.io';
export const AE_NETWORK_TESTNET_NODE_URL = 'https://testnet.aeternity.io';

export const AE_COMPILER_URL = 'https://compiler.aeternity.io';

export const AE_NETWORK_DEFAULT_SETTINGS: IDefaultNetworkTypeData<IAeNetworkSettings> = {
  [NETWORK_TYPE_MAINNET]: {
    nodeUrl: AE_NETWORK_MAINNET_NODE_URL,
    middlewareUrl: 'https://mainnet.aeternity.io/mdw',
    backendUrl: 'https://raendom-backend.z52da5wt.xyz',
  },
  [NETWORK_TYPE_TESTNET]: {
    nodeUrl: AE_NETWORK_TESTNET_NODE_URL,
    middlewareUrl: 'https://testnet.aeternity.io/mdw',
    backendUrl: 'https://testnet.superhero.aeternity.art',
  },
};

export const AE_NETWORK_DEFAULT_ENV_SETTINGS = (process.env.NETWORK === 'Testnet')
  ? AE_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_MAINNET]
  : AE_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_TESTNET];

export const AE_NETWORK_ADDITIONAL_SETTINGS: IDefaultNetworkTypeData<
  IAeNetworkPredefinedSettings
> = {
  [NETWORK_TYPE_MAINNET]: {
    explorerUrl: 'https://aescan.io',
    multisigBackendUrl: 'https://ga-multisig-backend-mainnet.prd.aepps.com',
  },
  [NETWORK_TYPE_TESTNET]: {
    explorerUrl: 'https://testnet.aescan.io',
    multisigBackendUrl: 'https://ga-multisig-backend-testnet.prd.aepps.com',
  },
};

export const AE_AVATAR_URL = 'https://avatars.z52da5wt.xyz/';
export const AE_BLOG_CLAIM_TIP_URL = 'https://blog.aeternity.com/superhero-how-to-send-receive-superhero-tips-34971b18c919#024e';
export const AE_COMMIT_URL = 'https://github.com/aeternity/superhero-wallet/commit/';
export const AE_DEX_URL = 'https://aepp.dex.superhero.com';
export const AE_FAUCET_URL = 'https://faucet.aepps.com';
export const AE_SIMPLEX_URL = 'https://simplex.superhero.com';

export const AE_AENS_DOMAIN = '.chain';
export const AE_AENS_NAME_MAX_LENGTH = 63 + AE_AENS_DOMAIN.length;
export const AE_AENS_NAME_AUCTION_MAX_LENGTH = 12 + AE_AENS_DOMAIN.length;
export const AE_AENS_BID_MIN_RATIO = 1.05;

/**
 * Estimated time we need to wait for the middleware to sync it's state
 * with the node. There is a high risk that in some cases this won't be enough
 * so consider using this constant as a workaround.
 */
export const AE_MDW_TO_NODE_APPROX_DELAY_TIME = 5000;

export const AE_HASH_PREFIXES_ALLOWED = [
  Encoding.AccountAddress,
  Encoding.Channel,
  Encoding.ContractAddress,
  Encoding.Name,
  Encoding.OracleAddress,
  Encoding.TxHash,
] as const;

export const SEED_LENGTH = 32;

/**
 * ITx.function
 */
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
  spend: 'spend',
  namePreclaim: 'name_preclaim',
  nameClaim: 'name_claim',
  nameTransfer: 'name_transfer',
  incompleteTransfer: 'incomplete_transfer',
  pendingSpend: 'pending_spend',
  pendingTransfer: 'pending_transfer',
  pendingTipAe: 'pending_tip_ae',
  pendingTipToken: 'pending_tip_token',
  payForGaAttach: 'pay_for_ga_attach',
  gaMetaSpend: 'ga_meta_spend',
} as const;

/**
 * ITx.function
 */
export const TX_FUNCTIONS_MULTISIG = {
  propose: 'propose',
  confirm: 'confirm',
  refuse: 'refuse',
  revoke: 'revoke',
} as const;

export const TX_FUNCTIONS_TYPE_DEX: Record<DexFunctionType, TxFunctionRaw[]> = {
  pool: [
    'remove_liquidity', 'remove_liquidity_ae', 'add_liquidity', 'add_liquidity_ae',
  ],
  removeLiquidity: [
    'remove_liquidity', 'remove_liquidity_ae',
  ],
  addLiquidity: [
    'add_liquidity', 'add_liquidity_ae',
  ],
  swap: [
    'deposit', 'withdraw', 'swap_exact_tokens_for_tokens', 'swap_tokens_for_exact_tokens',
    'swap_exact_ae_for_tokens', 'swap_tokens_for_exact_ae', 'swap_exact_tokens_for_ae',
    'swap_ae_for_exact_tokens',
  ],
  allowance: [
    'transfer_allowance', 'change_allowance', 'create_allowance',
  ],
  maxSpent: [
    'swap_tokens_for_exact_tokens', 'swap_tokens_for_exact_ae', 'swap_ae_for_exact_tokens',
  ],
  minReceived: [
    'swap_exact_tokens_for_tokens', 'swap_exact_ae_for_tokens', 'swap_exact_tokens_for_ae',
  ],
};

/**
 * ITx.tag
 */
export const TX_TAGS_SUPPORTED = [
  Tag.SpendTx,
  Tag.ContractCreateTx,
  Tag.ContractCallTx,
  Tag.NamePreclaimTx,
  Tag.NameClaimTx,
  Tag.NameUpdateTx,
  Tag.NameTransferTx,
];

/**
 * ITx.tag
 */
export const TX_TAGS_AENS = new Set([
  Tag.NameClaimTx,
  Tag.NamePreclaimTx,
  Tag.NameRevokeTx,
  Tag.NameUpdateTx,
]);

export const TX_RETURN_TYPE_OK = 'ok';
export const TX_RETURN_TYPE_ABORT = 'abort';
export const TX_RETURN_TYPE_REVERT = 'revert';

export const TX_RETURN_TYPES = [
  TX_RETURN_TYPE_OK,
  TX_RETURN_TYPE_ABORT,
  TX_RETURN_TYPE_REVERT,
] as const;

export const DEX_CONTRACTS: Record<string, IDexContracts> = {
  [AE_NETWORK_MAINNET_ID]: {
    router: [
      'ct_azbNZ1XrPjXfqBqbAh1ffLNTQ1sbnuUDFvJrXjYz7JQA1saQ3',
    ],
    wae: [
      'ct_J3zBY8xxjsRr3QojETNw48Eb38fjvEuJKkQ6KzECvubvEcvCa',
    ],
  },
  [AE_NETWORK_TESTNET_ID]: {
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
};

export const DEX_PROVIDE_LIQUIDITY = 'provide_liquidity';
export const DEX_REMOVE_LIQUIDITY = 'remove_liquidity';
export const DEX_SWAP = 'swap';
export const DEX_ALLOW_TOKEN = 'allow_token';

export const DEX_TRANSACTION_TAGS: Partial<Record<TxFunctionRaw, string>> = {
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
} as const;

export const AEX9_TRANSFER_EVENT = 'Aex9TransferEvent';

export const AE_TRANSACTION_OWNERSHIP_STATUS = {
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

export const MULTISIG_SUPPORTED_CONTRACT_VERSION = '2.0.0';

export const AE_TIPPING_CONTRACTS_MAINNET: AeTippingContractAddresses = {
  tippingV1: 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z',
};
export const AE_TIPPING_CONTRACTS_TESTNET: AeTippingContractAddresses = {
  tippingV1: 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd',
  tippingV2: 'ct_2ZEoCKcqXkbz2uahRrsWeaPooZs9SdCv6pmC4kc55rD4MhqYSu',
};

export const UPDATE_POINTER_ACTION = {
  update: 'update',
  extend: 'extend',
} as const;
