# Using Superhero Wallet

These steps apply to the standalone Superhero Wallet extension, hosted wallet, and mobile apps. For installation and the separate wallet built into superhero.com, see [Choosing a wallet](https://developer.superhero.com/wallets/choosing-a-wallet/). Check [chain and platform support](compatibility.md) before choosing a network, token, or signing device.

## Receive a payment

1. In **More → Wallet settings → Network**, select the network you and the sender intend to use. Choose the account for the blockchain you want to receive on. For example, Ethereum and BNB Smart Chain can both use an address beginning with `0x`. Give the sender the chain name as well as the address.
2. Open **Receive** on that account. Copy the address or show the QR code. To request a particular amount, enter it and choose the asset if the form offers a selector. The copy button and QR then share a payment request that can open the sender’s transfer form. That link opens in Superhero Wallet. For a sender using another wallet or an exchange, leave the amount empty and share the plain address.
3. Compare the recipient address, network, and asset with the sender. The sender still reviews and signs the transfer. You can follow a submitted payment using its transaction hash.

## Send and check a transfer

1. Select the sending account and network, open **Send**, and choose the asset. Paste the recipient address or scan the recipient’s request. Review the recipient and amount even when a link filled them in.
2. Check the fee and its currency on the review screen. For example, sending an ERC-20 token on Ethereum requires ETH in the sending account to pay for gas. If the wallet reports insufficient funds, check both the token balance and the available native coin on that network.
3. Confirm the transfer. In the account’s transaction history, open the entry and copy its hash. Use the explorer for the same network to check whether it has been included in a block.

If the explorer shows a confirmed transaction while the wallet still shows **Pending**, check the wallet’s connection status before sending again. On æternity the node can accept a transaction before the middleware indexes it. A sender who has only signed a transaction or shared a payment request may still need to broadcast it. [Service status and troubleshooting](services.md)

## Review a connected app

Check the website and account in the connection prompt before sharing an address. **Remember me** in that prompt is checked by default. It lets the site reconnect without asking, and one approval covers both its æternity and EVM addresses. Under **Wallet settings → Permissions**, select a saved site to review or remove its permissions: **Don't ask for login requests**, **Don't ask for list of all addresses**, **Auto-sign messages** and **Daily spending limit without asking** (AE transfers and name claims only). **Auto-sign messages** signs that site's messages without a prompt, and the daily limit can approve eligible æternity transactions without one. Removing a site doesn't end an æternity session already open in a tab, so reload that tab. A WalletConnect pairing also has a **Disconnect** action on the wallet’s WalletConnect screen. On-chain token allowances can outlive a wallet connection. [Wallet permissions and token approvals](https://developer.superhero.com/wallets/security/)

## Move to a new device or reset the wallet

Before using **Wallet settings → Reset wallet**, identify how each account was added. If the old wallet is still accessible, compare the public addresses on the new device before clearing the old one. [Backup and recovery](https://developer.superhero.com/wallets/backup-and-recovery/)

| What you want to keep | What to do |
|---|---|
| Accounts derived from the wallet seed | Back up and verify the seed phrase. On the new device, choose **Restore existing wallet** and enter the words in order. |
| An account imported with a private key | Back up that account’s private key separately and import it again for its blockchain. |
| Ledger or AirGap accounts | Keep the signing device and its own recovery backup. Pair or import the accounts from the device again on a supported platform. |
| Unclaimed gift cards | On Mainnet or Testnet, open **More → Gift cards** and use **Claim back** for any remaining funds, or keep each funded gift card link private. Each link contains a separate key that controls its balance. Restoring the wallet seed does not recreate those links. |
| A pending `.chain` name registration | Keep the old wallet available on the registration network until the claim transaction is confirmed. Reset deletes the locally stored salt required to claim the name. The seed cannot recover it. A name auction can continue after the claim is confirmed. |
| Address book | Export the JSON file from **Address book** before resetting. Use the import action on the new device. Keep this file private because it associates contacts with addresses. |

After every restore, compare the addresses with your records on the original blockchain and network. Discovery can miss a used account after five consecutive unused addresses or a failed Dogecoin lookup, even without a warning. On æternity and the EVM chains, an account that only ever received tokens counts as unused and can be skipped. If you see **Some accounts may be missing**, check connectivity and the selected network. For a missing seed-derived account, use **Add account** on its original blockchain to derive accounts in order until the address matches. For imported keys and signing devices, use the corresponding steps above.

## Send from an æternity multisig vault

1. From an æternity account, open **Add account → Create multisig vault**. Add the authorized signer addresses and choose how many approvals a payment requires. Review the creation fee. Fund the vault with AE for the transfer and its fees. Each signer who submits a proposal or an approval also needs AE in their own account to pay for that contract call.
2. Select the vault and propose an AE payment. Each required signer opens the pending proposal in their wallet, checks the destination and amount, and approves. The proposal shows the approval count and expiry.
3. Once the threshold is reached, an authorized signer opens the approved proposal and selects **Send** to broadcast it. **Waiting to be sent** means that last action is still outstanding. Check the resulting transaction in the history.

For signing or device problems, use the [wallet troubleshooting guide](https://developer.superhero.com/wallets/troubleshooting/). The [support guide](https://developer.superhero.com/resources/support/) explains what to include in a report and where to send a private security disclosure.
