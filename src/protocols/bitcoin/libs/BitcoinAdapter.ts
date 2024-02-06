/* eslint-disable class-methods-use-this */

import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import { BIP32Factory } from 'bip32';
import {
  payments,
  networks,
  Psbt,
  Transaction,
} from 'bitcoinjs-lib';
import { toOutputScript } from 'bitcoinjs-lib/src/address';
import { toBitcoin, toSatoshi } from 'satoshi-bitcoin';

import type {
  AccountAddress,
  AdapterNetworkSettingList,
  ICoin,
  IFetchTransactionResult,
  IHdWalletAccount,
  INetworkProtocolSettings,
  ITransaction,
  IToken,
  ITransferResponse,
  MarketData,
  NetworkTypeDefault,
  ITransactionApiPaginationParams,
} from '@/types';
import { useNetworks } from '@/composables/networks';
import {
  NETWORK_TYPE_MAINNET,
  NETWORK_TYPE_TESTNET,
  PROTOCOLS,
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
  DUST_AMOUNT,
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
  override protocol = PROTOCOLS.bitcoin;

  override protocolName = 'Bitcoin';

  override protocolSymbol = BTC_SYMBOL;

  override coinName = BTC_COIN_NAME;

  override coinSymbol = BTC_SYMBOL;

  override coinContractId = BTC_CONTRACT_ID;

  override coinPrecision = BTC_COIN_PRECISION;

  override hasTokensSupport = false;

  override mdwToNodeApproxDelayTime = 0;

  private bip32 = BIP32Factory(ecc);

  private networkSettings: AdapterNetworkSettingList = [
    {
      key: 'nodeUrl',
      testId: 'url',
      required: true,
      defaultValue: BTC_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_TESTNET].nodeUrl,
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

  override getExplorer() {
    const { btcActiveNetworkPredefinedSettings } = useBtcNetworkSettings();
    return new Blockstream(btcActiveNetworkPredefinedSettings.value.explorerUrl!);
  }

  override getAmountPrecision(): number {
    return BTC_COIN_PRECISION;
  }

  override getUrlTokenKey(): string {
    return BTC_CONTRACT_ID;
  }

  override getNetworkSettings() {
    return this.networkSettings;
  }

  override getNetworkTypeDefaultValues(networkType: NetworkTypeDefault): INetworkProtocolSettings {
    return BTC_NETWORK_DEFAULT_SETTINGS[networkType];
  }

  override getCoinGeckoCoinId() {
    return BTC_COINGECKO_COIN_ID;
  }

  override getDefaultCoin(
    marketData: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOLS.bitcoin] || {}),
      protocol: PROTOCOLS.bitcoin,
      contractId: this.coinContractId,
      symbol: this.coinSymbol,
      decimals: this.getAmountPrecision(),
      name: BTC_COIN_NAME,
      convertedBalance,
    };
  }

  override async fetchBalance(address: string): Promise<string> {
    const { activeNetwork } = useNetworks();

    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;
    const {
      chain_stats: { funded_txo_sum: chainFunded, spent_txo_sum: chainSpent },
      mempool_stats: { funded_txo_sum: mempoolFunded, spent_txo_sum: mempoolSpent },
    } = await fetchJson(`${nodeUrl}/address/${address}`);
    return toBitcoin(
      Number(chainFunded) - Number(chainSpent) + Number(mempoolFunded) - Number(mempoolSpent),
    ).toString();
  }

  /**
   * `networkType` is required to validate Bitcoin address on non mainnet networks
   * because same account has different addresses on different networks.
   */
  override isAccountAddressValid(address: string, networkType?: NetworkTypeDefault) {
    try {
      const networksMap: Record<NetworkTypeDefault, keyof typeof networks> = {
        [NETWORK_TYPE_MAINNET]: 'bitcoin',
        [NETWORK_TYPE_TESTNET]: 'testnet',
      };
      const btcNetwork = networkType ? networks[networksMap[networkType]] : undefined;
      toOutputScript(address, btcNetwork);
      return true;
    } catch (error) {
      return false;
    }
  }

  override async isAccountUsed(address: string): Promise<boolean> {
    const { activeNetwork } = useNetworks();

    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;
    const { chain_stats: { funded_txo_sum: chainFunded } } = await fetchJson(`${nodeUrl}/address/${address}`);
    return !!chainFunded;
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
      secretKey: child.privateKey!,
      publicKey: child.publicKey,
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

  override async fetchAvailableTokens() {
    return []; // Bitcoin protocol has no fungible tokens
  }

  override async fetchAccountTokenBalances() {
    return []; // Bitcoin protocol has no fungible tokens
  }

  override async fetchPendingTransactions() {
    // TODO if needed
    return [];
  }

  override async fetchTokenInfo(): Promise<IToken | undefined> {
    return undefined;
  }

  override async transferToken() {
    // has no tokens
    return undefined;
  }

  override async fetchAccountTransactions(
    address: AccountAddress,
    { lastTxId }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    const { activeNetwork } = useNetworks();

    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;
    const rawTransactions = await fetchJson(lastTxId
      ? `${nodeUrl}/address/${address}/txs/chain/${lastTxId}`
      : `${nodeUrl}/address/${address}/txs`);
    const regularTransactions: ITransaction[] = rawTransactions.map(
      (t: any) => normalizeTransactionStructure(t, address),
    );

    return {
      regularTransactions,
      paginationParams: {
        lastTxId: regularTransactions[regularTransactions.length - 1]?.hash || undefined,
      },
    };
  }

  /**
   * Bitcoin protocol has only one asset so this is only an alias.
   */
  override async fetchAccountAssetTransactions(
    address: AccountAddress,
    assetContractId: string,
    params?: ITransactionApiPaginationParams,
  ) {
    return this.fetchAccountTransactions(address, params);
  }

  /**
   * @param hash - transaction id
   */
  override async fetchTransactionByHash(hash: string): Promise<ITransaction> {
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
      address: string;
      fee: number;
      publicKey: Buffer;
      secretKey: Buffer;
    },
  ): Promise<Transaction> {
    const { activeNetwork } = useNetworks();

    const network = networks[activeNetwork.value.type as keyof typeof networks] || networks.bitcoin;
    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;

    const amountInSatoshi = toSatoshi(amountInBtc);
    const feeInSatoshi = toSatoshi(options.fee);
    let totalBalance: number = 0;
    let hasSufficientBalance = false;

    const psbt = new Psbt({ network });

    // Fetch all the Unspent transaction outputs
    const utxos = await fetchJson(`${nodeUrl}/address/${options.address}/utxo`);

    /**
     * Fetch raw transaction in hex of only confirmed UTXOs.
     * Filter UTXos from mempool/unconfirmed
     */
    const fullUtxos = await Promise.all(utxos
      .map(async ({ txid, vout, value }: { txid: string; vout: number; value: number }) => {
        const rawTransactionBody = await fetch(`${nodeUrl}/tx/${txid}/hex`);
        return {
          txid,
          vout, // Output vector index
          value, // Amount
          transactionInHex: await rawTransactionBody.text(),
        };
      }));

    // Sort UTXOs by ascending absolute difference from the amount to send
    const spendableUtxos = fullUtxos.sort(
      (a, b) => (
        Math.abs(a.value - amountInSatoshi + feeInSatoshi)
        - Math.abs(b.value - amountInSatoshi + feeInSatoshi)
      ),
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const {
      txid, vout, value, transactionInHex,
    } of spendableUtxos) {
      if (hasSufficientBalance) {
        break;
      }

      const parsedTransaction = Transaction.fromHex(transactionInHex);
      const input = parsedTransaction.outs.at(vout);
      const isSegwit = parsedTransaction.hasWitnesses();

      if (isSegwit) {
        psbt.addInput({
          hash: txid,
          index: vout,
          witnessUtxo: {
            script: input!.script,
            value,
          },
        });
      } else {
        psbt.addInput({
          hash: txid,
          index: vout,
          nonWitnessUtxo: Buffer.from(transactionInHex, 'hex'),
        });
      }

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
    if (totalBalance - (amountInSatoshi + feeInSatoshi) > DUST_AMOUNT) {
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
      address: string;
      fee: number;
      publicKey: Buffer;
      secretKey: Buffer;
    },
  ): Promise<ITransferResponse> {
    const { activeNetwork } = useNetworks();
    const { nodeUrl } = activeNetwork.value.protocols.bitcoin;

    const rawTransaction = (await this.constructAndSignTx(amount, recipient, options)).toHex();

    // Broadcast raw transaction
    const requestOptions = {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
      body: rawTransaction,
      redirect: 'follow' as RequestRedirect,
    };

    const transactionId = await fetch(`${nodeUrl}/tx`, requestOptions)
      .then(async (response) => {
        if (response.status !== 200) {
          throw new Error(await response.text());
        }
        return response.text();
      });
    return {
      hash: transactionId,
    };
  }

  override async waitTransactionMined(): Promise<any> {
    // TODO if needed
  }
}
