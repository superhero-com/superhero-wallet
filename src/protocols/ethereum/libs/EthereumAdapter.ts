/* eslint-disable class-methods-use-this */

import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import { isAddress } from 'web3-validator';
import { toChecksumAddress, fromWei, toWei } from 'web3-utils';
import {
  privateKeyToAddress,
  FeeMarketEIP1559Transaction,
  FeeMarketEIP1559TxData,
  bigIntToHex,
} from 'web3-eth-accounts';
import Web3Eth, {
  NUMBER_DATA_FORMAT,
  getBalance,
  getTransactionCount,
  sendSignedTransaction,
} from 'web3-eth';
import { DEFAULT_RETURN_FORMAT } from 'web3-types';
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
  IAccount,
} from '@/types';
import { PROTOCOL_ETHEREUM } from '@/constants';
import { getLastNotEmptyAccountIndex } from '@/utils';
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
  ETH_GAS_LIMIT,
} from '@/protocols/ethereum/config';
import { useEthNetworkSettings } from '../composables/ethNetworkSettings';
import { Etherscan } from './Etherscan';

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
    {
      key: 'chainId',
      required: true,
      validationRules: {
        invalid_hostname: false,
        is_hex_format: true,
      },
      getPlaceholder: () => tg('pages.network.chainIdPlaceholder'),
      getLabel: () => tg('pages.network.chainIdLabel'),
    },
  ];

  async getTransactionCount(address: string): Promise<number> {
    const { ethActiveNetworkSettings } = useEthNetworkSettings();
    const { nodeUrl } = ethActiveNetworkSettings.value;
    const web3Eth = new Web3Eth(nodeUrl);
    const txCount = await getTransactionCount(web3Eth, address, 'pending', NUMBER_DATA_FORMAT);
    return txCount;
  }

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
    const { ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();

    return new Etherscan(ethActiveNetworkPredefinedSettings.value.explorerUrl!);
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

  override async isAccountUsed(address: string): Promise<boolean> {
    const [balance, txCount] = await Promise.all([
      await this.fetchBalance(address),
      this.getTransactionCount(address),
    ]);

    return (parseFloat(balance) > 0 || txCount > 0);
  }

  override getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    const hdNodeWallet = this.bip32.fromSeed(Buffer.from(seed));
    const path = `m/44'/60'/${accountIndex}'/0/0`;
    const childWallet = hdNodeWallet.derivePath(path);

    const address = toChecksumAddress(privateKeyToAddress(childWallet.privateKey!).toString());

    return {
      secretKey: childWallet.privateKey!,
      publicKey: childWallet.publicKey,
      address,
    };
  }

  override async discoverLastUsedAccountIndex(seed: Uint8Array): Promise<number> {
    return getLastNotEmptyAccountIndex(
      this.isAccountUsed.bind(this),
      this.getHdWalletAccountFromMnemonicSeed.bind(this),
      seed,
    );
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

  override async spend(
    amount: number,
    recipient: string,
    options: {
      fromAccount: IAccount;
      maxPriorityFeePerGas: string;
      maxFeePerGas: string;
    },
  ): Promise<{ hash: string }> {
    const { ethActiveNetworkSettings } = useEthNetworkSettings();
    const { nodeUrl, chainId } = ethActiveNetworkSettings.value;
    const web3Eth = new Web3Eth(nodeUrl);
    const nonce = await this.getTransactionCount(options.fromAccount.address!);

    const hexAmount = bigIntToHex(BigInt(toWei(amount, 'ether')));
    const maxPriorityFeePerGas = bigIntToHex(BigInt(toWei(options.maxPriorityFeePerGas, 'ether')));
    const maxFeePerGas = bigIntToHex(BigInt(toWei(options.maxFeePerGas, 'ether')));

    // All values are in wei
    const txData: FeeMarketEIP1559TxData = {
      chainId,
      nonce,
      to: recipient,
      value: hexAmount,
      data: '0x',
      maxPriorityFeePerGas,
      maxFeePerGas,
      gasLimit: `0x${ETH_GAS_LIMIT.toString(16)}`,
      type: '0x02',
    };

    const tx = FeeMarketEIP1559Transaction.fromTxData(txData);

    const signedTx = tx.sign(options.fromAccount.secretKey);

    const serializedTx = signedTx.serialize();
    const res = await sendSignedTransaction(web3Eth, serializedTx, DEFAULT_RETURN_FORMAT);

    return { hash: res.transactionHash };
  }
}
