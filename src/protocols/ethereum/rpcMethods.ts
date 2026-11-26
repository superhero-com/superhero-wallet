// Keep free of imports: the content script, which runs in every frame, bundles them.

export const ETH_RPC_METHODS = {
  getBalance: 'eth_getBalance',
  getChainId: 'eth_chainId',
  getAccounts: 'eth_accounts',
  requestAccounts: 'eth_requestAccounts',
  // signing
  sendTransaction: 'eth_sendTransaction',
  signPersonal: 'personal_sign',
  signTypedDataV4: 'eth_signTypedData_v4',
  // wallet
  requestPermissions: 'wallet_requestPermissions',
  switchNetwork: 'wallet_switchEthereumChain',
  revokePermissions: 'wallet_revokePermissions',
  // app-version
  web3ClientVersion: 'web3_clientVersion',
} as const;

export const ETH_RPC_WALLET_EVENTS = {
  chainChanged: 'chainChanged',
  accountsChanged: 'accountsChanged',
} as const;

/** Asked by the content script itself, it doesn't relay them from the page */
export const ETH_CONTENT_SCRIPT_METHODS = {
  /** The accounts to tell the page of when the active one changes */
  getPermittedAccounts: 'superhero_getPermittedAccounts',
} as const;
