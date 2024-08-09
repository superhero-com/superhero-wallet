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
  getTransactionReceipt,
} from 'web3-eth';
import { DEFAULT_RETURN_FORMAT } from 'web3-types';
import { BIP32Factory } from 'bip32';
import BigNumber from 'bignumber.js';

import type {
  AccountAddress,
  AdapterNetworkSettingList,
  AssetAmount,
  AssetContractId,
  IAccount,
  IAccountRaw,
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
import { ACCOUNT_TYPES, PROTOCOLS } from '@/constants';
import { getLastNotEmptyAccountIndex, toHex } from '@/utils';
import Logger from '@/lib/logger';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import { tg } from '@/popup/plugins/i18n';
import {
  ERC20_ABI,
  ETH_COIN_PRECISION,
  ETH_COIN_SYMBOL,
  ETH_COINGECKO_COIN_ID,
  ETH_CONTRACT_ID,
  ETH_GAS_LIMIT,
  ETH_NETWORK_DEFAULT_SETTINGS,
  ETH_NETWORK_DEFAULT_ENV_SETTINGS,
  ETH_PROTOCOL_NAME,
  ETH_MDW_TO_NODE_APPROX_DELAY_TIME,
} from '@/protocols/ethereum/config';
import { useAccounts } from '@/composables';
import { useEthFeeCalculation } from '@/protocols/ethereum/composables/ethFeeCalculation';
import { useEthNetworkSettings } from '../composables/ethNetworkSettings';
import { EtherscanExplorer } from './EtherscanExplorer';
import { EtherscanService } from './EtherscanService';
import { normalizeWeb3EthTransactionStructure } from '../helpers';
import { EthplorerService } from './EthplorerService';

const TRANSACTION_POLLING_INTERVAL = 6000;
const TRANSACTION_POLLING_MAX_ATTEMPTS = 10;
const BLOCKS_TO_WAIT = 3;

export class EthereumAdapter extends BaseProtocolAdapter {
  override protocol = PROTOCOLS.ethereum;

  override protocolName = ETH_PROTOCOL_NAME;

  override coinName = ETH_PROTOCOL_NAME;

  override coinSymbol = ETH_COIN_SYMBOL;

  override coinContractId = ETH_CONTRACT_ID;

  override coinPrecision = ETH_COIN_PRECISION;

  override coinGeckoCoinId = ETH_COINGECKO_COIN_ID;

  override hasTokensSupport = true;

  override mdwToNodeApproxDelayTime = ETH_MDW_TO_NODE_APPROX_DELAY_TIME;

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
        numeric: true,
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

  override getExplorer() {
    const { ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();
    return new EtherscanExplorer(ethActiveNetworkPredefinedSettings.value.explorerUrl!);
  }

  override getUrlTokenKey(): string {
    return ETH_CONTRACT_ID;
  }

  override getDefaultCoin(
    marketData?: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOLS.ethereum]! || {} as MarketData),
      protocol: PROTOCOLS.ethereum,
      contractId: this.coinContractId,
      symbol: this.coinSymbol,
      decimals: this.coinPrecision,
      name: this.coinName,
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

  override isValidAddressOrNameEncoding(address: string) {
    return this.isAccountAddressValid(address);
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
    const derivationPath = `m/44'/60'/${accountIndex}'/0/0`;
    const childWallet = hdNodeWallet.derivePath(derivationPath);

    const address = toChecksumAddress(privateKeyToAddress(childWallet.privateKey!).toString());

    return {
      secretKey: childWallet.privateKey!,
      publicKey: childWallet.publicKey,
      address,
    };
  }

  override resolveAccountRaw(
    rawAccount: IAccountRaw,
    idx: number,
    globalIdx: number,
    seed: Uint8Array,
  ): IAccount | null {
    if (rawAccount.type !== ACCOUNT_TYPES.hdWallet) {
      return null;
    }

    const hdWallet = this.getHdWalletAccountFromMnemonicSeed(seed, idx);

    return {
      globalIdx,
      idx,
      ...rawAccount,
      ...hdWallet,
    };
  }

  override async discoverLastUsedAccountIndex(seed: Uint8Array): Promise<number> {
    return getLastNotEmptyAccountIndex(
      this.isAccountUsed.bind(this),
      this.getHdWalletAccountFromMnemonicSeed.bind(this),
      seed,
    );
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

  override async transferPreparedTransaction({
    to,
    from,
    data,
    value,
    gas,
  }: any = {}): Promise<ITransferResponse> {
    const { ethActiveNetworkSettings } = useEthNetworkSettings();
    const { getAccountByAddress } = useAccounts();
    const { chainId } = ethActiveNetworkSettings.value;
    const {
      updateFeeList,
      maxFeePerGas,
      maxPriorityFeePerGas,
    } = useEthFeeCalculation();

    const account = getAccountByAddress(toChecksumAddress(from));
    if (!account || account.protocol !== PROTOCOLS.ethereum) {
      throw new Error('Token transfer were initiated from not existing or not ethereum account.');
    }

    const [nonce] = await Promise.all([
      this.getTransactionCount(from),
      updateFeeList(),
    ]);

    if (!maxPriorityFeePerGas.value || !maxFeePerGas.value) {
      throw new Error('Failed to calculate the fee.');
    }

    const txData: FeeMarketEIP1559TxData = {
      chainId: toHex(chainId),
      nonce,
      to,
      data,
      value,
      gasLimit: gas,
      maxPriorityFeePerGas: bigIntToHex(BigInt(toWei(maxPriorityFeePerGas.value?.toFormat(ETH_COIN_PRECISION), 'ether'))),
      maxFeePerGas: bigIntToHex(BigInt(toWei(maxFeePerGas.value?.toFormat(ETH_COIN_PRECISION), 'ether'))),
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

  override async transferToken(
    amount: AssetAmount,
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

    const amountBN = new BigNumber(amount);
    const hexAmount = bigIntToHex(BigInt(toWei(amountBN.toFixed(
      Number(await contract.methods.decimals().call()),
    ), 'ether')));
    const maxPriorityFeePerGas = bigIntToHex(BigInt(toWei(options.maxPriorityFeePerGas, 'ether')));
    const maxFeePerGas = bigIntToHex(BigInt(toWei(options.maxFeePerGas, 'ether')));

    const [nonce, gasLimit] = await Promise.all([
      this.getTransactionCount(options.fromAccount),
      contract.methods.transfer(recipient, hexAmount).estimateGas(),
    ]);

    // All values are in wei
    const txData: FeeMarketEIP1559TxData = {
      chainId: toHex(chainId),
      nonce,
      to: contractId,
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

  override async fetchTransactionByHash(hash: string, transactionOwner?: AccountAddress) {
    const web3Eth = this.getWeb3EthInstance();
    const transaction = await getTransaction(web3Eth, hash, DEFAULT_RETURN_FORMAT);

    // If the transaction is a token transfer, fetch the token transaction using the etherscan API
    // Because the web3 library does not give enough information about token transactions
    if (transaction?.input !== '0x' && transaction?.blockNumber) {
      const { ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();
      const service = new EtherscanService(ethActiveNetworkPredefinedSettings.value.middlewareUrl);
      const tokenTx = await service.fetchAccountTokenTransactionByHash(
        hash,
        transactionOwner ?? transaction.from,
        transaction.blockNumber,
      );

      if (tokenTx) {
        return tokenTx;
      }
    }

    const block = transaction?.blockHash
      ? await getBlock(web3Eth, transaction.blockHash, true, DEFAULT_RETURN_FORMAT)
      : undefined;
    const normalized = normalizeWeb3EthTransactionStructure(transaction, block, transactionOwner);
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

  override async constructAndSignTx(
    amount: number,
    recipient: string,
    options: Record<string, any>,
  ): Promise<FeeMarketEIP1559Transaction> {
    const { getAccountByAddress } = useAccounts();
    const { ethActiveNetworkSettings } = useEthNetworkSettings();

    const account = getAccountByAddress(options.fromAccount);
    if (!account || account.protocol !== PROTOCOLS.ethereum) {
      throw new Error('Ethereum transaction construction & signing was initiated from non existing or not ethereum account.');
    }

    const nonce = await this.getTransactionCount(options.fromAccount);
    const { chainId } = ethActiveNetworkSettings.value;

    const hexAmount = bigIntToHex(BigInt(toWei(amount.toFixed(ETH_COIN_PRECISION), 'ether')));
    const maxPriorityFeePerGas = bigIntToHex(BigInt(toWei(options.maxPriorityFeePerGas, 'ether')));
    const maxFeePerGas = bigIntToHex(BigInt(toWei(options.maxFeePerGas, 'ether')));

    // All values are in wei
    const txData: FeeMarketEIP1559TxData = {
      chainId: toHex(chainId),
      nonce,
      to: recipient,
      value: hexAmount,
      data: '0x',
      maxPriorityFeePerGas,
      maxFeePerGas,
      gasLimit: `0x${ETH_GAS_LIMIT.toString(16)}`,
      type: '0x02',
    };

    return FeeMarketEIP1559Transaction.fromTxData(txData).sign(account.secretKey);
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
    const web3Eth = this.getWeb3EthInstance();
    const signedTx = (await this.constructAndSignTx(amount, recipient, options));
    const serializedTx = signedTx.serialize();
    const hash = `0x${Buffer.from(signedTx.hash()).toString('hex')}`;

    sendSignedTransaction(web3Eth, serializedTx, DEFAULT_RETURN_FORMAT);

    return { hash };
  }

  override async waitTransactionMined(hash: string): Promise<any> {
    const web3Eth = this.getWeb3EthInstance();

    return new Promise((resolve) => {
      let attemptNo = 0;
      const interval = setInterval(async () => {
        attemptNo += 1;
        const isLastAttempt = attemptNo >= TRANSACTION_POLLING_MAX_ATTEMPTS;

        const minedTransaction = await getTransactionReceipt(web3Eth, hash, DEFAULT_RETURN_FORMAT);
        const currentBlock = await getBlock(web3Eth, 'latest', true, DEFAULT_RETURN_FORMAT);

        if (
          minedTransaction?.blockNumber
          && (
            (
              currentBlock?.number
              && currentBlock.number - BigInt(minedTransaction.blockNumber) >= BLOCKS_TO_WAIT
            )
            || isLastAttempt
          )
        ) {
          clearInterval(interval);
          return resolve(minedTransaction);
        }
        if (isLastAttempt) {
          clearInterval(interval);
          return resolve(null);
        }
        return null;
      }, TRANSACTION_POLLING_INTERVAL);
    });
  }

  private getWeb3EthInstance(): Web3Eth {
    const { ethActiveNetworkSettings } = useEthNetworkSettings();
    const { nodeUrl } = ethActiveNetworkSettings.value;
    return new Web3Eth(nodeUrl);
  }
}
