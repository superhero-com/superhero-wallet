# Developing Superhero Wallet

Use the latest Node.js 22.x release and its bundled npm to match CI. From the repository root, install the locked dependencies and start the web wallet.

```sh
npm ci
npm run dev
```

Open `http://localhost:8080` and select Testnet for local transaction testing. Vite reads local build settings from `.env.local`. If a feature needs a provider key or WalletConnect project ID, set it there and restart the server or rebuild the extension. Values exposed by the build are readable in the client. [Build settings](../build/env.ts)

## Run a target

| Target | Command | Where to run it |
| --- | --- | --- |
| Hosted web | `npm run build:web` | Serve `dist/web/root` with unknown paths falling back to `index.html`, as the deploy does with `404.html`. For local development, `npm run dev` serves changes directly. |
| Chrome, Brave or Opera | `npm run watch` for development or `npm run build:extension:chrome` for a one-off build | In the browser's extensions manager enable Developer mode, choose **Load unpacked**, and select `dist/extension/chrome`. Reload the extension and the dApp tab after rebuilding injected scripts. |
| Firefox | `npm run watch:ff` or `npm run build:extension:ff` | Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist/extension/firefox/manifest.json`. |
| Android | `npm run build:android` | Builds to `www`, syncs Capacitor, and opens Android Studio. Select an emulator or device. CI builds the debug APK with Java 21, the checked-in Gradle wrapper, and the [Android SDK levels](../android/variables.gradle). |
| iOS | `npm run build:ios` | On macOS with Xcode and CocoaPods, this syncs the Capacitor project and opens Xcode. Select the App scheme and a simulator or signed device. |

For both extension builds use `npm run build:extension`. The GitHub release extension ZIP contains `chrome/` and `firefox/` directories. Extract the ZIP and load the corresponding directory or manifest. [Build scripts](../package.json) · [Vite output directories](../vite.config.mts)

## Choose tests for a change

| What changed | Local check |
| --- | --- |
| Components, composables, protocol logic | `npm run test:unit` runs Vitest. Use `npm run test:unit -- tests/unit/protocols/hd-derivation-golden.spec.ts` to run a single file. |
| Web wallet workflows | `npm run test:e2e` starts the web wallet on port 8080 and runs Cypress. Leave the port free before starting. `npm test` runs unit tests followed by this suite. |
| Extension discovery, approvals, browser lifecycle | `npm run test:e2e:extension` builds the Chrome extension and drives it with Puppeteer. For browser vault changes, also run `npm run test:vault:browser` to exercise IndexedDB across real browser contexts. Both need Puppeteer's Chrome download. |
| WebKit callbacks and browser-specific behavior | Install WebKit with `npx playwright-core install webkit`, then run `npm run test:e2e:webkit`. CI uses `npx playwright-core install --with-deps webkit` on Ubuntu 24.04. |
| Native iOS splash behavior | On macOS with an iOS simulator, run `npm run test:ios:splash`. See the [simulator guide](../tests/ios/splash-screen/README.md). |

CI also checks conventional commits on PRs, ESLint, Stylelint, the TypeScript error baseline, and unit coverage. To match CI, run `npx cross-env NODE_ENV=production npm run lint:vue`, `npm run lint:css` and `npm run typecheck:baseline`. Production mode makes ESLint reject `debugger` statements. Add each new Cypress spec to a shard's `spec_pattern` in the test workflow; CI fails on an unassigned spec. [Test workflow](../.github/workflows/test.yml)

## Follow an extension request

An EVM dApp calling `eth_requestAccounts` crosses three parts of the extension.

1. The in-page provider posts the request with an ID. The content script relays it to the wallet and returns the result or error to that page. The same script relays æternity AEX-2 traffic over a separate runtime port. [In-page provider](../src/content-scripts/inpage.ts) · [Content script](../src/content-scripts/inject.ts)
2. The wallet's offscreen document takes the site origin from the browser sender. The EVM handler checks that site's permission and, when approval is needed, requests confirmation. This is where to investigate a connection that reaches the extension but returns no accounts or a rejection. [Offscreen listener](../src/offscreen/offscreen.ts) · [EVM handler](../src/protocols/evm/libs/EvmRpcMethodsHandler.ts) · [Permissions](../src/composables/permissions.ts)
3. Chrome's service worker creates the offscreen document, manages popup requests and forwards wallet events to tabs. Firefox runs the offscreen page as its background page and sends events to tabs from there. For a browser-specific popup failure, check the relevant background context and the popup console. [Chrome service worker](../src/background/index.ts) · [Popup handling](../src/offscreen/popupHandler.ts) · [Chrome popup windows](../src/background/bgPopupHandler.ts) · [Extension build targets](../scripts/build-extension.mjs)

## Add or change a chain adapter

Dogecoin illustrates how a native-coin chain uses the common [adapter interface](../src/protocols/BaseProtocolAdapter.ts).

1. **Register the chain.** Add the protocol ID to `PROTOCOLS` and associate it with an adapter class. The networks composable asks each registered adapter for the defaults for that network. Dogecoin defines separate node and explorer settings for mainnet and testnet. Map the chain to a view set in `ProtocolSpecificView.vue`, where Dogecoin reuses `bitcoinViews` and so gets the Bitcoin transfer form. Add its icons in `AssetIcon.vue` and `ProtocolIcon.vue`. These maps are typed `Record<Protocol, …>`, so the typecheck reports any you miss. [Protocol IDs](../src/constants/common.ts) · [Adapter registry](../src/protocols/registerAdapters.ts) · [Network defaults](../src/composables/networks.ts) · [Dogecoin configuration](../src/protocols/dogecoin/config.ts) · [Protocol views](../src/popup/components/ProtocolSpecificView.vue)
2. **Preserve account identity.** Implement address validation, seed derivation, private-key account resolution and account discovery. Dogecoin derives `m/44'/3'/i'/0/0` for account index `i`. The active network changes the address encoding, so the adapter includes the network type in the derivation cache key. Check an existing seed, multiple indices and a mainnet/testnet switch after changing this code. [Dogecoin adapter](../src/protocols/dogecoin/libs/DogecoinAdapter.ts)
3. **Connect balances, history and transfers.** The adapter normalizes transaction history and carries the last transaction ID into the next page. To spend, it selects unspent outputs, calculates change and signs the transaction before broadcasting it. The shared Bitcoin transfer form uses Dogecoin's fee and dust settings. Set token support to match the operations implemented. dApp methods and hardware signing each need their own integration. [Transfer form](../src/protocols/bitcoin/components/TransferSendForm.vue) · [Dogecoin adapter tests](../tests/unit/dogecoin)
4. **Verify the change.** Run the chain tests together with the derivation vectors. On a test network with a working endpoint, check receive-address display, history pagination, fee review and a transfer through the normal UI. Update the [compatibility table](compatibility.md) for any user-visible change.

```sh
npm run test:unit -- tests/unit/dogecoin tests/unit/protocols/hd-derivation-golden.spec.ts
```
