/* eslint-disable class-methods-use-this */

import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import { isAddress } from 'web3-validator';
import { toChecksumAddress, fromWei, toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
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
  getTransaction,
  sendSignedTransaction,
  getBlock,
} from 'web3-eth';
import { DEFAULT_RETURN_FORMAT } from 'web3-types';
import { BIP32Factory } from 'bip32';

import type {
  AccountAddress,
  AdapterNetworkSettingList,
  AssetContractId,
  ICoin,
  IFetchTransactionResult,
  IHdWalletAccount,
  INetworkProtocolSettings,
  IToken,
  ITokenBalance,
  ITransaction,
  ITransactionApiPaginationParams,
  ITransferResponse,
  MarketData,
  NetworkTypeDefault,
} from '@/types';
import { PROTOCOLS } from '@/constants';
import { getLastNotEmptyAccountIndex } from '@/utils';
import Logger from '@/lib/logger';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import { tg } from '@/popup/plugins/i18n';
import {
  ERC20_ABI,
  ETH_COIN_NAME,
  ETH_COIN_PRECISION,
  ETH_COINGECKO_COIN_ID,
  ETH_CONTRACT_ID,
  ETH_GAS_LIMIT,
  ETH_NETWORK_DEFAULT_SETTINGS,
  ETH_NETWORK_DEFAULT_ENV_SETTINGS,
  ETH_PROTOCOL_NAME,
  ETH_SYMBOL,
} from '@/protocols/ethereum/config';
import { useAccounts } from '@/composables';
import { useEthNetworkSettings } from '../composables/ethNetworkSettings';
import { EtherscanExplorer } from './EtherscanExplorer';
import { EtherscanService } from './EtherscanService';
import { normalizeWeb3EthTransactionStructure } from '../helpers';
import { EthplorerService } from './EthplorerService';

export class EthereumAdapter extends BaseProtocolAdapter {
  override protocol = PROTOCOLS.ethereum;

  override protocolName = ETH_PROTOCOL_NAME;

  override protocolSymbol = ETH_SYMBOL;

  override coinName = ETH_COIN_NAME;

  override coinSymbol = ETH_SYMBOL;

  override coinContractId = ETH_CONTRACT_ID;

  override coinPrecision = ETH_COIN_PRECISION;

  override hasTokensSupport = true;

  private bip32 = BIP32Factory(ecc);

  private networkSettings: AdapterNetworkSettingList = [
    {
      key: 'nodeUrl',
      testId: 'url',
      defaultValue: ETH_NETWORK_DEFAULT_ENV_SETTINGS.nodeUrl,
      getPlaceholder: () => tg('pages.network.networkUrlPlaceholder'),
      getLabel: () => tg('pages.network.networkUrlLabel'),
    },
    {
      key: 'chainId',
      defaultValue: ETH_NETWORK_DEFAULT_ENV_SETTINGS.chainId,
      validationRules: {
        url: false,
        is_hex_format: true,
      },
      getPlaceholder: () => tg('pages.network.chainIdPlaceholder'),
      getLabel: () => tg('pages.network.chainIdLabel'),
    },
  ];

  async getTransactionCount(address: string): Promise<number> {
    const web3Eth = this.getWeb3EthInstance();
    const txCount = await getTransactionCount(web3Eth, address, 'pending', NUMBER_DATA_FORMAT);
    return txCount;
  }

  override getAccountPrefix() {
    return '0x';
  }

  override getAmountPrecision(): number {
    return 9;
  }

  override getCoinGeckoCoinId() {
    return ETH_COINGECKO_COIN_ID;
  }

  override getExplorer() {
    const { ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();
    return new EtherscanExplorer(ethActiveNetworkPredefinedSettings.value.explorerUrl!);
  }

  override getUrlTokenKey(): string {
    return ETH_CONTRACT_ID;
  }

  override getDefaultCoin(
    marketData: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOLS.ethereum] || {}),
      protocol: PROTOCOLS.ethereum,
      contractId: this.coinContractId,
      symbol: this.coinSymbol,
      decimals: this.getAmountPrecision(),
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

  override async fetchBalance(address: AccountAddress): Promise<string> {
    const web3Eth = this.getWeb3EthInstance();
    const balanceInWei = await getBalance(web3Eth, address, 'latest', NUMBER_DATA_FORMAT);
    return fromWei(balanceInWei, 'ether').toString();
  }

  override isAccountAddressValid(address: AccountAddress) {
    return isAddress(address);
  }

  override async isAccountUsed(address: AccountAddress): Promise<boolean> {
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
    // TODO if needed
    return {} as any;
  }

  override async fetchAvailableTokens(): Promise<IToken[] | null> {
    const { ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();
    const apiUrl = ethActiveNetworkPredefinedSettings.value.tokenMiddlewareUrl;
    try {
      // Temporary solution for fetching the ERC-20 tokens.
      // TODO Replace with our own node API
      return new EthplorerService(apiUrl).fetchTopTokens();
    } catch (error: any) {
      Logger.write(error);
      return null;
    }
  }

  override async fetchAccountTokenBalances(address: string): Promise<ITokenBalance[] | null> {
    const { ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();
    const apiUrl = ethActiveNetworkPredefinedSettings.value.tokenMiddlewareUrl;
    try {
      // Temporary solution for fetching the ERC-20 token balances.
      // TODO Replace with our own node API
      return new EthplorerService(apiUrl).fetchAccountTokenBalances(address);
    } catch (error: any) {
      Logger.write(error);
      return null;
    }
  }

  override async fetchTokenInfo(contractId: string): Promise<IToken | undefined> {
    const { ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();
    const apiUrl = ethActiveNetworkPredefinedSettings.value.tokenMiddlewareUrl;
    try {
      // Temporary solution for fetching the ERC-20 token info.
      // TODO Replace with our own node API
      return new EthplorerService(apiUrl).fetchTokenInfo(contractId);
    } catch (error: any) {
      Logger.write(error);
      return undefined;
    }
  }

  override async transferToken(
    amount: number,
    recipient: AccountAddress,
    contractId: AssetContractId,
    options: {
      fromAccount: AccountAddress;
      maxPriorityFeePerGas: string;
      maxFeePerGas: string;
    },
  ): Promise<ITransferResponse> {
    const {
      ethActiveNetworkSettings,
      ethActiveNetworkPredefinedSettings,
    } = useEthNetworkSettings();
    const { getAccountByAddress } = useAccounts();
    const apiUrl = ethActiveNetworkPredefinedSettings.value.middlewareUrl;

    const account = getAccountByAddress(options.fromAccount);
    if (!account || account.protocol !== PROTOCOLS.ethereum) {
      throw new Error('Token transfer were initiated from not existing or not ethereum account.');
    }

    const contractAbi = await new EtherscanService(apiUrl)
      .fetchFromApi({
        module: 'contract',
        action: 'getabi',
        address: contractId,
      });

    const contract = new Contract(
      contractAbi && Array.isArray(contractAbi?.result) ? contractAbi.result : ERC20_ABI,
      contractId,
      { from: options.fromAccount },
    );

    const { chainId, nodeUrl } = ethActiveNetworkSettings.value;
    contract.setProvider(nodeUrl);

    const hexAmount = bigIntToHex(BigInt(toWei(amount.toFixed(
      Number(await contract.methods.decimals().call()),
    ), 'ether')));
    const maxPriorityFeePerGas = bigIntToHex(BigInt(toWei(options.maxPriorityFeePerGas, 'ether')));
    const maxFeePerGas = bigIntToHex(BigInt(toWei(options.maxFeePerGas, 'ether')));

    const [nonce, gasLimit] = await Promise.all([
      this.getTransactionCount(options.fromAccount),
      // @ts-expect-error
      contract.methods.transfer(recipient, hexAmount).estimateGas(),
    ]);

    // All values are in wei
    const txData: FeeMarketEIP1559TxData = {
      chainId,
      nonce,
      to: contractId,
      // @ts-expect-error
      data: contract.methods.transfer(recipient, hexAmount).encodeABI(),
      value: 0x0,
      maxPriorityFeePerGas,
      maxFeePerGas,
      gasLimit: `0x${gasLimit.toString(16)}`,
      type: '0x02',
    };

    const tx = FeeMarketEIP1559Transaction.fromTxData(txData);

    const signedTx = tx.sign(account.secretKey!);
    const serializedTx = signedTx.serialize();
    const web3Eth = this.getWeb3EthInstance();
    const hash = `0x${Buffer.from(signedTx.hash()).toString('hex')}`;
    sendSignedTransaction(web3Eth, serializedTx, DEFAULT_RETURN_FORMAT);

    return { hash };
  }

  override async fetchPendingTransactions() {
    // TODO if needed
    return [];
  }

  override async fetchTransactionByHash(hash: string) {
    const web3Eth = this.getWeb3EthInstance();
    const transaction = await getTransaction(web3Eth, hash, DEFAULT_RETURN_FORMAT);
    const block = await getBlock(web3Eth, transaction?.blockHash, true, DEFAULT_RETURN_FORMAT);
    const normalized = normalizeWeb3EthTransactionStructure(transaction, block);
    return normalized;
  }

  override async fetchAccountTransactions(
    address: AccountAddress,
    { nextPageNum }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    const paginationParams: ITransactionApiPaginationParams = {};
    let regularTransactions: ITransaction[] = [];

    try {
      const { ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();
      const service = new EtherscanService(ethActiveNetworkPredefinedSettings.value.middlewareUrl);
      const [coinTransactions, tokenTransactions] = await Promise.all([
        service.fetchAccountCoinTransactions(address, { page: nextPageNum }),
        service.fetchAccountTokenTransactions(address, { page: nextPageNum }),
      ]);

      // Remove duplicate coin transactions (e.g.: token transfer fee paid with coin)
      tokenTransactions.forEach((tokenTransaction) => {
        const index = coinTransactions.findIndex(
          (coinTransaction) => coinTransaction.hash === tokenTransaction.hash,
        );
        if (index > -1) {
          coinTransactions.splice(index, 1);
        }
      });

      regularTransactions = [...coinTransactions, ...tokenTransactions];

      if (regularTransactions?.length) {
        paginationParams.nextPageNum = ((nextPageNum) ? +nextPageNum + 1 : 2).toString();
      }
    } catch (error: any) {
      Logger.write(error);
    }

    return {
      regularTransactions,
      paginationParams,
    };
  }

  override async fetchAccountAssetTransactions(
    address: AccountAddress,
    assetContractId: AssetContractId,
    { nextPageNum }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    const paginationParams: ITransactionApiPaginationParams = {};
    let regularTransactions: ITransaction[] = [];

    try {
      const { ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();
      const service = new EtherscanService(ethActiveNetworkPredefinedSettings.value.middlewareUrl);
      regularTransactions = (assetContractId === this.coinContractId)
        ? await service.fetchAccountCoinTransactions(address, { page: nextPageNum })
        : await service.fetchAccountTokenTransactions(
          address,
          { page: nextPageNum, assetContractId },
        );

      if (regularTransactions?.length) {
        paginationParams.nextPageNum = ((nextPageNum) ? +nextPageNum + 1 : 2).toString();
      }
    } catch (error: any) {
      Logger.write(error);
    }

    return {
      regularTransactions,
      paginationParams,
    };
  }

  override async spend(
    amount: number,
    recipient: AccountAddress,
    options: {
      fromAccount: AccountAddress;
      maxPriorityFeePerGas: string;
      maxFeePerGas: string;
    },
  ): Promise<ITransferResponse> {
    const { getAccountByAddress } = useAccounts();
    const { ethActiveNetworkSettings } = useEthNetworkSettings();

    const account = getAccountByAddress(options.fromAccount);
    if (!account || account.protocol !== PROTOCOLS.ethereum) {
      throw new Error('Token transfer were initiated from not existing or not ethereum account.');
    }

    const { chainId } = ethActiveNetworkSettings.value;
    const web3Eth = this.getWeb3EthInstance();
    const nonce = await this.getTransactionCount(options.fromAccount);

    const hexAmount = bigIntToHex(BigInt(toWei(amount.toFixed(ETH_COIN_PRECISION), 'ether')));
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

    const signedTx = tx.sign(account.secretKey);

    const serializedTx = signedTx.serialize();
    const hash = `0x${Buffer.from(signedTx.hash()).toString('hex')}`;
    sendSignedTransaction(web3Eth, serializedTx, DEFAULT_RETURN_FORMAT);

    return { hash };
  }

  private getWeb3EthInstance(): Web3Eth {
    const { ethActiveNetworkSettings } = useEthNetworkSettings();
    const { nodeUrl } = ethActiveNetworkSettings.value;
    return new Web3Eth(nodeUrl);
  }
}
