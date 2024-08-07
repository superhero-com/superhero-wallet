/* eslint-disable prefer-const */
/* eslint-disable class-methods-use-this */
import { uniqBy } from 'lodash-es';
import {
  decode,
  encode,
  Encoded,
  Encoding,
  getHdWalletAccountFromSeed,
  isAddressValid,
  Tag,
} from '@aeternity/aepp-sdk';
import camelCaseKeysDeep from 'camelcase-keys-deep';

import type {
  AccountAddress,
  AdapterNetworkSettingList,
  AssetAmount,
  AssetContractId,
  IAccount,
  IAccountRaw,
  IAmountDecimalPlaces,
  ICoin,
  IFetchTransactionResult,
  IHdWalletAccount,
  IToken,
  ITokenBalance,
  ITokenBalanceResponse,
  ITransaction,
  ITransactionApiPaginationParams,
  ITransferResponse,
  MarketData,
  NetworkTypeDefault,
} from '@/types';
import JsonBig from '@/lib/json-big';
import FungibleTokenFullInterfaceACI from '@/protocols/aeternity/aci/FungibleTokenFullInterfaceACI.json';
import { ACCOUNT_TYPES, PROTOCOLS, TXS_PER_PAGE } from '@/constants';
import { useAeSdk } from '@/composables/aeSdk';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import { tg } from '@/popup/plugins/i18n';
import {
  amountRounded,
  fetchAllPages,
  fetchJson,
  getLastNotEmptyAccountIndex,
  handleUnknownError,
  toShiftedBigNumber,
} from '@/utils';
import Logger from '@/lib/logger';

import type {
  AeNetworkProtocolSettings,
  ContractInitializeOptions,
} from '@/protocols/aeternity/types';
import {
  AE_COIN_PRECISION,
  AE_COINGECKO_COIN_ID,
  AE_CONTRACT_ID,
  AE_MDW_TO_NODE_APPROX_DELAY_TIME,
  AE_NETWORK_DEFAULT_ENV_SETTINGS,
  AE_NETWORK_DEFAULT_SETTINGS,
  AE_PROTOCOL_NAME,
  AE_SYMBOL,
  AEX9_TRANSFER_EVENT,
} from '@/protocols/aeternity/config';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';
import { useAeMiddleware, useAeNetworkSettings } from '@/protocols/aeternity/composables';

import { aettosToAe } from '../helpers';

export class AeternityAdapter extends BaseProtocolAdapter {
  override protocol = PROTOCOLS.aeternity;

  override protocolName = AE_PROTOCOL_NAME;

  override coinName = AE_PROTOCOL_NAME;

  override coinSymbol = AE_SYMBOL;

  override coinContractId = AE_CONTRACT_ID;

  override coinPrecision = AE_COIN_PRECISION;

  override coinGeckoCoinId = AE_COINGECKO_COIN_ID;

  override hasTokensSupport = true;

  override mdwToNodeApproxDelayTime = AE_MDW_TO_NODE_APPROX_DELAY_TIME;

  private networkSettings: AdapterNetworkSettingList<AeNetworkProtocolSettings> = [
    {
      key: 'nodeUrl',
      testId: 'ae-node-url',
      required: true,
      defaultValue: AE_NETWORK_DEFAULT_ENV_SETTINGS.nodeUrl,
      getPlaceholder: () => tg('pages.network.networkUrlPlaceholder'),
      getLabel: () => tg('pages.network.networkUrlLabel'),
    },
    {
      key: 'middlewareUrl',
      testId: 'ae-middleware-url',
      required: true,
      defaultValue: AE_NETWORK_DEFAULT_ENV_SETTINGS.middlewareUrl,
      getPlaceholder: () => tg('pages.network.networkMiddlewarePlaceholder'),
      getLabel: () => tg('pages.network.networkMiddlewareLabel'),
    },
    {
      key: 'backendUrl',
      required: true,
      defaultValue: AE_NETWORK_DEFAULT_ENV_SETTINGS.backendUrl,
      getPlaceholder: () => tg('pages.network.backendUrlPlaceholder'),
      getLabel: () => tg('pages.network.backendUrlLabel'),
    },
  ];

  override getAccountPrefix() {
    return `${Encoding.AccountAddress}_`;
  }

  override getExplorer() {
    const { aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();
    return new AeScan(aeActiveNetworkPredefinedSettings.value.explorerUrl!);
  }

  override getAmountPrecision({ highPrecision, amount }: IAmountDecimalPlaces = {}): number {
    return (highPrecision || (amount && amount < 0.01)) ? 9 : 2;
  }

  override getUrlTokenKey(): string {
    return AE_SYMBOL;
  }

  override getDefaultCoin(
    marketData?: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOLS.aeternity]! || {} as MarketData),
      protocol: PROTOCOLS.aeternity,
      contractId: this.coinContractId,
      decimals: this.coinPrecision,
      name: this.coinName,
      symbol: this.coinSymbol,
      convertedBalance,
    };
  }

  override getNetworkSettings() {
    return this.networkSettings;
  }

  override getNetworkTypeDefaultValues(networkType: NetworkTypeDefault) {
    return AE_NETWORK_DEFAULT_SETTINGS[networkType] as any;
  }

  override async fetchBalance(address: Encoded.AccountAddress): Promise<string> {
    const { getAeSdk, setAeNodeError } = useAeSdk();
    const sdk = await getAeSdk();

    try {
      const balanceInAettos = await sdk.getBalance(address);
      setAeNodeError(false);
      return aettosToAe(balanceInAettos);
    } catch (e) {
      setAeNodeError(true);
      return '0';
    }
  }

  override isAccountAddressValid(address: string) {
    return isAddressValid(address, Encoding.AccountAddress);
  }

  override isValidAddressOrNameEncoding(address: string) {
    return isAddressValid(address, Encoding.ContractAddress)
      || isAddressValid(address, Encoding.AccountAddress)
      || isAddressValid(address, Encoding.Name);
  }

  override async isAccountUsed(address: string): Promise<boolean> {
    const { getDryAeSdk } = useAeSdk();
    const aeSdk = await getDryAeSdk();
    return aeSdk.api.getAccountByPubkey(address).then(() => true, () => false);
  }

  override getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    const account = getHdWalletAccountFromSeed(seed, accountIndex);
    return {
      ...account,
      publicKey: Buffer.from(account.publicKey),
      secretKey: Buffer.from(account.secretKey, 'hex'),
      address: account.publicKey,
    };
  }

  override resolveAccountRaw(
    rawAccount: IAccountRaw,
    idx: number,
    globalIdx: number,
    seed: Uint8Array,
  ): IAccount {
    const wallet = rawAccount.type === ACCOUNT_TYPES.hdWallet
      ? this.getHdWalletAccountFromMnemonicSeed(seed, idx)
      : {
        publicKey: Buffer.from(decode(rawAccount.address as Encoded.AccountAddress)),
      };

    return {
      globalIdx,
      idx,
      ...rawAccount,
      ...wallet,
    } as IAccount;
  }

  /**
   * As the Aeternity protocol is the primary one we always return at least index 0 (one account).
   */
  override async discoverLastUsedAccountIndex(seed: Uint8Array): Promise<number> {
    const index = await getLastNotEmptyAccountIndex(
      this.isAccountUsed.bind(this),
      this.getHdWalletAccountFromMnemonicSeed.bind(this),
      seed,
    );
    return (index > -1) ? index : 0;
  }

  override async fetchAvailableTokens(): Promise<IToken[]> {
    const { fetchFromMiddleware } = useAeMiddleware();
    const response: Omit<IToken, 'protocol'>[] = camelCaseKeysDeep(await fetchAllPages(
      () => fetchFromMiddleware('/v2/aex9?by=name&limit=100&direction=forward'),
      fetchFromMiddleware,
    ));
    return (response || []).map((token) => ({ ...token, protocol: PROTOCOLS.aeternity }));
  }

  override async fetchAccountTokenBalances(address: string): Promise<ITokenBalance[]> {
    const { fetchFromMiddleware } = useAeMiddleware();
    try {
      const tokens: ITokenBalanceResponse[] = camelCaseKeysDeep(await fetchAllPages(
        () => fetchFromMiddleware(`/v2/aex9/account-balances/${address}?limit=100`),
        fetchFromMiddleware,
      ));
      return tokens.map(({ amount, contractId, decimals }) => ({
        address,
        amount,
        contractId,
        convertedBalance: +amountRounded(toShiftedBigNumber(amount, -decimals)),
        protocol: PROTOCOLS.aeternity,
      }));
    } catch (error: any) {
      handleUnknownError(error);
    }
    return [];
  }

  override async transferToken(
    amount: AssetAmount,
    recipient: string,
    contractId: string,
    options: ContractInitializeOptions,
  ) {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    const tokenContract = await aeSdk.initializeContract({
      aci: FungibleTokenFullInterfaceACI,
      address: contractId as Encoded.ContractAddress,
    });
    return tokenContract.transfer(recipient, amount, options);
  }

  async fetchRegularTransactions(
    address: string,
    limit: number,
    nextPageUrl?: string,
  ) {
    const {
      fetchFromMiddlewareCamelCased,
      normalizeMiddlewareTransactionStructure,
    } = useAeMiddleware();
    /** @link https://github.com/aeternity/ae_mdw?tab=readme-ov-file#v2accountsidactivities */
    const url = nextPageUrl || `/v2/accounts/${address}/activities?limit=${limit}`;

    try {
      const { data, next } = await fetchFromMiddlewareCamelCased(url);
      let regularTransactions = (data || [])
        .filter(({ type }: any) => !type?.startsWith('Internal'))
        .map((responseData: any) => normalizeMiddlewareTransactionStructure(responseData, address));

      // DEX transaction is represented in 3 objects, only last one should be used
      // this condition checking edge case when not all 3 objects in one chunk
      if (data.at(-1)?.type === AEX9_TRANSFER_EVENT) {
        regularTransactions[regularTransactions.length - 1] = (
          await this.fetchTransactionByHash(data.at(-1)?.payload.txHash, address)
        );
      }
      // Filter out the doubled AEX9 transfer entries
      regularTransactions = uniqBy(regularTransactions.reverse(), 'hash').reverse();

      return {
        regularTransactions,
        nextPageUrl: next,
      };
    } catch (error) {
      return {};
    }
  }

  override async fetchPendingTransactions(
    address: string,
  ) {
    try {
      const { getAeSdk } = useAeSdk();
      const sdk = await getAeSdk();
      const fetchedPendingTransaction = (
        await sdk.api.getPendingAccountTransactionsByPubkey(address)
      );

      return JsonBig.parse(JsonBig.stringify(
        fetchedPendingTransaction?.transactions || [],
      )).map((transaction: ITransaction) => ({
        ...transaction,
        pending: true,
        protocol: PROTOCOLS.aeternity,
        microTime: Date.now(),
        transactionOwner: address,
      }));
    } catch (error) {
      return [];
    }
  }

  async fetchTipWithdrawnTransactions(address: string, recent: boolean) {
    try {
      const { aeActiveNetworkSettings } = useAeNetworkSettings();
      const { getAeSdk } = useAeSdk();
      await getAeSdk();

      const response = await fetchJson(
        `${aeActiveNetworkSettings.value.backendUrl}/cache/events/?address=${address}&event=TipWithdrawn${recent ? '&limit=5' : ''}`,
      );

      if (response.message) {
        return [];
      }

      // TODO prepare interface for response
      const tipWithdrawnTransactions: ITransaction[] = (response as any[]).map(({
        amount,
        contract,
        height,
        data: { tx },
        ...t
      }) => ({
        tx: {
          ...tx,
          address,
          amount,
          contractId: contract,
          type: Tag[Tag.ContractCallTx],
        },
        ...t,
        microTime: new Date(t.createdAt).getTime(),
        blockHeight: height,
        claim: true,
        protocol: PROTOCOLS.aeternity,
        transactionOwner: address,
      }));

      return tipWithdrawnTransactions;
    } catch (error) {
      return [];
    }
  }

  override async fetchAccountTransactions(
    address: AccountAddress,
    { nextPageUrl }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    let paginationParams: ITransactionApiPaginationParams = {};

    const [
      { regularTransactions, nextPageUrl: newNextPageUrl },
      pendingTransactions,
      tipWithdrawnTransactions,
    ] = await Promise.all([
      this.fetchRegularTransactions(address, TXS_PER_PAGE, nextPageUrl),
      this.fetchPendingTransactions(address),
      this.fetchTipWithdrawnTransactions(address, !nextPageUrl),
    ]);

    if (newNextPageUrl) {
      paginationParams.nextPageUrl = newNextPageUrl;
    }

    return {
      regularTransactions,
      pendingTransactions,
      tipWithdrawnTransactions,
      paginationParams,
    };
  }

  override async fetchAccountAssetTransactions(
    address: AccountAddress,
    assetContractId: AssetContractId,
    { nextPageUrl }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    let paginationParams: ITransactionApiPaginationParams = {};
    let regularTransactions: ITransaction[] = [];

    try {
      // Aeternity protocol APIs has no way for fetching the AE Coin or Token transactions only.
      // For this purpose we are fetching all transactions and filter the asset.
      // TODO update the logic when this issue is closed: https://github.com/aeternity/ae_mdw/issues/1678
      const res = await this.fetchAccountTransactions(address, { nextPageUrl });
      paginationParams = res.paginationParams;

      if (assetContractId === this.coinContractId) {
        regularTransactions = res.regularTransactions
          .filter(({ tx }) => !tx.contractId || tx.contractId === this.coinContractId);
      } else {
        regularTransactions = res.regularTransactions
          .filter(({ tx }) => (
            tx.contractId === assetContractId
            || JSON.stringify({ ...tx.arguments, ...tx.log }).includes(assetContractId)
          ));
      }
    } catch (error: any) {
      Logger.write(error);
    }

    return {
      paginationParams,
      regularTransactions,
    };
  }

  async fetchTransactionByHash(
    hash: string,
    transactionOwner?: AccountAddress,
  ): Promise<ITransaction> {
    const { getMiddleware } = useAeMiddleware();
    const middleware = await getMiddleware();

    return {
      ...await middleware.getTx(hash),
      protocol: PROTOCOLS.aeternity,
      transactionOwner,
    };
  }

  override constructAndSignTx(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  override async spend(
    amount: number,
    recipient: string,
    options: { payload: string },
  ): Promise<ITransferResponse> {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    return aeSdk.spendWithCustomOptions(
      amount,
      recipient as Encoded.AccountAddress,
      {
        waitMined: false,
        payload: encode(Buffer.from(options.payload), Encoding.Bytearray),
      },
    );
  }

  override async waitTransactionMined(hash: string): Promise<any> {
    return useAeSdk().waitTransactionMined(hash as Encoded.TxHash);
  }
}
