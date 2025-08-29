/* eslint-disable class-methods-use-this */
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import { isAddress } from 'web3-validator';
import { toChecksumAddress, fromWei, toWei } from 'web3-utils';
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

import type {
  AccountAddress,
  AdapterNetworkSettingList,
  AssetContractId,
  IAccount,
  IAccountRaw,
  ICoin,
  IFetchTransactionResult,
  IHdWalletAccount,
  INetworkProtocolSettings,
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
  AVALANCHE_COIN_PRECISION,
  AVALANCHE_COIN_SYMBOL,
  AVALANCHE_CONTRACT_ID,
  AVALANCHE_GAS_LIMIT,
  AVALANCHE_MDW_TO_NODE_APPROX_DELAY_TIME,
  AVALANCHE_NETWORK_DEFAULT_SETTINGS,
  AVALANCHE_PROTOCOL_NAME,
} from '@/protocols/avalanche/config';
import { useAccounts } from '@/composables';
import { useAvalancheNetworkSettings } from '@/protocols/avalanche/composables/avalancheNetworkSettings';
import { EtherscanExplorer } from '@/protocols/ethereum/libs/EtherscanExplorer';
import { EtherscanService } from '@/protocols/ethereum/libs/EtherscanService';
import { normalizeWeb3EthTransactionStructure } from '@/protocols/ethereum/helpers';

const TRANSACTION_POLLING_INTERVAL = 6000;
const TRANSACTION_POLLING_MAX_ATTEMPTS = 10;
const BLOCKS_TO_WAIT = 3;

export class AvalancheAdapter extends BaseProtocolAdapter {
  override protocol = PROTOCOLS.avalanche;

  override protocolName = AVALANCHE_PROTOCOL_NAME;

  override coinName = AVALANCHE_PROTOCOL_NAME;

  override coinSymbol = AVALANCHE_COIN_SYMBOL;

  override coinContractId = AVALANCHE_CONTRACT_ID;

  override coinPrecision = AVALANCHE_COIN_PRECISION;

  override coinGeckoCoinId = 'avalanche-2';

  override hasTokensSupport = true;

  override mdwToNodeApproxDelayTime = AVALANCHE_MDW_TO_NODE_APPROX_DELAY_TIME;

  private bip32 = BIP32Factory(ecc);

  private networkSettings: AdapterNetworkSettingList = [
    {
      key: 'nodeUrl',
      testId: 'url',
      defaultValue: '', // filled by default network settings
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
      defaultValue: 'https://snowtrace.io',
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

  override getUrlTokenKey(): string {
    return AVALANCHE_CONTRACT_ID;
  }

  override getDefaultCoin(
    marketData?: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOLS.avalanche]! || ({} as MarketData)),
      protocol: PROTOCOLS.avalanche,
      contractId: this.coinContractId,
      symbol: this.coinSymbol,
      decimals: this.coinPrecision,
      name: this.coinName,
      convertedBalance,
      price: 1,
    };
  }

  override getNetworkSettings(): AdapterNetworkSettingList {
    return this.networkSettings;
  }

  override getNetworkTypeDefaultValues(networkType: NetworkTypeDefault): INetworkProtocolSettings {
    return AVALANCHE_NETWORK_DEFAULT_SETTINGS[networkType];
  }

  override isAccountAddressValid(address: AccountAddress): boolean {
    return isAddress(address);
  }

  override isValidAddressOrNameEncoding(address: AccountAddress): boolean {
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
    const path = `m/44'/9000'/${accountIndex}'/0/0`;
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

  override async discoverLastUsedAccountIndex(
    seed: Uint8Array,
  ): Promise<number> {
    return getLastNotEmptyAccountIndex(
      this.isAccountUsed.bind(this),
      this.getHdWalletAccountFromMnemonicSeed.bind(this),
      seed,
    );
  }

  override async constructAndSignTx(
    amount: number,
    recipient: string,
    options: Record<string, any>,
  ): Promise<any> {
    const { getAccountByAddress } = useAccounts();
    const { avalancheActiveNetworkSettings } = useAvalancheNetworkSettings();

    const account = getAccountByAddress(options.fromAccount);
    if (!account || account.protocol !== PROTOCOLS.avalanche) {
      throw new Error(
        'Avalanche transaction construction & signing was initiated from non-existing or non-avalanche account.',
      );
    }

    const { nonce } = options;
    const { chainId } = avalancheActiveNetworkSettings.value;

    const web3Eth = this.getWeb3EthInstance();
    const nodeGasPriceWei = await web3Eth.getGasPrice();
    const gasPrice = bigIntToHex(nodeGasPriceWei);

    const hexAmount = bigIntToHex(
      BigInt(toWei(amount.toFixed(AVALANCHE_COIN_PRECISION), 'ether')),
    );

    const txData: TxData = {
      nonce: toHex(nonce),
      gasPrice,
      gasLimit: toHex(String(AVALANCHE_GAS_LIMIT)),
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
        avalancheActiveNetworkPredefinedSettings,
        avalancheActiveNetworkSettings,
      } = useAvalancheNetworkSettings();
      const { chainId } = avalancheActiveNetworkSettings.value;
      const service = new EtherscanService(
        avalancheActiveNetworkPredefinedSettings.value.middlewareUrl,
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
        avalancheActiveNetworkPredefinedSettings,
        avalancheActiveNetworkSettings,
      } = useAvalancheNetworkSettings();
      const { chainId } = avalancheActiveNetworkSettings.value;
      const service = new EtherscanService(
        avalancheActiveNetworkPredefinedSettings.value.middlewareUrl,
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
        avalancheActiveNetworkPredefinedSettings,
        avalancheActiveNetworkSettings,
      } = useAvalancheNetworkSettings();
      const { chainId } = avalancheActiveNetworkSettings.value;
      const service = new EtherscanService(
        avalancheActiveNetworkPredefinedSettings.value.middlewareUrl,
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

  override getExplorer() {
    const {
      avalancheActiveNetworkSettings,
      avalancheActiveNetworkPredefinedSettings,
    } = useAvalancheNetworkSettings();
    return new EtherscanExplorer(
      avalancheActiveNetworkSettings.value.explorerUrl
      ?? avalancheActiveNetworkPredefinedSettings.value.explorerUrl,
    );
  }

  private getWeb3EthInstance(): Web3Eth {
    const { avalancheActiveNetworkSettings } = useAvalancheNetworkSettings();
    const { nodeUrl } = avalancheActiveNetworkSettings.value;
    return new Web3Eth(nodeUrl);
  }
}
