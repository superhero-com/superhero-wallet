/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unused-vars */

// eslint-disable-next-line max-classes-per-file
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import { BIP32Factory } from 'bip32';
import {
  payments,
  Psbt,
  Transaction,
} from 'bitcoinjs-lib';
import { toOutputScript } from 'bitcoinjs-lib/src/address';
import ECPairFactory from 'ecpair';

import type {
  AccountAddress,
  AdapterNetworkSettingList,
  ICoin,
  IFetchTransactionResult,
  IHdWalletAccount,
  INetworkProtocolSettings,
  ITransaction,
  ITransferResponse,
  MarketData,
  NetworkTypeDefault,
  ITransactionApiPaginationParams,
  IAccountRaw,
  IAccount,
} from '@/types';
import { useNetworks } from '@/composables/networks';
import {
  ACCOUNT_TYPES,
  PROTOCOLS,
  NETWORK_TYPE_TESTNET,
} from '@/constants';
import { tg } from '@/popup/plugins/i18n';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import { ProtocolExplorer } from '@/lib/ProtocolExplorer';
import {
  DOGE_COIN_PRECISION,
  DOGE_COINGECKO_COIN_ID,
  DOGE_CONTRACT_ID,
  DOGE_NETWORK_ADDITIONAL_SETTINGS,
  DOGE_NETWORK_DEFAULT_SETTINGS,
  DOGE_PROTOCOL_NAME,
  DOGE_SYMBOL,
} from '@/protocols/dogecoin/config';
import { fetchJson, getLastNotEmptyAccountIndex } from '@/utils';
import { useDogeNetworkSettings } from '@/protocols/dogecoin/composables/dogeNetworkSettings';
import { normalizeTransactionStructure } from '@/protocols/bitcoin/helpers';

class DogeExplorer extends ProtocolExplorer {
  constructor(private baseUrl: string) { super(); }

  prepareUrlForAccount(address: string): string { return `${this.baseUrl}/address/${address}`; }

  prepareUrlForHash(hash: string): string | undefined { return `${this.baseUrl}/tx/${hash}`; }
}

export class DogecoinAdapter extends BaseProtocolAdapter {
  private static DOGE_MAINNET = {
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    bech32: null as any,
    bip32: { public: 0x02facafd, private: 0x02fac398 },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e,
  };

  private static DOGE_TESTNET = {
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    bech32: null as any,
    bip32: { public: 0x043587cf, private: 0x04358394 },
    pubKeyHash: 0x71,
    scriptHash: 0xc4,
    wif: 0xf1,
  };

  override protocol = PROTOCOLS.dogecoin;

  override protocolName = DOGE_PROTOCOL_NAME;

  override coinName = DOGE_PROTOCOL_NAME;

  override coinSymbol = DOGE_SYMBOL;

  override coinContractId = DOGE_CONTRACT_ID;

  override coinPrecision = DOGE_COIN_PRECISION;

  override coinGeckoCoinId = DOGE_COINGECKO_COIN_ID;

  override hasTokensSupport = false;

  override mdwToNodeApproxDelayTime = 0;

  private bip32 = BIP32Factory(ecc);

  private networkSettings: AdapterNetworkSettingList = [
    {
      key: 'nodeUrl',
      testId: 'url',
      required: true,
      defaultValue: DOGE_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_TESTNET].nodeUrl,
      getPlaceholder: () => tg('pages.network.networkUrlPlaceholder'),
      getLabel: () => tg('pages.network.networkUrlLabel'),
    },
    {
      key: 'explorerUrl',
      required: true,
      defaultValue: DOGE_NETWORK_ADDITIONAL_SETTINGS[NETWORK_TYPE_TESTNET].explorerUrl,
      getPlaceholder: () => tg('pages.network.explorerUrlPlaceholder'),
      getLabel: () => tg('pages.network.explorerUrlLabel'),
    },
  ];

  override getAccountPrefix() {
    const { activeNetwork } = useNetworks();
    return activeNetwork.value.type === NETWORK_TYPE_TESTNET ? 'n' : 'D';
  }

  override getExplorer(): ProtocolExplorer {
    const {
      dogeActiveNetworkSettings,
      dogeActiveNetworkPredefinedSettings,
    } = useDogeNetworkSettings();
    const baseUrl = dogeActiveNetworkSettings.value.explorerUrl
      ?? dogeActiveNetworkPredefinedSettings.value.explorerUrl;
    return new DogeExplorer(baseUrl);
  }

  override getAmountPrecision(): number { return DOGE_COIN_PRECISION; }

  override getUrlTokenKey(): string { return DOGE_CONTRACT_ID; }

  override getNetworkSettings() { return this.networkSettings; }

  override getNetworkTypeDefaultValues(networkType: NetworkTypeDefault): INetworkProtocolSettings {
    return DOGE_NETWORK_DEFAULT_SETTINGS[networkType];
  }

  override getDefaultCoin(marketData?: MarketData, convertedBalance?: number): ICoin {
    return {
      ...(marketData?.[PROTOCOLS.dogecoin]! || {} as MarketData),
      protocol: PROTOCOLS.dogecoin,
      contractId: this.coinContractId,
      symbol: this.coinSymbol,
      decimals: this.getAmountPrecision(),
      name: this.coinName,
      convertedBalance,
      price: 1,
    };
  }

  override async fetchBalance(address: string): Promise<string> {
    const { activeNetwork } = useNetworks();
    const { nodeUrl } = activeNetwork.value.protocols[PROTOCOLS.dogecoin] as any;
    const info = await fetchJson(`${nodeUrl}/address/${address}`);
    const chainFunded = Number(info?.chain_stats?.funded_txo_sum || 0);
    const chainSpent = Number(info?.chain_stats?.spent_txo_sum || 0);
    const memFunded = Number(info?.mempool_stats?.funded_txo_sum || 0);
    const memSpent = Number(info?.mempool_stats?.spent_txo_sum || 0);
    const sat = chainFunded - chainSpent + memFunded - memSpent;
    return (sat / 1e8).toString();
  }

  override isAccountAddressValid(address: string, networkType?: NetworkTypeDefault) {
    try {
      toOutputScript(
        address,
        networkType === NETWORK_TYPE_TESTNET
          ? DogecoinAdapter.DOGE_TESTNET
          : DogecoinAdapter.DOGE_MAINNET,
      );
      return true;
    } catch (_eTest) { return false; }
  }

  override isValidAddressOrNameEncoding(address: string, networkType?: NetworkTypeDefault) {
    return this.isAccountAddressValid(address, networkType);
  }

  override async isAccountUsed(address: string): Promise<boolean> {
    try {
      const { activeNetwork } = useNetworks();
      const { nodeUrl } = activeNetwork.value.protocols[PROTOCOLS.dogecoin] as any;
      const utxos = await fetchJson(`${nodeUrl}/address/${address}`);
      const count = Number(utxos?.chain_stats?.tx_count || 0);
      return count > 0;
    } catch { return false; }
  }

  override getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    const node = this.bip32.fromSeed(Buffer.from(seed));
    const path = `m/44'/3'/${accountIndex}'/0/0`;
    const child = node.derivePath(path);
    const { activeNetwork } = useNetworks();
    const isTestnet = activeNetwork.value.type === NETWORK_TYPE_TESTNET;
    const { address } = payments.p2pkh({
      pubkey: child.publicKey,
      network: (isTestnet ? DogecoinAdapter.DOGE_TESTNET : DogecoinAdapter.DOGE_MAINNET) as any,
    });
    return {
      secretKey: child.privateKey!,
      publicKey: child.publicKey,
      address: address!,
    };
  }

  override resolveAccountRaw(
    rawAccount: IAccountRaw,
    idx: number,
    globalIdx: number,
    seed?: Uint8Array,
  ): IAccount | null {
    if (rawAccount.type === ACCOUNT_TYPES.privateKey && rawAccount.privateKey) {
      const ECPair = ECPairFactory(ecc);
      const account = ECPair.fromPrivateKey(Buffer.from(rawAccount.privateKey));
      const { activeNetwork } = useNetworks();
      const isTestnet = activeNetwork.value.type === NETWORK_TYPE_TESTNET;
      const { address } = payments.p2pkh({
        pubkey: account.publicKey,
        network: (isTestnet ? DogecoinAdapter.DOGE_TESTNET : DogecoinAdapter.DOGE_MAINNET) as any,
      });
      return {
        idx,
        globalIdx,
        secretKey: Buffer.from(rawAccount.privateKey!),
        ...rawAccount,
        publicKey: account.publicKey,
        privateKey: undefined,
        address: address!,
      };
    }
    if (rawAccount.type === ACCOUNT_TYPES.hdWallet && seed) {
      const hd = this.getHdWalletAccountFromMnemonicSeed(seed, idx);
      return {
        globalIdx, idx, ...rawAccount, ...hd,
      };
    }
    return null;
  }

  override async discoverLastUsedAccountIndex(seed: Uint8Array): Promise<number> {
    return getLastNotEmptyAccountIndex(
      this.isAccountUsed,
      this.getHdWalletAccountFromMnemonicSeed.bind(this),
      seed,
    );
  }

  override async fetchAccountTransactions(
    address: AccountAddress,
    { lastTxId }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    const { activeNetwork } = useNetworks();
    const { nodeUrl } = activeNetwork.value.protocols[PROTOCOLS.dogecoin] as any;
    const list = await fetchJson(`${nodeUrl}/address/${address}/txs`);
    const rawTransactions: any[] = Array.isArray(list) ? list : [];
    const regularTransactions: ITransaction[] = rawTransactions.map(
      (t: any) => normalizeTransactionStructure(t, address, PROTOCOLS.dogecoin),
    );
    return {
      regularTransactions,
      paginationParams: {
        lastTxId: regularTransactions.at(-1)?.hash || lastTxId,
      },
    };
  }

  override async fetchAccountAssetTransactions(
    address: AccountAddress,
    _assetContractId: string,
    params?: ITransactionApiPaginationParams,
  ) { return this.fetchAccountTransactions(address, params); }

  override async fetchTransactionByHash(
    hash: string,
    transactionOwner?: string,
  ): Promise<ITransaction> {
    const { activeNetwork } = useNetworks();
    const { nodeUrl } = activeNetwork.value.protocols[PROTOCOLS.dogecoin] as any;
    const raw = await fetchJson(`${nodeUrl}/tx/${hash}`);
    const t = raw || {};
    return normalizeTransactionStructure(t, transactionOwner, PROTOCOLS.dogecoin);
  }

  async constructAndSignTx(
    amountInDoge: number,
    recipient: string,
    options: { address: string; fee: number; publicKey: Buffer; secretKey: Buffer },
  ): Promise<Transaction> {
    const { activeNetwork } = useNetworks();
    const { nodeUrl } = activeNetwork.value.protocols[PROTOCOLS.dogecoin] as any;

    const network = activeNetwork.value.type === NETWORK_TYPE_TESTNET
      ? DogecoinAdapter.DOGE_TESTNET
      : DogecoinAdapter.DOGE_MAINNET;

    const amountInSatoshi = Math.round(amountInDoge * 1e8);
    const feeInSatoshi = Math.round(options.fee * 1e8);

    const utxos = await fetchJson(`${nodeUrl}/address/${options.address}/utxo`);
    const fullUtxos = await Promise.all((utxos || []).map(async (u: any) => {
      const { txid, vout, value } = u;
      const hex = await fetch(`${nodeUrl}/tx/${txid}/hex`).then((r) => r.text());
      return {
        txid, vout, value, transactionInHex: hex,
      };
    }));

    const sorted = fullUtxos.sort((a, b) => (
      Math.abs(a.value - amountInSatoshi + feeInSatoshi)
      - Math.abs(b.value - amountInSatoshi + feeInSatoshi)
    ));

    let total = 0;
    let enough = false;
    const psbt = new Psbt({ network: network as any });

    // eslint-disable-next-line no-restricted-syntax
    for (const {
      txid, vout, value, transactionInHex,
    } of sorted) {
      if (enough) break;
      psbt.addInput({ hash: txid, index: vout, nonWitnessUtxo: Buffer.from(transactionInHex, 'hex') });
      total += value;
      if (total >= amountInSatoshi + feeInSatoshi) enough = true;
    }

    if (!enough) throw new Error('Insufficient balance');

    psbt.addOutput({ address: recipient, value: amountInSatoshi });
    const change = total - amountInSatoshi - feeInSatoshi;
    if (change > 0) psbt.addOutput({ address: options.address, value: change });

    const signer = ECPairFactory(ecc).fromPrivateKey(Buffer.from(options.secretKey));
    for (let i = 0; i < psbt.inputCount; i += 1) psbt.signInput(i, signer);
    psbt.finalizeAllInputs();
    return psbt.extractTransaction();
  }

  async spend(
    amount: number,
    recipient: string,
    options: { address: string; fee: number; publicKey: Buffer; secretKey: Buffer },
  ): Promise<ITransferResponse> {
    const { activeNetwork } = useNetworks();
    const { nodeUrl } = activeNetwork.value.protocols[PROTOCOLS.dogecoin] as any;
    const raw = (await this.constructAndSignTx(amount, recipient, options)).toHex();
    const res = await fetch(`${nodeUrl}/tx`, {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'text/plain' }),
      body: raw,
      redirect: 'follow' as RequestRedirect,
    });
    if (res.status !== 200) throw new Error(await res.text());
    const txid = await res.text();
    return { hash: txid };
  }

  override waitTransactionMined(hash: string): Promise<any> {
    const TRANSACTION_POLLING_INTERVAL = 5000;
    const TRANSACTION_POLLING_MAX_ATTEMPTS = 10;
    return new Promise((resolve) => {
      let attemptNo = 0;
      const interval = setInterval(async () => {
        attemptNo += 1;
        const isLastAttempt = attemptNo >= TRANSACTION_POLLING_MAX_ATTEMPTS;
        const tx = await this.fetchTransactionByHash(hash);
        if (tx) {
          clearInterval(interval);
          return resolve(tx);
        }
        if (isLastAttempt) {
          clearInterval(interval);
          return resolve(null);
        }
        return null;
      }, TRANSACTION_POLLING_INTERVAL);
    });
  }
}
