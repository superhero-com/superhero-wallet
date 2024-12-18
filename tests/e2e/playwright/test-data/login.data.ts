export const RestoreWalletData = {
  // First test account data, mostly used for tests
  testWalletSeed: process.env.PLAYWRIGHT_SEED_PHRASE,
  aeAccAddress: 'ak_2srCJ3y29JChwrPSjLbTC1ymqHNmJzmHgzYrjfPUhnwF3EE2TL',
  aeAccAddressChainName: 'addinganewchainnameforfree.chain',
  // Second account for the above wallet
  secAeAccAddress: 'ak_2Ek1uRRRXiWwyXWvFjjQU7x9ZYaLx5b4ReTrTdyMxiwuDNNUp9',
  secAeAccChainName: 'OldFootholdLandmarkBonyRelieveUnsorted.chain',
  // Account with no txn, names, nothing. For checking new wallet info text
  virginWalletSeed: 'foot praise enforce era want antenna dish truth exit actual tongue caught',
  // ETH account data
  ethAccAddress: '0x22Fa8128467F549eD9eAd9Ae9b3BEdFA62987c48',
  secEthAccAddress: '0x56eFaF7299AA9C7b3F7935f88908596A8b11a016',
};

export const WalletPassword = {
  // Set Wallet Password
  walletPassword: '1234567890',
};
