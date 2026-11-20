# Deep-link URL reference

The address and signing routes below use æternity accounts. To connect an EVM dApp, see [Connect a dApp](integrating-dapps.md). To request a transfer or pair a WalletConnect session, see [Payment, network and pairing links](#payment-network-and-pairing-links).

Use `URLSearchParams` to encode the outer query values once. Supply an absolute `x-success` and `x-cancel` callback on your own origin. Put the literal placeholders (such as `{address}`) in the callback template before encoding the outer query. The wallet substitutes their URL-encoded values. HTTP and HTTPS callbacks are accepted, as are the registered `superhero:` and `wc:` schemes. Other custom schemes are rejected. Callbacks outside `https://superhero.com` and its subdomains need a separate confirmation before redirection. The wallet checks the callback only after the user approves the request. An invalid callback shows an error. Then, as when the user declines the confirmation or `x-success` is missing, the wallet returns to its account screen. The dApp receives nothing, although with `broadcast=true` the transaction is already submitted. [Callback handling](../src/composables/deepLinkApi.ts) · [Allowed schemes](../src/utils/callbackUrl.ts)

Use HTTPS callbacks with a fresh `state` for every request, and check it on return. `{address}` alone proves nothing, because anyone can open your callback URL. Before trusting an address, verify a `sign-message` signature or a `sign-jwt` token over a single-use nonce from your server.

## Connect to a wallet

```bash
https://wallet.superhero.com/address
  ? x-success=<success-url>
  & x-cancel=<cancel-url>
```
|URL Params|Description|
|--|--|
|`x-success` (required to receive a result)| URL to open on approval. Include `{address}` and `{networkId}` for the values the app needs.|
|`x-cancel` (required to receive a result)| URL to open when the user declines or the connection fails.|

### Example

```
https://wallet.superhero.com/address?x-success=https%3A%2F%2Fexample.com%2Fsuccess-connection%3Faddress%3D%7Baddress%7D%26networkId%3D%7BnetworkId%7D&x-cancel=https%3A%2F%2Fexample.com%2Ffail-connection
```


## Sign a transaction

```bash
https://wallet.superhero.com/sign-transaction
  ? transaction=<Encoding.Transaction>
  & networkId=<string>
  [& broadcast=true]
  [& replace-caller=true]
  [& innerTx=true]
  & x-success=<url-with-{transaction}-or-{transaction-hash}>
  & x-cancel=<cancel-url>
```

|URL Params|Description|
|--|--|
|`transaction` (required)| Unsigned æternity transaction in the SDK's `tx_` encoding. [SDK encoding types](https://github.com/aeternity/aepp-sdk-js/blob/v15.0.1/src/utils/encoder-types.ts)|
|`networkId` (required)|The `networkId` identifier of the network which the wallet should sign your transaction with.|
|`broadcast` (optional)| **Omit the parameter for sign-only.** Set `broadcast=true` to submit the signed transaction. The handler treats any nonempty string, including `false`, as a request to broadcast.|
|`replace-caller` (optional)| For a contract call, set `replace-caller=true` to use the wallet account's `callerId` and next nonce. For contract creation, supply the intended `ownerId` and its nonce and omit this flag. Rebuilding for a different signer in the confirmation screen requires the user's approval.|
|`innerTx` (optional)| Set `innerTx=true` for a software account signing the inner transaction of a `PayingFor` transaction. Omit `broadcast` so the payer receives the signed inner transaction.|
|`x-success` (required to receive a result)| Include `{transaction}` to receive a signed transaction when `broadcast` is omitted. Include `{transaction-hash}` to receive the hash after the wallet broadcasts and polls the transaction.|
|`x-cancel` (required to receive a result)| URL to open on rejection, a network mismatch, or a signing, submission or polling failure. The callback supplies no transaction hash.|

### Build a sign-only link

Prepare an unsigned `tx_…` for the current account on Testnet. Generate a fresh state with `crypto.randomUUID()` and save it with the pending request before opening the link. The browser loads `transaction-callback.html` from the dApp's origin. Its URL fragment keeps the signed bytes out of the HTTP request to that server.

```javascript
function buildSignOnlyLink(transaction, state) {
  const callback = `${location.origin}/transaction-callback.html#state=${encodeURIComponent(state)}`;
  const query = new URLSearchParams({
    transaction,
    networkId: 'ae_uat',
    'x-success': `${callback}&transaction={transaction}`,
    'x-cancel': `${callback}&cancelled=true`,
  });
  return `https://wallet.superhero.com/sign-transaction?${query}`;
}
```

On `transaction-callback.html`, retrieve the expected state from the dApp's pending request and check it before using any result.

```javascript
function readTransactionResult(expectedState) {
  const result = new URLSearchParams(location.hash.slice(1));
  if (!expectedState || result.get('state') !== expectedState) {
    throw new Error('Unexpected wallet callback');
  }
  return result;
}
```

Call `const result = readTransactionResult(savedState)` with the saved value. For a sign-only success, `result.get('transaction')` contains the signed `tx_…`. `result.get('cancelled') === 'true'` identifies the cancellation callback.

### Broadcast or sponsor a transaction

- **Wallet broadcast.** In the example's outer query, set `broadcast=true` and change `x-success` to `${callback}&hash={transaction-hash}`. Read `result.get('hash')` after validating state. The wallet posts the signed transaction and then polls for inclusion. A polling failure can send the dApp to `x-cancel` after the node has accepted the transaction. Check the original transaction on the requested network before offering a fresh transaction. For reliable tracking across a lost response, use sign-only, save the SDK's `buildTxHash(signedTx)` before submitting the signed bytes yourself, and look up that hash on the same network. [Signing handler](../src/popup/pages/SignTransaction.vue)
- **Sponsored payment with a software account.** Add `innerTx=true` to the sign-only example and keep `broadcast` omitted. The software account signs with the inner-transaction prefix and returns the signed bytes in `transaction`. The payer wraps those bytes in a `PayingFor` transaction, signs the outer transaction and submits it. The wallet's Ledger and AirGap paths do not forward the inner-signing option. [Account signing](../src/protocols/aeternity/libs/AeAccountHdWallet.ts)

## Sign a message

```bash
https://wallet.superhero.com/sign-message
  ? message=<message>
  & encoding=<string>
  & x-success=<success-url>
  & x-cancel=<cancel-url>
```

|URL Params|Description|
|--|--|
|`message` (required)| Message to sign.|
|`encoding` (optional)| Encoding of the message. Currently only `hex` is supported.|
|`x-success` (required to receive a result)| URL to open on approval. Use `{signature}` for the hex signature and `{address}` for the signer's address.|
|`x-cancel` (required to receive a result)| URL to open when signing is declined or fails.|

### Example

```
https://wallet.superhero.com/sign-message?message=test&x-success=https%3A%2F%2Fexample.com%2Fsuccess-message-sign%3Fsignature%3D%7Bsignature%7D%26address%3D%7Baddress%7D&x-cancel=https%3A%2F%2Fexample.com%2Ffail-message-sign
```

## Sign a JWT

```bash
https://wallet.superhero.com/sign-jwt
  ? payload=<payload>
  & x-success=<success-url>
  & x-cancel=<cancel-url>
```

|URL Params|Description|
|--|--|
|`payload` (required)| JSON object of claims. The wallet adds a `sub_jwk` claim with the signer's key and returns `header.payload.signature`. Verify it with the SDK's `unpackJwt(jwt, expectedAddress)`.|
|`x-success` (required to receive a result)| URL to open on approval. Use `{signed-payload}` for the signed JWT and `{address}` for the signer's address.|
|`x-cancel` (required to receive a result)| URL to open when signing is declined or fails.|

### Example

```
https://wallet.superhero.com/sign-jwt?payload=%7B%22test%22%3A1%7D&x-success=https%3A%2F%2Fexample.com%3Fsigned-payload%3D%7Bsigned-payload%7D%26address%3D%7Baddress%7D&x-cancel=https%3A%2F%2Fexample.com%2Ffail-sign-jwt
```

## Payment, network and pairing links

| Route | Parameters and action |
| --- | --- |
| `/account?op=transferSend` | Opens the send form for review. Use `account` for the recipient, `amount` in display units, `token` for the asset, and `protocol` for the chain. Native asset keys are `AE`, `bitcoin`, `ethereum`, `solana`, `dogecoin`, `bnb`, `avalanche` and `polygonPos`. A token uses its contract ID. `protocol` takes the same chain names, with `aeternity` for æternity. The Receive screen generates links for the selected asset. |
| `/account?op=addNetwork` | Opens the custom network form. Supply `nodeUrl` and optionally `middlewareUrl` to prefill æternity settings. The user reviews and saves the configuration. |
| `/wc` | Pass the WalletConnect pairing URI as `uri`. The native app also accepts `superhero://wc?uri=…`. After session approval, requests and results travel through WalletConnect. |

Use the payment form when the user should review and send a payment themselves. Use `/sign-transaction` for an already-built æternity transaction with a callback. [Payment-link tests](../tests/e2e/integration/deeplinks.cy.js) · [Pairing example](integrating-dapps.md#evm-walletconnect-v2)

## Opening a deep link in a popup (desktop)

On a desktop browser, a dApp can open the address and signing links above in a small window instead of leaving its page. The wallet asks the user in that window and then loads your `x-success` or `x-cancel` URL there. Your callback page hands the result to your app and closes the window. On phones, keep the full-page deep link: there the link opens the Superhero app.

1. Call `window.open` in the click handler, before any `await`. Browsers block it a few seconds after the click. If you need async work first (e.g. building the transaction), open `about:blank` right away and set the window's `location.href` once the deep link is ready.
2. Don't pass `noopener` or `noreferrer`. If `window.open` returns `null`, the popup was blocked: fall back to a full-page deep link.
3. Point `x-success` and `x-cancel` at a page on your own origin, with a new random `state` for each request, so your app can tell its result from another request's or another tab's.
4. On that page, send the result over a `BroadcastChannel` and close the window. In the Firefox extension the popup can't reach `window.opener`, and `popup.closed` turns `true` as soon as the wallet opens, so don't treat it as a cancel. For a signed transaction, build the callback as in [Build a sign-only link](#build-a-sign-only-link), add `&popup=1` to its fragment, and on that page read `new URLSearchParams(location.hash.slice(1))` instead of `location.search`.

```js
// In your app
const walletUrl = (state, popup) => {
  const callback = `${location.origin}/wallet-callback.html?state=${state}${popup ? '&popup=1' : ''}`;
  return 'https://wallet.superhero.com/sign-message?message=hello'
    + `&x-success=${encodeURIComponent(`${callback}&signature={signature}&address={address}`)}`
    + `&x-cancel=${encodeURIComponent(`${callback}&cancelled=true`)}`;
};
signButton.onclick = () => {
  const state = crypto.randomUUID();
  const channel = new BroadcastChannel('superhero-wallet-callback');
  channel.onmessage = ({ data }) => {
    if (data.state !== state) return;
    channel.close();
    // data has `signature` and `address`, or `cancelled`
  };
  const popup = window.open(walletUrl(state, true), 'superhero-wallet', 'popup,width=375,height=600');
  if (!popup) location.href = walletUrl(state, false);
};

// wallet-callback.html
const params = Object.fromEntries(new URLSearchParams(location.search));
if (params.popup) {
  new BroadcastChannel('superhero-wallet-callback').postMessage(params);
  window.close();
} else {
  // A full-page deep link came back: handle `params` here
}
```
