# Deep link URL Schema

Remember that all parameters specified must be URI encoded.

## Connect to a wallet

```bash
https://wallet.superhero.com/address
  ? x-success=<success-url>
  & x-cancel=<cancel-url>
```
|URL Params|Description|
|--|--|
|`x-success` (required)| This is a callback URL in case user accepts the connection attempt. Callback **must** contain: <br> - `{address}` parameter in order to get current address; <br> - `{networkId}` parameter in order to get current `networkId`.|
|`x-cancel` (required)| This is a callback URL in case user rejected connection attempt.|

### Example

```
https://wallet.superhero.com/address?x-success=https%3A%2F%2Fexample.com%2Fsuccess-connection%3Faddress%3D%7Baddress%7D%26networkdId%3D%7BnetworkId%7D&x-cancel=https%3A%2F%2Fexample.com%2Ffail-connection
```


## Sign a transaction

```bash
https://wallet.superhero.com/sign-transaction
  ? transaction=<Encoding.Transaction>
  & networkId=<string>
  & broadcast=<boolean>
  & replace-caller=<boolean>
  & x-success=<success-url>
  & x-cancel=<cancel-url>
```

|URL Params|Description|
|--|--|
|`transaction` (required)|Valid transaction in [Encoding.Transaction](https://docs.aeternity.com/aepp-sdk-js/latest/api/enums/Encoding.html#Transaction) format `tx_`.|
|`networkId` (required)|The `networkId` identifier of the network which the wallet should sign your transaction with.|
|`broadcast` (optional)| This flag is for sending a signed transaction by the wallet.|
|`replace-caller` (optional)| This flag is used to ensure that the transmitted `transaction` is called using the current address.|
|`x-success` (required)| This is a callback URL in case user signs the transaction. If the `broadcast` flag is: <br> - `false/not set` callback **must** contain `{transaction}` parameter in order to get the signed transaction; <br> - `true` callback can have `{transaction-hash}` of the broadcasted transaction.|
|`x-cancel` (required)| This is a callback URL in case user doesn't sign the transaction. |

### Example of sign transaction deep link creation:

```javascript
const rawTx = await aeSdk.buildTx(transaction);
const query = new URLSearchParams({
    transaction: rawTx,
    networkId: 'ae_uat', // or your network id
    broadcast: "true",
  });
const url = `https://wallet.superhero.com/sign-transaction?${query.toString()}&x-success=<success-url>&x-cancel=<cancel-url>`;
```

### Deep link example

```
# broadcast set to true
https://wallet.superhero.com/sign-transaction?transaction=tx_%2BFEMAaEB915T9XgiInpYtGMJXW2rZXyrgEV0vmLeC%2BH5UnnQkDehAfdeU%2FV4IiJ6WLRjCV1tq2V8q4BFdL5i3gvh%2BVJ50JA3C4YPJvVhyAAAAYAYTgEV&networkId=ae_uat&broadcast=true&x-success=https%3A%2F%2Fexample.com%2Fsuccess-connection%3Ftransaction-hash%3D%7Btransaction-hash%7D&x-cancel=https%3A%2F%2Fexample.com%2Ffail-connection

# broadcast set to false
https://wallet.superhero.com/sign-transaction?transaction=tx_%2BFEMAaEB915T9XgiInpYtGMJXW2rZXyrgEV0vmLeC%2BH5UnnQkDehAfdeU%2FV4IiJ6WLRjCV1tq2V8q4BFdL5i3gvh%2BVJ50JA3C4YPJvVhyAAAAYAYTgEV&networkId=ae_uat&x-success=https%3A%2F%2Fexample.com%2Fsuccess-transaction-signing%3Ftransaction%3D%7Btransaction%7D&x-cancel=https%3A%2F%2Fexample.com%2Ffail-transaction-signing
```

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
|`x-success` (required)| This is a callback URL in case user signs the message. Callback **must** contain: <br> - `{signature}` parameter in order to get signed message; <br> - `{address}` parameter in order to get current address.|
|`x-cancel` (required)| This is a callback URL in case user rejected to sign the message.|

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
|`payload` (required)| Payload is the JWT.|
|`x-success` (required)| This is a callback URL in case user signs the message. Callback **must** contain: <br> - `{signed-payload}` parameter in order to get signed payload; <br> - `{address}` parameter in order to get current address.|
|`x-cancel` (required)| This is a callback URL in case user rejected to sign the message.|

### Example

```
https://wallet.superhero.com/sign-jwt?payload=%7B%22test%22%3A1%7D&x-success=https%3A%2F%2Fexample.com%3Fsigned-payload%3D%7Bsigned-payload%7D&x-cancel=https%3A%2F%2Fexample.com%2Ffail-sign-jwt
```
