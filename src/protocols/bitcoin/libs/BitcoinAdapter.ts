/* eslint-disable class-methods-use-this */

import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import { BIP32Factory } from 'bip32';
import {
  payments,
  networks,
  Psbt,
} from 'bitcoinjs-lib';
import { toSatoshi, toBitcoin } from 'satoshi-bitcoin';
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
  MAXIMUM_ACCOUNTS_TO_DISCOVER,
  NETWORK_TYPE_TESTNET,
  PROTOCOL_BITCOIN,
} from '@/constants';
import { tg } from '@/store/plugins/languages';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import {
  BTC_COIN_NAME,
  BTC_COIN_PRECISION,
  BTC_NETWORK_DEFAULT_SETTINGS,
  BTC_COINGECKO_COIN_ID,
  BTC_CONTRACT_ID,
  BTC_SYMBOL,
} from '@/protocols/bitcoin/config';
import { fetchJson } from '@/utils';
import { normalizeTransactionStructure } from '@/protocols/bitcoin/helpers';
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

    // eslint-disable-next-line camelcase
    const { chain_stats: { funded_txo_sum, spent_txo_sum } } = await fetchJson(`${nodeUrl}/address/${address}`);
    return toBitcoin(Number(funded_txo_sum) - Number(spent_txo_sum)).toString();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async isAccountUsed(address: string): Promise<boolean> {
    // TODO: Implement this
    return true;
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

  override async discoverAccounts(seed: Uint8Array): Promise<number> {
    let lastNotEmptyIdx = 0;

    for (let i = 0; i < MAXIMUM_ACCOUNTS_TO_DISCOVER; i += 1) {
      const account = this.getHdWalletAccountFromMnemonicSeed(seed, i);
      // eslint-disable-next-line no-await-in-loop
      if (await this.isAccountUsed(account.publicKey)) {
        lastNotEmptyIdx = i;
      }
    }
    return lastNotEmptyIdx;
  }

  async fetchTransactions(address: string, lastTxId?: string) {
    const { activeNetwork } = useNetworks();

    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;
    const rawTransactions = await fetchJson(lastTxId
      ? `${nodeUrl}/address/${address}/txs/chain/${lastTxId}`
      : `${nodeUrl}/address/${address}/txs`);
    return rawTransactions.map((t: any) => normalizeTransactionStructure(t, address));
  }

  async getTransactionByHash(hash: string) { // it is not actually a hash it's an id
    const { activeNetwork } = useNetworks();

    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;
    const rawTransaction = await fetchJson(`${nodeUrl}/tx/${hash}`);
    return normalizeTransactionStructure(rawTransaction);
  }

  async constructAndSignTx(
    amount: number,
    recipient: string,
    options: {
      address: string,
      fee: number,
      publicKey: Buffer,
      secretKey: Buffer,
    },
  ): Promise<any> {
    const { activeNetwork } = useNetworks();

    const network = networks[activeNetwork.value.type as keyof typeof networks] || networks.bitcoin;
    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;

    let totalBalance: number = 0;
    const amountInSathoshi = toSatoshi(amount);

    const psbt = new Psbt({ network });

    const utxos = await fetchJson(`${nodeUrl}/address/${options.address}/utxo`);
    const txFetchPromises = utxos.map(({ txid }: { txid: string }) => fetchJson(`${nodeUrl}/tx/${txid}`));
    const txs = await Promise.all(txFetchPromises);

    utxos.forEach(
      ({ txid, vout, value }: {txid: string, vout: number, value: number}, index: number) => {
        const tx = txs[index];

        if (!(tx.vout[vout] && tx.vout[vout].scriptpubkey)) {
          throw new Error('Missing data from the fetched input transactions');
        }

        const { scriptpubkey } = tx.vout[vout];

        psbt.addInput({
          hash: txid,
          index: vout,
          witnessUtxo: {
            script: Buffer.from(scriptpubkey, 'hex'),
            value,
          },
        });
        totalBalance += value;
      },
    );

    if (amountInSathoshi + toSatoshi(options.fee) > totalBalance) {
      throw new Error('Insufficient balance');
    }

    psbt.addOutput({
      address: recipient,
      value: amountInSathoshi,
    });
    psbt.addOutput({
      address: options.address,
      value: totalBalance - amountInSathoshi - toSatoshi(options.fee),
    });
    await psbt.signAllInputs(new BitcoinTransactionSigner(options.secretKey, options.publicKey));
    await psbt.finalizeAllInputs();
    const rawTx = psbt.extractTransaction();
    return rawTx;
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

    const rawTx = (await this.constructAndSignTx(amount, recipient, options)).toHex();

    const requestOptions = {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
      body: rawTx,
      redirect: 'follow' as RequestRedirect,
    };

    const transactionId = await fetch(`${nodeUrl}/tx`, requestOptions)
      .then((response) => response.text());
    return {
      hash: transactionId,
    };
  }
}
