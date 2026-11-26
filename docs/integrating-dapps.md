# Connect a dApp to Superhero Wallet

Use the æternity SDK for æternity accounts, the injected Ethereum provider for EVM accounts in the extension or wallet's in-app browser, and WalletConnect when an EVM app opens separately from the wallet. A normal mobile browser can launch a one-shot æternity signing request using an HTTPS link. [Compatibility table](compatibility.md) · [Deep-link reference](deep-link-schema.md)

## Try a testnet signature

Each example signs the message `hello`. No testnet funds are needed. In the wallet, create the corresponding **æternity** or **Ethereum** software account and select **Testnet**. Use a dApp origin on HTTPS or localhost.

The examples target wallet source `5069e2768` on `develop` (after release v2.12.0), æternity SDK 15.0.1 and WalletConnect Sign Client 2.25.0. For a local demo, make an empty directory, run `npm init -y` and `npm install -D vite@8.3.8` with Node 22.12 or newer. Save this as `index.html`, put **one** of the examples below in `main.js`, and start with `npx vite`. For a mobile device, serve the demo from an HTTPS origin it can reach.

```html
<button id="connect">Connect and sign hello</button>
<a id="pair" target="_blank" rel="noopener" hidden>Open Superhero Wallet</a>
<p><output id="result"></output></p>
<script type="module">
  import { connectAndSign } from './main.js';
  const button = document.querySelector('#connect');
  const result = document.querySelector('#result');
  button.onclick = async () => {
    button.disabled = true;
    result.textContent = 'Waiting for wallet…';
    try {
      result.textContent = await connectAndSign();
    } catch (error) {
      result.textContent = error.message ?? String(error);
    } finally {
      button.disabled = false;
    }
  };
</script>
```

### æternity SDK (AEX-2)

Run `npm install @aeternity/aepp-sdk@15.0.1`. Open the demo with the browser extension enabled or inside the mobile wallet's in-app browser. Approve account access, then approve the message. The result is the signature in hex. [SDK wallet connector](https://github.com/aeternity/aepp-sdk-js/blob/v15.0.1/src/aepp-wallet-communication/WalletConnectorFrame.ts)

```js
import {
  BrowserWindowMessageConnection, SUBSCRIPTION_TYPES, WalletConnectorFrame, walletDetector,
} from '@aeternity/aepp-sdk';

function findWallet() {
  return new Promise((resolve, reject) => {
    const stop = walletDetector(new BrowserWindowMessageConnection(), ({ newWallet }) => {
      if (newWallet.info.id !== 'Superhero Wallet' || newWallet.info.type !== 'extension') return;
      clearTimeout(timeout);
      stop();
      resolve(newWallet);
    });
    const timeout = setTimeout(() => {
      stop();
      reject(new Error('Superhero Wallet was not detected'));
    }, 10000);
  });
}

let connector;
export async function connectAndSign() {
  if (!connector?.isConnected) {
    const wallet = await findWallet();
    connector = await WalletConnectorFrame.connect('Signature demo', wallet.getConnection());
  }
  if (connector.accounts.length === 0) {
    await connector.subscribeAccounts(SUBSCRIPTION_TYPES.subscribe, 'current');
  }
  const [account] = connector.accounts;
  if (!account) throw new Error('Select an æternity account in the wallet');
  if (connector.networkId !== 'ae_uat') throw new Error('Select Testnet in the wallet');
  const bytes = await account.signMessage('hello');
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
```

Update the displayed account on `accountsChange`, update chain-specific data on `networkIdChange`, and clear the session on `disconnect`. Call `connector.disconnect()` when the user disconnects the dApp. In the browser extension, the page must reload before it can connect again. Any frame on the page can post an announcement, so accept only `type: 'extension'`. For that type the SDK binds the connection to your page's origin. Address subscription requests permission to share the active æternity account. A declined request rejects with SDK error `RpcRejectedByUserError` (code `4`). [Wallet callbacks](../src/composables/aeSdk.ts) · [Extension integration tests](../tests/e2e-extension/dapp-gates.spec.ts)

| SDK operation | Input and result |
| --- | --- |
| `subscribeAccounts` / `getAccounts` | Subscribe to the current account for updates, or request the list of æternity accounts. Both yield SDK account objects, but the wallet signs with its active æternity account (or the one the user picks in the prompt), whichever object you call. Sign with the account from the `'current'` subscription. |
| `askToSelectNetwork` | After address access, pass `{networkId: 'ae_uat'}` to request Testnet. Wait for the promise and recheck `connector.networkId`. Requires a wallet build newer than v2.12.0. v2.12.0 rejects with `RpcMethodNotFoundError`, so ask the user to switch networks in the wallet instead. |
| `account.signMessage` / `account.signTransaction` | Sign non-empty text to signature bytes, or pass a prepared `tx_…` and `{networkId}` to receive a signed `tx_…`. The SDK requires `networkId`, but the wallet signs for its active network, so compare `connector.networkId` first. The application can submit that transaction to its node. The wallet refuses any other message with `RpcInternalError` (code `12`), and a transaction it can't decode with `RpcInvalidTransactionError` (code `2`), without asking the user. |
| `account.signTypedData` / `account.signDelegation` | The SDK accepts encoded data and its ACI type, or an encoded delegation. Each returns an encoded signature and is subject to the wallet's permissions and account type. |

### EVM injected provider (EIP-6963, EIP-1193)

Open the demo with the extension enabled or in the wallet's in-app browser. The wallet announces itself alongside other installed providers. The example selects Superhero, requests the account, and asks it to sign on Ethereum Sepolia.

```js
let discoveredProvider;
window.addEventListener('eip6963:announceProvider', ({ detail }) => {
  if (detail.info.rdns === 'wallet.superhero.com') discoveredProvider = detail.provider;
});
window.dispatchEvent(new Event('eip6963:requestProvider'));

export async function connectAndSign() {
  const provider = discoveredProvider;
  if (!provider) throw new Error('Superhero Wallet was not detected');
  const [address] = await provider.request({ method: 'eth_requestAccounts' });
  const chainId = await provider.request({ method: 'eth_chainId' });
  if (chainId !== '0xaa36a7') throw new Error('Select Ethereum on Testnet in the wallet');
  return provider.request({ method: 'personal_sign', params: ['0x68656c6c6f', address] });
}
```

If your app offers a wallet selector, use the provider the user chose for the entire request. For a persistent UI, subscribe to that provider with `provider.on('accountsChanged', handler)` and `provider.on('chainChanged', handler)`. Refresh the selected address and data for the new chain. An empty accounts array clears the connected state. In the extension, a site removed in the wallet receives no event, so treat `4100` as disconnected. After your own `wallet_revokePermissions`, clear the state yourself. Remove handlers with `removeListener` when leaving the page. [Provider discovery](https://eips.ethereum.org/EIPS/eip-6963) · [Provider requests and events](https://eips.ethereum.org/EIPS/eip-1193)

| Request | Parameters and result |
| --- | --- |
| `eth_accounts` / `eth_requestAccounts` | No parameters. The first returns the active address once the site is approved with **Remember me** on (the default), otherwise `[]`. One approval covers the site's æternity and EVM addresses. The second requests access and returns the active address in an array. |
| `eth_chainId` / `wallet_switchEthereumChain` | Read a hex chain ID, or pass `[{chainId: '0xaa36a7'}]` after connecting. A successful switch returns `null`. A switch to another EVM protocol needs an account for it. |
| `personal_sign` / `eth_signTypedData_v4` | Pass `[message, address]` or `[address, typedData]`. Returns a hex signature after authorization. |
| `eth_sendTransaction` | Pass `[{from, to, value, data}]` with amounts in hex wei and optional call data. The wallet prices the fee and returns a transaction hash after broadcasting. Use a receipt to track confirmation. `to` is required (no contract deployment), and `from` must be the active account (over WalletConnect, any account in the session). |
| `wallet_requestPermissions` / `wallet_revokePermissions` | Pass `[{eth_accounts: {}}]`. Superhero returns `{eth_accounts: true}` on grant and `null` on revocation. |
| `eth_getBalance` / `web3_clientVersion` | Read a balance in hex wei or the wallet version string. Supported node RPCs also include `eth_call`, `eth_estimateGas` and `eth_getTransactionReceipt`. [Node method list](../src/protocols/ethereum/config.ts) |

Handle `4001` by returning the UI to idle after a refusal. For `4100`, recheck the connected account and request access from a user action. For `4902`, check that the chain is configured and the user has an account for its protocol. An unsupported method can return `-32004`. `-32602` means a parameter is invalid, such as an empty `personal_sign` message, or the request's chain differs from the active one, so recheck `eth_chainId`. `-32603` is a wallet or node failure. `wallet_addEthereumChain` is unsupported. [Wallet method handler](../src/protocols/evm/libs/EvmRpcMethodsHandler.ts)

### EVM WalletConnect v2

Run `npm install @walletconnect/sign-client@2.25.0`. Supply your dApp's project ID in place of `YOUR_PROJECT_ID` and allow its origin in your WalletConnect project. Select Ethereum on Testnet in Superhero. After clicking **Connect and sign hello**, click **Open Superhero Wallet** to approve the session. With the extension installed, `wallet.superhero.com` links open the extension instead of the hosted wallet. Return to the dApp and wallet as needed for the signing prompt. The same pairing URI can be displayed as a QR code for the wallet to scan on a second device.

```js
import SignClient from '@walletconnect/sign-client';

const chainId = 'eip155:11155111';
const clientReady = SignClient.init({
  projectId: 'YOUR_PROJECT_ID',
  metadata: { name: 'Signature demo', description: 'Sign hello on Sepolia', url: location.origin, icons: [] },
});

export async function connectAndSign() {
  const client = await clientReady;
  const { uri, approval } = await client.connect({
    optionalNamespaces: {
      eip155: { chains: [chainId], methods: ['personal_sign'], events: ['accountsChanged', 'chainChanged'] },
    },
  });
  const link = document.querySelector('#pair');
  if (uri) {
    const url = new URL('https://wallet.superhero.com/wc');
    url.searchParams.set('uri', uri);
    link.href = url.href;
    link.hidden = false;
  }
  try {
    const session = await approval();
    try {
      const account = session.namespaces.eip155.accounts.find(id => id.startsWith(chainId + ':'));
      if (!account) throw new Error('The wallet did not approve a Sepolia account');
      return await client.request({
        topic: session.topic,
        chainId,
        request: { method: 'personal_sign', params: ['0x68656c6c6f', account.split(':')[2]] },
      });
    } finally {
      await client.disconnect({ topic: session.topic, reason: { code: 6000, message: 'Demo finished' } });
    }
  } finally {
    link.hidden = true;
    link.removeAttribute('href');
  }
}
```

Request the `eip155` namespace with the methods your app uses and both `accountsChanged` and `chainChanged` events. Without these events, the wallet ends the session on the first account or network switch. Sign-client 2.25 sends every namespace as optional. From those, Superhero approves only `eth_requestAccounts`, `eth_accounts`, `eth_chainId`, `personal_sign`, `eth_signTypedData_v4`, `eth_sendTransaction`, `eth_blockNumber`, `eth_estimateGas`, `eth_getTransactionCount`, `eth_gasPrice` and `wallet_getCapabilities`. Read balances and receipts from your own RPC. Chain IDs in a session are decimal CAIP-2 IDs such as `eip155:11155111`. The session lists every wallet account for its chains. It can also list chains of networks the wallet isn't on. Requests bound to such a chain fail with `-32602` until the user switches the wallet's network. `personal_sign` is not chain-bound. Use the approved account for the request's chain and the approved session topic. The signing and send methods use the EVM parameters and results above. [WalletConnect namespaces](https://specs.walletconnect.com/2.0/specs/clients/sign/namespaces)

For an ongoing session, handle `session_update` to refresh approved accounts and chains, `session_event` for account or chain changes, and `session_delete` to clear the pairing UI. Use a fresh proposal after expiry or rejection. If the wallet has an existing session and ignores a new pairing link, disconnect the existing session in its WalletConnect screen. For self-built wallets, check the wallet's project ID as well as the dApp's. [Session implementation](../src/composables/walletConnect.ts) · [Session tests](../tests/unit/composables/walletConnect.accountsChanged.spec.ts)

## Check an integration

Run each approval flow once, then turn off **Auto-sign messages** and the daily limit for the site and deny a fresh signature request. The first should produce a signature that verifies against the address the app expects. The user can pick another account in the signing prompt, so treat a signature from a different address as a failure. The second should leave the app ready for another user action. For a persistent app, switch accounts and networks, revoke access (in the extension, expect `4100` rather than an event), then reconnect. Check that previously selected accounts and chains are cleared or updated before enabling the next signature. Record the wallet build, SDK version and platform when updating an example.
