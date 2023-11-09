/* eslint-disable class-methods-use-this */

import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import { isAddress } from 'web3-validator';
import { toChecksumAddress, fromWei } from 'web3-utils';
import { privateKeyToAddress } from 'web3-eth-accounts';
import Web3Eth, { NUMBER_DATA_FORMAT, getBalance } from 'web3-eth';
import { BIP32Factory } from 'bip32';

import type {
  AdapterNetworkSettingList,
  ICoin,
  IHdWalletAccount,
  INetworkProtocolSettings,
  ITransaction,
  MarketData,
  NetworkTypeDefault,
  Protocol,
  IFetchTransactionResult,
} from '@/types';
import { PROTOCOL_ETHEREUM } from '@/constants';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import { tg } from '@/popup/plugins/i18n';
import {
  ETH_COIN_NAME,
  ETH_COIN_PRECISION,
  ETH_NETWORK_DEFAULT_SETTINGS,
  ETH_COINGECKO_COIN_ID,
  ETH_CONTRACT_ID,
  ETH_SYMBOL,
  ETH_PROTOCOL_NAME,
} from '@/protocols/ethereum/config';
import { useEthNetworkSettings } from '../composables/ethNetworkSettings';

export class EthereumAdapter extends BaseProtocolAdapter {
  override protocol = PROTOCOL_ETHEREUM as Protocol;

  override protocolName = ETH_PROTOCOL_NAME;

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
    return '0x';
  }

  override getAmountPrecision(): number {
    return ETH_COIN_PRECISION;
  }

  override getCoinSymbol() {
    return ETH_SYMBOL;
  }

  override getCoinGeckoCoinId() {
    return ETH_COINGECKO_COIN_ID;
  }

  override getExplorer() {
    // temp functions to avoid errors
    return {
      prepareUrlForHash(address: string): any {
        return address; // TODO
      },
      prepareUrlForAccount(address: string): any {
        return address; // TODO
      },
    };
  }

  override getUrlTokenKey(): string {
    return ETH_CONTRACT_ID;
  }

  override getDefaultAssetContractId() {
    return ETH_CONTRACT_ID;
  }

  override getDefaultCoin(
    marketData: MarketData,
    convertedBalance?: number,
  ): ICoin {
    // TODO Check if is correct
    return {
      ...(marketData?.[PROTOCOL_ETHEREUM] || {}),
      contractId: ETH_CONTRACT_ID,
      symbol: ETH_SYMBOL,
      decimals: ETH_COIN_PRECISION,
      name: ETH_COIN_NAME,
      convertedBalance,
    };
  }

  override getNetworkSettings() {
    return this.networkSettings;
  }

  override getNetworkTypeDefaultValues(networkType: NetworkTypeDefault): INetworkProtocolSettings {
    return ETH_NETWORK_DEFAULT_SETTINGS[networkType];
  }

  override async fetchBalance(address: string): Promise<string> {
    const { ethActiveNetworkSettings } = useEthNetworkSettings();
    const { nodeUrl } = ethActiveNetworkSettings.value;
    const web3Eth = new Web3Eth(nodeUrl);
    const balanceInWei = await getBalance(web3Eth, address, 'latest', NUMBER_DATA_FORMAT);
    return fromWei(balanceInWei, 'ether').toString();
  }

  override isAccountAddressValid(address: string) {
    return isAddress(address);
  }

  override async isAccountUsed(): Promise<boolean> {
    return false; // TODO
  }

  override getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    const hdNodeWallet = this.bip32.fromSeed(Buffer.from(seed));
    const path = `m/44'/60'/0'/0/${accountIndex}`;
    const childWallet = hdNodeWallet.derivePath(path);

    const address = toChecksumAddress(privateKeyToAddress(childWallet.privateKey!).toString());

    return {
      secretKey: childWallet.privateKey!,
      publicKey: childWallet.publicKey,
      address,
    };
  }

  override async discoverLastUsedAccountIndex() {
    return -1; // TODO
  }

  override async constructAndSignTx() {
    return {} as any; // TODO
  }

  override async getTransactionByHash() {
    return {} as any; // TODO
  }

  override fetchPendingTransactions(): Promise<ITransaction[]> {
    return {} as any; // TODO
  }

  override async fetchTransactions(): Promise<IFetchTransactionResult> {
    // TODO
    return {
      regularTransactions: [],
      pendingTransactions: [],
      tipWithdrawnTransactions: [],
      nextPageParams: null,
    };
  }

  override async spend() {
    return {} as any; // TODO
  }
}
