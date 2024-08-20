/* eslint-disable class-methods-use-this */

import {
  Connection,
  Keypair,
  ParsedAccountData,
  PublicKey,
} from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type {
  AccountAddress,
  AdapterNetworkSettingList,
  IAccount,
  IAccountRaw,
  ICoin,
  IFetchTransactionResult,
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
import { excludeFalsy, handleUnknownError, toShiftedBigNumber } from '@/utils';
import { useNetworks } from '@/composables';
import { tg } from '@/popup/plugins/i18n';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import {
  SOL_COIN_PRECISION,
  SOL_COIN_SYMBOL,
  SOL_COINGECKO_COIN_ID,
  SOL_CONTRACT_ID,
  SOL_NETWORK_DEFAULT_ENV_SETTINGS,
  SOL_NETWORK_DEFAULT_SETTINGS,
  SOL_PROTOCOL_NAME,
} from '@/protocols/solana/config';

export class SolanaAdapter extends BaseProtocolAdapter {
  override protocol = PROTOCOLS.solana;

  override protocolName = SOL_PROTOCOL_NAME;

  override coinName = SOL_PROTOCOL_NAME;

  override coinSymbol = SOL_COIN_SYMBOL;

  override coinContractId = SOL_CONTRACT_ID;

  override coinPrecision = SOL_COIN_PRECISION;

  override coinGeckoCoinId = SOL_COINGECKO_COIN_ID;

  override hasTokensSupport = true;

  override mdwToNodeApproxDelayTime = 0; // TODO

  private connection: Connection | null = null;

  private networkSettings: AdapterNetworkSettingList = [
    {
      key: 'nodeUrl',
      testId: 'url',
      defaultValue: SOL_NETWORK_DEFAULT_ENV_SETTINGS.nodeUrl,
      getPlaceholder: () => tg('pages.network.networkUrlPlaceholder'),
      getLabel: () => tg('pages.network.networkUrlLabel'),
    },
  ];

  override getAccountPrefix() {
    return ''; // TODO
  }

  override getAmountPrecision(): number {
    return 9; // TODO
  }

  override getExplorer() {
    return {} as any; // TODO
  }

  override getUrlTokenKey() {
    return SOL_CONTRACT_ID;
  }

  override getDefaultCoin(
    marketData?: MarketData,
    convertedBalance?: number,
  ): ICoin {
    return {
      ...(marketData?.[PROTOCOLS.solana]! || {} as MarketData),
      protocol: PROTOCOLS.solana,
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
    return SOL_NETWORK_DEFAULT_SETTINGS[networkType];
  }

  override async fetchBalance(address: AccountAddress): Promise<string> {
    const connection = this.getConnection();
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey!);
    return toShiftedBigNumber(balance, -this.getAmountPrecision()).toString();
  }

  override isAccountAddressValid() {
    return false; // TODO
  }

  override isValidAddressOrNameEncoding() {
    return false; // TODO
  }

  override async isAccountUsed(): Promise<boolean> {
    return false; // TODO
  }

  override getHdWalletAccountFromMnemonicSeed() {
    return {} as any; // TODO
  }

  override resolveAccountRaw(
    rawAccount: IAccountRaw,
    idx: number,
    globalIdx: number,
    seed: Uint8Array,
  ): IAccount | null {
    if (rawAccount.type === ACCOUNT_TYPES.hdWallet) {
      const seedBuffer = Buffer.from(seed).toString('hex');
      const derivationPath = `m/44'/501'/${idx}'/0'`;
      const { key } = derivePath(derivationPath, seedBuffer);
      const { publicKey, secretKey } = Keypair.fromSeed(key);
      const address = publicKey.toString();

      return {
        ...rawAccount,
        globalIdx,
        idx,
        secretKey,
        publicKey: publicKey.toBuffer(),
        address,
      };
    }
    return null;
  }

  override async discoverLastUsedAccountIndex(): Promise<number> {
    return -1; // TODO
  }

  override async fetchAvailableTokens(): Promise<IToken[] | null> {
    return []; // TODO
  }

  override async fetchAccountTokenBalances(
    address: AccountAddress,
  ): Promise<ITokenBalance[] | null> {
    try {
      const connection = this.getConnection();
      const accounts = await connection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID,
        {
          filters: [
            { dataSize: 165 },
            { memcmp: { offset: 32, bytes: address } },
          ],
        },
      );

      return (accounts || []).map(({ account, pubkey }) => {
        const { tokenAmount } = (account.data as ParsedAccountData)?.parsed?.info || {};
        return {
          address,
          protocol: this.protocol,
          contractId: pubkey.toString(),
          amount: tokenAmount.amount || 0,
          decimals: tokenAmount.decimals || this.coinPrecision,
        };
      });
    } catch (error) {
      handleUnknownError(error);
      return null;
    }
  }

  override async fetchTokenInfo(): Promise<IToken | undefined> {
    return undefined; // TODO
  }

  override async transferPreparedTransaction(): Promise<ITransferResponse> {
    return {} as any; // TODO
  }

  override async transferToken(): Promise<ITransferResponse> {
    return {} as any; // TODO
  }

  override async fetchTransactionByHash(): Promise<ITransaction> {
    return {} as any; // TODO
  }

  override async fetchAccountTransactions(
    address: AccountAddress,
    { lastTxId }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    const connection = this.getConnection();
    const publicKey = new PublicKey(address);
    try {
      const rawTransactions = await connection.getSignaturesForAddress(publicKey, {
        before: lastTxId,
      });
      const signatures = rawTransactions.map(({ signature }) => signature);
      const transactions = await connection.getParsedTransactions(signatures, {
        maxSupportedTransactionVersion: 0,
      });

      return {
        regularTransactions: transactions
          .filter(excludeFalsy)
          .map(({ blockTime, meta, transaction }) => ({
            hash: transaction.signatures[0] as any,
            microTime: (blockTime || 0) * 1000,
            pending: false,
            protocol: this.protocol,
            transactionOwner: address,
            tx: {
              contractId: this.coinContractId, // TODO update for token transfers
              type: 'SpendTx', // TODO
              amount: +toShiftedBigNumber(
                (meta?.preBalances[0] || 0) - (meta?.postBalances[0] || 0),
                -this.getAmountPrecision(),
              ),
              fee: meta?.fee || 0,
              log: meta?.logMessages || undefined,
            },
          })),
        paginationParams: {
          lastTxId: rawTransactions.at(-1)?.signature,
        },
      };
    } catch (error: any) {
      handleUnknownError(error);
      return {
        regularTransactions: [],
        paginationParams: {},
      };
    }
  }

  override async fetchAccountAssetTransactions(): Promise<IFetchTransactionResult> {
    return {
      regularTransactions: [], // TODO
      paginationParams: {}, // TODO
    };
  }

  override async constructAndSignTx(): Promise<any> {
    return {} as any; // TODO
  }

  override async spend(): Promise<ITransferResponse> {
    return {} as any; // TODO
  }

  override async waitTransactionMined(): Promise<any> {
    return null; // TODO
  }

  private getConnection() {
    const { activeNetwork } = useNetworks();
    const { nodeUrl } = activeNetwork.value.protocols.solana;
    if (!this.connection || this.connection.rpcEndpoint !== nodeUrl) {
      this.connection = new Connection(nodeUrl);
    }
    return this.connection;
  }
}
