# Wallet compatibility

Use the first table to choose a chain, then the second to choose how a dApp reaches the wallet. The chain entries describe the standalone extension, hosted wallet and native app. The built-in wallet on superhero.com is a separate product. This reference follows [wallet revision 5069e27](https://github.com/superhero-com/superhero-wallet/tree/5069e27681a9a8a9e721cb6bcb769d0f3787f898), on `develop` after v2.12.0.

## Chains and assets

| Chain | Send and receive in the wallet | Mainnet / test network | Connect and sign from a dApp |
| --- | --- | --- | --- |
| [æternity](../src/protocols/aeternity/libs/AeternityAdapter.ts) | AE, AEX-9 tokens | `ae_mainnet` / `ae_uat` | AEX-2 via the æternity SDK, or wallet signing links |
| [Ethereum](../src/protocols/ethereum/libs/EthereumAdapter.ts) | ETH, ERC-20 tokens | 1 / Sepolia 11155111 | EVM provider or WalletConnect |
| [BNB Smart Chain](../src/protocols/bnb/libs/BnbAdapter.ts) | BNB, BEP-20 tokens | 56 / 97 | EVM provider or WalletConnect |
| [Polygon PoS](../src/protocols/polygonPos/libs/PolygonPosAdapter.ts) | POL, ERC-20 tokens | 137 / Amoy 80002 | EVM provider or WalletConnect |
| [Avalanche C-Chain](../src/protocols/avalanche/libs/AvalancheAdapter.ts) | AVAX. Token balances aren't discovered, so the Send form offers no tokens. A dApp can still request an ERC-20 transfer through the EVM provider. | 43114 / Fuji 43113 | EVM provider or WalletConnect |
| [Bitcoin](../src/protocols/bitcoin/libs/BitcoinAdapter.ts) | BTC | Bitcoin mainnet / testnet | No Bitcoin dApp signing interface |
| [Dogecoin](../src/protocols/dogecoin/libs/DogecoinAdapter.ts) | DOGE. Mainnet reads and sends require a working replacement for the retired default API. | Dogecoin mainnet / testnet | No Dogecoin dApp signing interface |
| [Solana](../src/protocols/solana/libs/SolanaAdapter.ts) | SOL, SPL tokens using the original Token Program | Mainnet / devnet | No Solana dApp signing interface |

The EVM provider handles transaction requests, personal signatures and EIP-712 typed-data v4 signatures. WalletConnect offers the `eip155` namespace and needs an account for the requested protocol. A payment link can open a prefilled transfer form for user review even where a chain has no dApp signing interface. [RPC handler](../src/protocols/evm/libs/EvmRpcMethodsHandler.ts) · [WalletConnect](../src/composables/walletConnect.ts) · [Payment links](../src/lib/RouteQueryActionsController.ts)

## Connection by platform

| Where the dApp runs | æternity | EVM chains |
| --- | --- | --- |
| Desktop browser with Superhero's Chrome or Firefox extension | Discover the extension with the æternity SDK and request account access. | Discover Superhero via EIP-6963 and call its EIP-1193 provider. |
| Desktop browser using the hosted wallet | Open an HTTPS wallet link and handle its callback. A desktop popup can return the result to the original tab. | Pair with the hosted wallet using WalletConnect. With the extension installed, `wallet.superhero.com` links open the extension instead. |
| Ordinary mobile browser | Open a full-page wallet link. The installed app can handle the universal link. | Use WalletConnect with a pairing link or open the dApp in the wallet's browser. |
| Browser inside the native iOS or Android wallet | Discover the injected AEX-2 relay with the æternity SDK. | Discover the injected EVM provider via EIP-6963. |

For deployments that embed the web wallet in an iframe, its æternity SDK connection announces the wallet to the immediate parent frame. That wallet announces `type: 'window'`, which the detector in [Integrating a dApp](integrating-dapps.md) rejects. To accept it, also require `newWallet.info.origin` to equal your wallet deployment's origin. The SDK then binds the connection to that origin. [Frame connection](../src/lib/FramesConnection.ts)

The extension, hosted wallet and native wallet all offer WalletConnect from the dashboard. The pairing screen accepts a URI or QR code. Its connect button requires an EVM account. For connection examples, cancellation, callback handling and events, see [Integrating a dApp](integrating-dapps.md) and the [deep-link reference](deep-link-schema.md). [In-app browser provider](../src/content-scripts/inAppBrowserProvider.js) · [Pairing screen](../src/popup/components/Modals/WalletConnectModal.vue)

## Accounts and signing devices

| Account | Availability | Signing |
| --- | --- | --- |
| Seed-derived or imported private key | All eight chains. Private keys are imported as hex; æternity also accepts `sk_…`. Convert Bitcoin/Dogecoin WIF and Solana base58 exports first. | The wallet signs locally. Back up each separately imported key. |
| Ledger | æternity on a desktop browser with WebUSB, such as Chrome, including its extension and hosted web wallet. The Firefox and native apps do not offer Ledger import. | Confirm transactions and message signatures on the device. Typed-data and delegation signing are unavailable. |
| AirGap Vault | æternity on extension, hosted wallet and native app | Use QR version 3 or paste the encoded payload to return a signed transaction. Message, typed-data and delegation signing are unavailable. |
| Multisig vault | æternity | Authorized signers approve an AE transfer. Once enough approvals are recorded, a signer submits it. |

See [account creation](../src/popup/components/Modals/AccountCreate.vue), [hardware signing](../src/protocols/aeternity/libs/AeAccountHdWallet.ts), [using the wallet](using-the-wallet.md), and the [hardware troubleshooting guide](https://developer.superhero.com/wallets/troubleshooting/).
