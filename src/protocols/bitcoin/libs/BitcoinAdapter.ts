/* eslint-disable class-methods-use-this */

import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import { BIP32Factory } from 'bip32';
import {
  payments,
  networks,
  Psbt,
  Transaction,
  script as ScriptCompiler,
} from 'bitcoinjs-lib';
import { toBitcoin, toSatoshi } from 'satoshi-bitcoin';

import type {
  AdapterNetworkSettingList,
  ICoin,
  IHdWalletAccount,
  INetworkProtocolSettings,
  MarketData,
  NetworkTypeDefault,
} from '@/types';
import { useNetworks } from '@/composables/networks';
import {
  NETWORK_TYPE_TESTNET,
  PROTOCOL_BITCOIN,
} from '@/constants';
import { tg } from '@/popup/plugins/i18n';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import {
  BTC_COIN_NAME,
  BTC_COIN_PRECISION,
  BTC_NETWORK_DEFAULT_SETTINGS,
  BTC_COINGECKO_COIN_ID,
  BTC_CONTRACT_ID,
  BTC_SYMBOL,
} from '@/protocols/bitcoin/config';
import {
  getLastNotEmptyAccountIndex,
  fetchJson,
} from '@/utils';
import { normalizeTransactionStructure } from '@/protocols/bitcoin/helpers';
import { Blockstream } from '@/protocols/bitcoin/libs/Blockstream';
import { useBtcNetworkSettings } from '@/protocols/bitcoin/composables/btcNetworkSettings';
import { BitcoinTransactionSigner } from './BitcoinTransactionSigner';

export class BitcoinAdapter extends BaseProtocolAdapter {
  protocolName = 'Bitcoin';

  bip32 = BIP32Factory(ecc);

  networkSettings: AdapterNetworkSettingList = [
    {
      key: 'nodeUrl',
      testId: 'url',
      getPlaceholder: () => tg('pages.network.networkUrlPlaceholder'),
      getLabel: () => tg('pages.network.networkUrlLabel'),
    },
  ];

  override getAccountPrefix() {
    const { activeNetwork } = useNetworks();

    return (activeNetwork.value.type === NETWORK_TYPE_TESTNET)
      ? 'tb1q'
      : 'bc1q';
  }

  override getExplorer(): any {
    const { btcActiveNetworkPredefinedSettings } = useBtcNetworkSettings();

    return new Blockstream(btcActiveNetworkPredefinedSettings.value.explorerUrl!);
  }

  override getAmountPrecision(): number {
    return BTC_COIN_PRECISION;
  }

  override getCoinSymbol() {
    return BTC_SYMBOL;
  }

  getNetworkSettings() {
    return this.networkSettings;
  }

  getNetworkTypeDefaultValues(networkType: NetworkTypeDefault): INetworkProtocolSettings {
    return BTC_NETWORK_DEFAULT_SETTINGS[networkType];
  }

  override getCoinGeckoCoinId() {
    return BTC_COINGECKO_COIN_ID;
  }

  override getDefaultAssetContractId() {
    return BTC_CONTRACT_ID;
  }

  override getDefaultCoin(
    marketData: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOL_BITCOIN] || {}),
      contractId: BTC_CONTRACT_ID,
      symbol: BTC_SYMBOL,
      decimals: BTC_COIN_PRECISION,
      name: BTC_COIN_NAME,
      convertedBalance,
    };
  }

  override async fetchBalance(address: string): Promise<string> {
    const { activeNetwork } = useNetworks();

    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;
    const { confirmed, unconfirmed } = await fetchJson(`${nodeUrl}/address/${address}/balance`);
    return toBitcoin(confirmed + unconfirmed).toString();
  }

  override async isAccountUsed(address: string): Promise<boolean> {
    const { activeNetwork } = useNetworks();

    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;
    const txs = await fetchJson(`${nodeUrl}/address/${address}/txs`);
    return txs.length > 0;
  }

  override getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    const { activeNetwork } = useNetworks();

    const network = networks[activeNetwork.value.type as keyof typeof networks] || networks.bitcoin;
    const pathCoinType = activeNetwork.value.type === NETWORK_TYPE_TESTNET ? 1 : 0;

    const node = this.bip32.fromSeed(Buffer.from(seed));
    const path = `m/84'/${pathCoinType}'/${accountIndex}'/0/0`; // 84 for Native-SegWit and 44 for Legacy
    const child = node.derivePath(path);
    const { address } = payments.p2wpkh({ // p2wpkh for Native-Segwit and p2pkh for Legacy
      pubkey: child.publicKey,
      network,
    });

    return {
      secretKey: child.privateKey as any,
      publicKey: child.publicKey as any,
      address: address!,
    };
  }

  override async discoverLastUsedAccountIndex(seed: Uint8Array): Promise<number> {
    return getLastNotEmptyAccountIndex(
      this.isAccountUsed,
      this.getHdWalletAccountFromMnemonicSeed.bind(this),
      seed,
    );
  }

  async fetchTransactions(address: string, lastTxId?: string) {
    const { activeNetwork } = useNetworks();

    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;
    const rawTransactions = await fetchJson(lastTxId
      ? `${nodeUrl}/address/tx/${lastTxId}`
      : `${nodeUrl}/address/${address}/txs`);
    return rawTransactions.map((t: any) => normalizeTransactionStructure(t, address));
  }

  async getTransactionByHash(hash: string) { // it is not actually a hash it's an id
    const { activeNetwork } = useNetworks();

    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;
    const rawTransaction = await fetchJson(`${nodeUrl}/tx/${hash}`);
    return normalizeTransactionStructure(rawTransaction);
  }

  /**
   * Construct and sign raw bitcoin transaction
   * @param amountInBtc
   * @param recipient
   * @param options.address Sender address
   * @param options.fee Transaction Fee
   * @param options.publicKey Public key of the sender
   * @param options.secretKey Secret key of the sender associated with address and the public key
   * @returns Transaction
   */
  async constructAndSignTx(
    amountInBtc: number,
    recipient: string,
    options: {
      address: string,
      fee: number,
      publicKey: Buffer,
      secretKey: Buffer,
    },
  ): Promise<Transaction> {
    const { activeNetwork } = useNetworks();

    const network = networks[activeNetwork.value.type as keyof typeof networks] || networks.bitcoin;
    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;

    const psbt = new Psbt({ network });

    // Fetch all the Unspent transaction outputs
    const utxos = await fetchJson(`${nodeUrl}/address/${options.address}/?unspent=true`);

    const amountInSatoshi = toSatoshi(amountInBtc);
    const feeInSatoshi = toSatoshi(options.fee);
    let totalBalance: number = 0;
    let hasSufficientBalance = false;

    // eslint-disable-next-line no-restricted-syntax
    for (const {
      mintTxid, mintIndex, value, script,
    } of utxos) {
      /**
       * Use minimum number of UTXOs for this transaction
       * TODO: Select minimum number of UTXOs based on the amount and the input size
       */
      if (hasSufficientBalance) {
        break;
      }

      // Get the witness script for the unspent output.
      const witnessScript = ScriptCompiler.fromASM(script);

      psbt.addInput({
        hash: mintTxid,
        index: mintIndex,
        witnessUtxo: {
          script: witnessScript,
          value,
        },
      });

      totalBalance += value;

      if (totalBalance >= amountInSatoshi + feeInSatoshi) {
        hasSufficientBalance = true;
      }
    }

    if (!hasSufficientBalance) {
      throw new Error('Insufficient balance');
    }

    // Add recipient output
    psbt.addOutput({
      address: recipient,
      value: amountInSatoshi,
    });

    // Transfer the rest of the balance back to the senders address
    if (totalBalance - amountInSatoshi - feeInSatoshi > 0) {
      psbt.addOutput({
        address: options.address,
        value: totalBalance - amountInSatoshi - feeInSatoshi,
      });
    }

    await psbt.signAllInputs(new BitcoinTransactionSigner(options.secretKey, options.publicKey));
    await psbt.finalizeAllInputs();
    return psbt.extractTransaction();
  }

  async spend(
    amount: number,
    recipient: string,
    options: {
      address: string,
      fee: number,
      publicKey: Buffer,
      secretKey: Buffer,
    },
  ): Promise<{ hash: string }> {
    const { activeNetwork } = useNetworks();
    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;

    const requestBody = {
      rawTx: (await this.constructAndSignTx(amount, recipient, options)).toHex(),
    };

    // Broadcast raw transaction
    const requestOptions = {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
      body: JSON.stringify(requestBody),
      redirect: 'follow' as RequestRedirect,
    };

    const response = await fetch(`${nodeUrl}/tx/send`, requestOptions)
      .then(async (rawResponse) => {
        if (response.status !== 200) {
          throw new Error(await rawResponse.text());
        }
        return rawResponse.json();
      });
    return {
      hash: response.txid,
    };
  }
}
