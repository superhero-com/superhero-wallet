import type { IToken } from '@/types';

export const AE_CONTRACT_ID = 'aeternity';
export const AE_SYMBOL = 'AE';
export const AE_COIN_SYMBOL = 'AE Coin';
export const AE_COIN_NAME = 'Aeternity';
export const AE_COIN_PRECISION = 18; // Amount of decimals

export const AE_COINGECKO_COIN_ID = 'aeternity';

export const AE_TOKEN_BASE_DATA: IToken = {
  contractId: AE_CONTRACT_ID,
  decimals: AE_COIN_PRECISION,
  name: AE_COIN_NAME,
  symbol: AE_COIN_SYMBOL,
  convertedBalance: 0,
};

/**
 * Default `networkId` values returned by the Node after establishing the connection.
 * Nodes returns different values when connecting to the Hyperchains.
 */
export const AE_NETWORK_MAINNET_ID = 'ae_mainnet';
export const AE_NETWORK_TESTNET_ID = 'ae_uat';

export const AE_NETWORK_MAINNET_NODE_URL = 'https://mainnet.aeternity.io';

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
