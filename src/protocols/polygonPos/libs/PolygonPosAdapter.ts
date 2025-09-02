/* eslint-disable class-methods-use-this */
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import { isAddress } from 'web3-validator';
import { toChecksumAddress, fromWei, toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import {
  privateKeyToAddress,
  bigIntToHex,
  privateKeyToPublicKey,
  Transaction,
  TxData,
  Common,
} from 'web3-eth-accounts';
import Web3Eth, {
  NUMBER_DATA_FORMAT,
  getBalance,
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
import { ACCOUNT_TYPES, NETWORK_TYPE_MAINNET, PROTOCOLS } from '@/constants';
import { getLastNotEmptyAccountIndex, toHex } from '@/utils';
import Logger from '@/lib/logger';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import { tg } from '@/popup/plugins/i18n';
import {
  POLYGON_POS_COIN_PRECISION,
  POLYGON_POS_COIN_SYMBOL,
  POLYGON_POS_CONTRACT_ID,
  POLYGON_POS_GAS_LIMIT,
  POLYGON_MDW_TO_NODE_APPROX_DELAY_TIME,
  POLYGON_NETWORK_DEFAULT_SETTINGS,
  POLYGON_POS_PROTOCOL_NAME,
} from '@/protocols/polygonPos/config';
import { ERC20_ABI } from '@/protocols/ethereum/config';
import { useAccounts } from '@/composables';
import { useEthFeeCalculation } from '@/protocols/ethereum/composables/ethFeeCalculation';
import { usePolygonNetworkSettings } from '@/protocols/polygonPos/composables/polygonPosNetworkSettings';
import { EtherscanExplorer } from '@/protocols/ethereum/libs/EtherscanExplorer';
import { EtherscanService } from '@/protocols/ethereum/libs/EtherscanService';
import { normalizeWeb3EthTransactionStructure } from '@/protocols/ethereum/helpers';
import { AlchemyService } from '@/protocols/evm/libs/AlchemyService';
import { EthplorerService } from '@/protocols/ethereum/libs/EthplorerService';

const TRANSACTION_POLLING_INTERVAL = 6000;
const TRANSACTION_POLLING_MAX_ATTEMPTS = 10;
const BLOCKS_TO_WAIT = 3;

export class PolygonAdapter extends BaseProtocolAdapter {
  override protocol = PROTOCOLS.polygonPos;

  override protocolName = POLYGON_POS_PROTOCOL_NAME;

  override coinName = POLYGON_POS_PROTOCOL_NAME;

  override coinSymbol = POLYGON_POS_COIN_SYMBOL;

  override coinContractId = POLYGON_POS_CONTRACT_ID;

  override coinGeckoCoinId = 'matic-network';

  override coinPrecision = POLYGON_POS_COIN_PRECISION;

  override hasTokensSupport = true;

  override mdwToNodeApproxDelayTime = POLYGON_MDW_TO_NODE_APPROX_DELAY_TIME;

  private bip32 = BIP32Factory(ecc);

  private networkSettings: AdapterNetworkSettingList = [
    {
      key: 'nodeUrl',
      testId: 'url',
      defaultValue: '',
      getPlaceholder: () => tg('pages.network.networkUrlPlaceholder'),
      getLabel: () => tg('pages.network.networkUrlLabel'),
    },
    {
      key: 'chainId',
      defaultValue: '',
      validationRules: { url: false, numeric: true },
      getPlaceholder: () => tg('pages.network.chainIdPlaceholder'),
      getLabel: () => tg('pages.network.chainIdLabel'),
    },
    {
      key: 'explorerUrl',
      required: true,
      defaultValue: 'https://polygonscan.com',
      getPlaceholder: () => tg('pages.network.explorerUrlPlaceholder'),
      getLabel: () => tg('pages.network.explorerUrlLabel'),
    },
  ];

  override getAccountPrefix() {
    return '0x';
  }

  override getAmountPrecision(): number {
    return 9;
  }

  override getExplorer() {
    const {
      polygonActiveNetworkSettings,
      polygonActiveNetworkPredefinedSettings,
    } = usePolygonNetworkSettings();
    return new EtherscanExplorer(
      polygonActiveNetworkSettings.value.explorerUrl
      ?? polygonActiveNetworkPredefinedSettings.value.explorerUrl,
    );
  }

  override getUrlTokenKey(): string {
    return POLYGON_POS_CONTRACT_ID;
  }

  override getDefaultCoin(
    marketData?: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOLS.polygonPos]! || ({} as MarketData)),
      protocol: PROTOCOLS.polygonPos,
      contractId: this.coinContractId,
      symbol: this.coinSymbol,
      decimals: this.coinPrecision,
      name: this.coinName,
      convertedBalance,
      price: 1,
    };
  }

  override getNetworkSettings() {
    return this.networkSettings;
  }

  override getNetworkTypeDefaultValues(networkType: NetworkTypeDefault): INetworkProtocolSettings {
    return POLYGON_NETWORK_DEFAULT_SETTINGS[networkType] as INetworkProtocolSettings;
  }

  override async fetchBalance(address: AccountAddress): Promise<string> {
    const web3Eth = this.getWeb3EthInstance();
    const balanceInWei = await getBalance(
      web3Eth,
      toChecksumAddress(address),
      'latest',
      NUMBER_DATA_FORMAT,
    );
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
    return parseFloat(balance) > 0 || txCount > 0;
  }

  async getTransactionCount(address: string): Promise<number> {
    const web3Eth = this.getWeb3EthInstance();
    const txCount = await web3Eth.getTransactionCount(address, 'pending');
    return Number(txCount);
  }

  override getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    const hdNodeWallet = this.bip32.fromSeed(Buffer.from(seed));
    const path = `m/44'/60'/${accountIndex}'/0/0`;
    const childWallet = hdNodeWallet.derivePath(path);
    const address = toChecksumAddress(
      privateKeyToAddress(childWallet.privateKey!).toString(),
    );
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
    seed?: Uint8Array,
  ): IAccount | null {
    if (rawAccount.type === ACCOUNT_TYPES.privateKey && rawAccount.privateKey) {
      const address = toChecksumAddress(
        privateKeyToAddress(Buffer.from(rawAccount.privateKey)).toString(),
      );
      return {
        idx,
        globalIdx,
        secretKey: Buffer.from(rawAccount.privateKey!),
        ...rawAccount,
        privateKey: undefined,
        address,
        publicKey: Buffer.from(
          privateKeyToPublicKey(Buffer.from(rawAccount.privateKey), false),
        ),
      };
    }
    if (rawAccount.type === ACCOUNT_TYPES.hdWallet && seed) {
      const hdWallet = this.getHdWalletAccountFromMnemonicSeed(seed, idx);
      return {
        globalIdx,
        idx,
        ...rawAccount,
        ...hdWallet,
      };
    }
    return null;
  }

  override async fetchAvailableTokens(): Promise<IToken[] | null> {
    const {
      polygonActiveNetworkPredefinedSettings,
      polygonActiveNetworkSettings,
    } = usePolygonNetworkSettings();
    const predefinedUrl = polygonActiveNetworkPredefinedSettings.value.tokenMiddlewareUrl;
    const chainId = Number(
      polygonActiveNetworkSettings.value.chainId
      || polygonActiveNetworkPredefinedSettings.value.chainId,
    );

    // Mainnet: use Ethplorer top tokens (temporary solution like ETH)
    if (chainId === Number(POLYGON_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_MAINNET].chainId)) {
      try {
        const response = await new EthplorerService(predefinedUrl)
          .fetchTopTokens(PROTOCOLS.polygonPos);
        // Tag protocol as Polygon Pos
        return (response || [])?.map((t) => ({ ...t, protocol: PROTOCOLS.polygonPos }));
      } catch (error: any) {
        Logger.write(error);
        return null;
      }
    }

    // Testnet: no Alchemy top-tokens endpoint – return null to use cache/manual
    return null;
  }

  override async fetchAccountTokenBalances(
    address: string,
  ): Promise<ITokenBalance[] | null> {
    const {
      polygonActiveNetworkSettings,
      polygonActiveNetworkPredefinedSettings,
    } = usePolygonNetworkSettings();
    const apiUrl = polygonActiveNetworkPredefinedSettings.value.tokenMiddlewareUrl;
    if (!apiUrl) return null;
    const chainId = Number(polygonActiveNetworkSettings.value.chainId);

    try {
      if (chainId === Number(POLYGON_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_MAINNET].chainId)) {
        const response = await new EthplorerService(apiUrl)
          .fetchAccountTokenBalances(address, PROTOCOLS.polygonPos);
        return (response || [])?.map((b) => ({ ...b, protocol: PROTOCOLS.polygonPos }));
      }
      const response = await new AlchemyService(apiUrl, PROTOCOLS.polygonPos)
        .getTokenBalances(address);
      return response;
    } catch (error: any) {
      Logger.write(error);
      return null;
    }
  }

  override async fetchTokenInfo(
    contractId: string,
  ): Promise<IToken | undefined> {
    const {
      polygonActiveNetworkSettings,
      polygonActiveNetworkPredefinedSettings,
    } = usePolygonNetworkSettings();
    const apiUrl = polygonActiveNetworkPredefinedSettings.value.tokenMiddlewareUrl;
    if (!apiUrl) return undefined;
    const chainId = Number(polygonActiveNetworkSettings.value.chainId);

    try {
      if (chainId === Number(POLYGON_NETWORK_DEFAULT_SETTINGS[NETWORK_TYPE_MAINNET].chainId)) {
        const response = await new EthplorerService(apiUrl)
          .fetchTokenInfo(contractId, PROTOCOLS.polygonPos);
        return response ? { ...response, protocol: PROTOCOLS.polygonPos } : undefined;
      }
      const response = await new AlchemyService(apiUrl, PROTOCOLS.polygonPos)
        .getTokenMetadata(contractId);
      return response;
    } catch (error: any) {
      Logger.write(error);
      return undefined;
    }
  }

  override async transferPreparedTransaction({
    to,
    from,
    data = '0x',
    value,
    gas,
  }: any = {}): Promise<ITransferResponse> {
    const { polygonActiveNetworkSettings } = usePolygonNetworkSettings();
    const { getAccountByAddress } = useAccounts();
    const { chainId } = polygonActiveNetworkSettings.value;
    const { updateFeeList } = useEthFeeCalculation(this.protocol);

    const account = getAccountByAddress(toChecksumAddress(from));
    if (!account || account.protocol !== PROTOCOLS.polygonPos) {
      throw new Error(
        'Token transfer was initiated from non-existing or non-polygon account.',
      );
    }

    const [nonce] = await Promise.all([
      this.getTransactionCount(from),
      updateFeeList(),
    ]);

    const web3Eth = this.getWeb3EthInstance();
    const nodeGasPriceWei = await web3Eth.getGasPrice();
    const gasPrice = bigIntToHex(nodeGasPriceWei);

    let gasLimitHex: string;
    if (gas != null) {
      let gasNum: number;
      if (typeof gas === 'string') {
        gasNum = gas.startsWith('0x') ? Number(gas) : Number(gas);
      } else {
        gasNum = Number(gas);
      }
      gasLimitHex = `0x${gasNum.toString(16)}`;
    } else {
      gasLimitHex = toHex(String(POLYGON_POS_GAS_LIMIT));
    }

    const txData: TxData = {
      nonce,
      gasPrice,
      gasLimit: gasLimitHex,
      to,
      value,
      data,
    };

    const common = Common.custom({ chainId: Number(chainId), networkId: Number(chainId) });
    const tx = new Transaction(txData, { common });
    const signedTx = tx.sign(account.secretKey!);
    const serializedTx = signedTx.serialize();
    const raw = `0x${Buffer.from(serializedTx).toString('hex')}`;
    const hash = `0x${Buffer.from(signedTx.hash()).toString('hex')}`;
    sendSignedTransaction(web3Eth, raw, DEFAULT_RETURN_FORMAT);
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
      nonce: number;
    },
  ): Promise<ITransferResponse> {
    const {
      polygonActiveNetworkSettings,
      polygonActiveNetworkPredefinedSettings,
    } = usePolygonNetworkSettings();
    const { getAccountByAddress } = useAccounts();
    const apiUrl = polygonActiveNetworkPredefinedSettings.value.middlewareUrl;

    const account = getAccountByAddress(options.fromAccount);
    if (!account || account.protocol !== PROTOCOLS.polygonPos) {
      throw new Error(
        'Token transfer was initiated from non-existing or non-polygon account.',
      );
    }
    const { chainId, nodeUrl } = polygonActiveNetworkSettings.value;

    const contractAbi = await new EtherscanService(
      apiUrl,
      chainId,
    ).fetchFromApi({
      module: 'contract',
      action: 'getabi',
      address: contractId,
    });

    const contract = new Contract(
      contractAbi && Array.isArray(contractAbi?.result)
        ? contractAbi.result
        : ERC20_ABI,
      contractId,
      { from: options.fromAccount },
    );

    contract.setProvider(nodeUrl);

    const amountBN = new BigNumber(amount);
    const hexAmount = bigIntToHex(
      BigInt(
        toWei(
          amountBN.toFixed(Number(await contract.methods.decimals().call())),
          'ether',
        ),
      ),
    );

    const web3Eth = this.getWeb3EthInstance();
    const nodeGasPriceWei = await web3Eth.getGasPrice();
    const gasPrice = bigIntToHex(nodeGasPriceWei);

    const [nonce, gasLimit] = await Promise.all([
      this.getTransactionCount(options.fromAccount),
      contract.methods.transfer(recipient, hexAmount).estimateGas({ from: options.fromAccount }),
    ]);

    const txData: TxData = {
      nonce,
      gasPrice,
      gasLimit: `0x${gasLimit.toString(16)}`,
      to: contractId,
      data: contract.methods.transfer(recipient, hexAmount).encodeABI(),
      value: '0x0',
    };

    const common = Common.custom({ chainId: Number(chainId), networkId: Number(chainId) });
    const tx = new Transaction(txData, { common });
    const signedTx = tx.sign(account.secretKey!);
    const serializedTx = signedTx.serialize();
    const raw = `0x${Buffer.from(serializedTx).toString('hex')}`;
    const hash = `0x${Buffer.from(signedTx.hash()).toString('hex')}`;
    sendSignedTransaction(web3Eth, raw, DEFAULT_RETURN_FORMAT);
    return { hash };
  }

  override async fetchTransactionByHash(
    hash: string,
    transactionOwner?: AccountAddress,
  ) {
    const web3Eth = this.getWeb3EthInstance();
    const transaction = await getTransaction(
      web3Eth,
      hash,
      DEFAULT_RETURN_FORMAT,
    );

    if (transaction?.input !== '0x' && transaction?.blockNumber) {
      const {
        polygonActiveNetworkPredefinedSettings,
        polygonActiveNetworkSettings,
      } = usePolygonNetworkSettings();
      const { chainId } = polygonActiveNetworkSettings.value;
      const service = new EtherscanService(
        polygonActiveNetworkPredefinedSettings.value.middlewareUrl,
        chainId,
      );
      const tokenTx = await service.fetchAccountTokenTransactionByHash(
        hash,
        transactionOwner ?? transaction.from,
        this.protocol,
        transaction.blockNumber,
        transaction.input,
      );
      if (tokenTx) return tokenTx;
    }

    const block = transaction?.blockHash
      ? await getBlock(
        web3Eth,
        transaction.blockHash,
        true,
        DEFAULT_RETURN_FORMAT,
      )
      : undefined;
    const normalized = normalizeWeb3EthTransactionStructure(
      transaction,
      block,
      transactionOwner,
    );
    return normalized;
  }

  override async fetchAccountTransactions(
    address: AccountAddress,
    { nextPageNum }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    const paginationParams: ITransactionApiPaginationParams = {};
    let regularTransactions: ITransaction[] = [];

    try {
      const {
        polygonActiveNetworkPredefinedSettings,
        polygonActiveNetworkSettings,
      } = usePolygonNetworkSettings();
      const { chainId } = polygonActiveNetworkSettings.value;
      const service = new EtherscanService(
        polygonActiveNetworkPredefinedSettings.value.middlewareUrl,
        chainId,
      );
      const [coinTransactions, tokenTransactions] = await Promise.all([
        service.fetchAccountCoinTransactions(address, this.protocol, { page: nextPageNum }),
        service.fetchAccountTokenTransactions(address, this.protocol, { page: nextPageNum }),
      ]);

      tokenTransactions.forEach((tokenTransaction) => {
        const index = coinTransactions.findIndex(
          (coinTransaction) => coinTransaction.hash === tokenTransaction.hash,
        );
        if (index > -1) coinTransactions.splice(index, 1);
      });

      regularTransactions = [...coinTransactions, ...tokenTransactions].map((transaction) => ({
        ...transaction,
        protocol: this.protocol,
      }));
      if (regularTransactions?.length) {
        paginationParams.nextPageNum = (
          nextPageNum ? +nextPageNum + 1 : 2
        ).toString();
      }
    } catch (error: any) {
      Logger.write(error);
    }

    return { regularTransactions, paginationParams };
  }

  override async fetchAccountAssetTransactions(
    address: AccountAddress,
    assetContractId: AssetContractId,
    { nextPageNum }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    const paginationParams: ITransactionApiPaginationParams = {};
    let regularTransactions: ITransaction[] = [];

    try {
      const {
        polygonActiveNetworkPredefinedSettings,
        polygonActiveNetworkSettings,
      } = usePolygonNetworkSettings();
      const { chainId } = polygonActiveNetworkSettings.value;
      const service = new EtherscanService(
        polygonActiveNetworkPredefinedSettings.value.middlewareUrl,
        chainId,
      );
      regularTransactions = assetContractId === this.coinContractId
        ? await service.fetchAccountCoinTransactions(address, this.protocol, {
          page: nextPageNum,
        })
        : await service.fetchAccountTokenTransactions(address, this.protocol, {
          page: nextPageNum,
          assetContractId,
        });

      if (regularTransactions?.length) {
        paginationParams.nextPageNum = (
          nextPageNum ? +nextPageNum + 1 : 2
        ).toString();
      }
    } catch (error: any) {
      Logger.write(error);
    }

    return { regularTransactions, paginationParams };
  }

  async constructAndSignTx(
    amount: number,
    recipient: string,
    options: Record<string, any>,
  ): Promise<any> {
    const { getAccountByAddress } = useAccounts();
    const { polygonActiveNetworkSettings } = usePolygonNetworkSettings();

    const account = getAccountByAddress(options.fromAccount);
    if (!account || account.protocol !== PROTOCOLS.polygonPos) {
      throw new Error(
        'Polygon transaction construction & signing was initiated from non-existing or non-polygon account.',
      );
    }

    const { nonce } = options;
    const { chainId } = polygonActiveNetworkSettings.value;

    const web3Eth = this.getWeb3EthInstance();
    const nodeGasPriceWei = await web3Eth.getGasPrice();
    const gasPrice = bigIntToHex(nodeGasPriceWei);

    const hexAmount = bigIntToHex(
      BigInt(toWei(amount.toFixed(POLYGON_POS_COIN_PRECISION), 'ether')),
    );

    const txData: TxData = {
      nonce: toHex(nonce),
      gasPrice,
      gasLimit: toHex(String(POLYGON_POS_GAS_LIMIT)),
      to: recipient,
      value: hexAmount,
      data: '0x',
    };

    const common = Common.custom({ chainId: Number(chainId), networkId: Number(chainId) });
    const tx = new Transaction(txData, { common });
    const signedTx = tx.sign(account.secretKey!);
    const serializedTx = signedTx.serialize();
    const hash = `0x${Buffer.from(signedTx.hash()).toString('hex')}`;
    return { raw: serializedTx, hash };
  }

  override async spend(
    amount: number,
    recipient: AccountAddress,
    options: {
      fromAccount: AccountAddress;
      maxPriorityFeePerGas: string;
      maxFeePerGas: string;
      nonce: number;
    },
  ): Promise<ITransferResponse> {
    const web3Eth = this.getWeb3EthInstance();
    const { raw, hash } = await this.constructAndSignTx(amount, recipient, options);
    sendSignedTransaction(web3Eth, raw, DEFAULT_RETURN_FORMAT);
    return { hash };
  }

  override async waitTransactionMined(hash: string): Promise<any> {
    const web3Eth = this.getWeb3EthInstance();

    return new Promise((resolve) => {
      let attemptNo = 0;
      const interval = setInterval(async () => {
        attemptNo += 1;
        const isLastAttempt = attemptNo >= TRANSACTION_POLLING_MAX_ATTEMPTS;

        const minedTransaction = await getTransactionReceipt(
          web3Eth,
          hash,
          DEFAULT_RETURN_FORMAT,
        );
        const currentBlock = await getBlock(
          web3Eth,
          'latest',
          true,
          DEFAULT_RETURN_FORMAT,
        );

        if (
          minedTransaction?.blockNumber
          && ((currentBlock?.number
            && currentBlock.number - BigInt(minedTransaction.blockNumber)
            >= BLOCKS_TO_WAIT)
            || isLastAttempt)
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

  override async discoverLastUsedAccountIndex(
    seed: Uint8Array,
  ): Promise<number> {
    return getLastNotEmptyAccountIndex(
      this.isAccountUsed.bind(this),
      this.getHdWalletAccountFromMnemonicSeed.bind(this),
      seed,
    );
  }

  private getWeb3EthInstance(): Web3Eth {
    const { polygonActiveNetworkSettings } = usePolygonNetworkSettings();
    const { nodeUrl } = polygonActiveNetworkSettings.value;
    return new Web3Eth(nodeUrl);
  }
}
