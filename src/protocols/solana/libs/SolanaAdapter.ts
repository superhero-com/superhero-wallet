/* eslint-disable class-methods-use-this, import/no-extraneous-dependencies */

import { Tag } from '@aeternity/aepp-sdk';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID as SPL_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { derivePath } from 'ed25519-hd-key';

import { useAccounts } from '@/composables';
import { useNetworks } from '@/composables/networks';
import { PROTOCOLS, TXS_PER_PAGE } from '@/constants';
import { ProtocolExplorer } from '@/lib/ProtocolExplorer';
import { tg } from '@/popup/plugins/i18n';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import {
  SOL_COIN_PRECISION,
  SOL_COIN_SYMBOL,
  SOL_COINGECKO_COIN_ID,
  SOL_CONTRACT_ID,
  SOL_MDW_TO_NODE_APPROX_DELAY_TIME,
  SOL_NETWORK_DEFAULT_ENV_SETTINGS,
  SOL_NETWORK_DEFAULT_SETTINGS,
  SOL_PROTOCOL_NAME,
  SOL_TOKEN_LIST_URL,
  SOL_TOKEN_PROGRAM_ID,
} from '@/protocols/solana/config';
import type {
  AccountAddress,
  AdapterNetworkSettingList,
  IAccount,
  IAccountRaw,
  ICoin,
  IFetchTransactionResult,
  INetworkProtocolSettings,
  IHdWalletAccount,
  IToken,
  ITokenBalance,
  ITransaction,
  ITransactionApiPaginationParams,
  ITransferResponse,
  MarketData,
  AssetContractId,
  NetworkTypeDefault,
} from '@/types';
import { getLastNotEmptyAccountIndex, fetchJson, handleUnknownError } from '@/utils';

const TOKEN_PROGRAM_ID = new PublicKey(SOL_TOKEN_PROGRAM_ID);

const TRANSACTION_POLLING_INTERVAL = 3000;
const TRANSACTION_POLLING_MAX_ATTEMPTS = 10;

export class SolanaAdapter extends BaseProtocolAdapter {
  override protocol = PROTOCOLS.solana;

  override protocolName = SOL_PROTOCOL_NAME;

  override coinName = SOL_PROTOCOL_NAME;

  override coinSymbol = SOL_COIN_SYMBOL;

  override coinContractId = SOL_CONTRACT_ID;

  override coinPrecision = SOL_COIN_PRECISION;

  override coinGeckoCoinId = SOL_COINGECKO_COIN_ID;

  override hasTokensSupport = true;

  override mdwToNodeApproxDelayTime = SOL_MDW_TO_NODE_APPROX_DELAY_TIME;

  private networkSettings: AdapterNetworkSettingList = [
    {
      key: 'nodeUrl',
      testId: 'url',
      required: true,
      defaultValue: SOL_NETWORK_DEFAULT_ENV_SETTINGS.nodeUrl,
      getPlaceholder: () => tg('pages.network.networkUrlPlaceholder'),
      getLabel: () => tg('pages.network.networkUrlLabel'),
    },
    {
      key: 'explorerUrl',
      required: true,
      defaultValue: SOL_NETWORK_DEFAULT_ENV_SETTINGS.explorerUrl,
      getPlaceholder: () => tg('pages.network.explorerUrlPlaceholder'),
      getLabel: () => tg('pages.network.explorerUrlLabel'),
    },
  ];

  private tokenListCache: IToken[] | null = null;

  private async loadTokenList(): Promise<IToken[]> {
    const { activeNetwork } = useNetworks();
    const isTestnet = activeNetwork.value.type === 'testnet';

    // For testnet, return empty list as testnet typically has very few tokens
    // and the mainnet token list is not applicable
    if (isTestnet) {
      this.tokenListCache = [];
      return [];
    }

    if (this.tokenListCache) return this.tokenListCache;
    try {
      const res: any = await fetchJson(SOL_TOKEN_LIST_URL);
      const tokens: any[] = res?.tokens || [];
      this.tokenListCache = tokens.map((t) => ({
        contractId: t.address,
        name: t.name,
        symbol: t.symbol,
        decimals: t.decimals,
        protocol: PROTOCOLS.solana,
        price: 0,
        image: t.logoURI,
      })) as IToken[];
      return this.tokenListCache;
    } catch (e) {
      this.tokenListCache = [];
      return [];
    }
  }

  private getActiveSolanaSettings() {
    const { activeNetwork } = useNetworks();
    return activeNetwork.value.protocols.solana as INetworkProtocolSettings<'explorerUrl'>;
  }

  override getAccountPrefix() {
    return '';
  }

  override getAmountPrecision(): number {
    return 9;
  }

  override getExplorer() {
    const settings = this.getActiveSolanaSettings();
    const url = settings.explorerUrl || 'https://explorer.solana.com';
    const [path, query] = url.split('?');
    const base = (path || '').replace(/\/$/, '');
    const queryPart = query ? `?${query}` : '';
    const explorer: ProtocolExplorer = {
      prepareUrlForAccount: (address: string) => (
        `${base}/address/${address}${queryPart}`
      ),
      prepareUrlForHash: (hash: string) => (
        `${base}/tx/${hash}${queryPart}`
      ),
    } as ProtocolExplorer;
    return explorer;
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
      price: 1,
    };
  }

  override getNetworkSettings() {
    return this.networkSettings;
  }

  override getNetworkTypeDefaultValues(
    networkType: NetworkTypeDefault,
  ): INetworkProtocolSettings<'explorerUrl'> {
    return SOL_NETWORK_DEFAULT_SETTINGS[networkType];
  }

  private getConnection(commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed') {
    const { nodeUrl } = this.getActiveSolanaSettings();
    return new Connection(nodeUrl, commitment);
  }

  override async fetchBalance(address: AccountAddress): Promise<string> {
    try {
      const conn = this.getConnection();
      const balance = await conn.getBalance(new PublicKey(address as string));
      return (balance / LAMPORTS_PER_SOL).toString();
    } catch (e) {
      return '0';
    }
  }

  override isAccountAddressValid(address: AccountAddress) {
    try {
      // Will throw if invalid
      // eslint-disable-next-line no-new
      new PublicKey(address as string);
      return true;
    } catch (e) {
      return false;
    }
  }

  override isValidAddressOrNameEncoding(address: AccountAddress) {
    return this.isAccountAddressValid(address);
  }

  override async isAccountUsed(address: AccountAddress): Promise<boolean> {
    try {
      const conn = this.getConnection();
      const pubkey = new PublicKey(address as string);
      const [balance, signatures] = await Promise.all([
        conn.getBalance(pubkey),
        conn.getSignaturesForAddress(pubkey, { limit: 1 }),
      ]);
      return balance > 0 || signatures.length > 0;
    } catch (e) {
      return false;
    }
  }

  override getHdWalletAccountFromMnemonicSeed(
    seed: Uint8Array,
    accountIndex: number,
  ): IHdWalletAccount {
    // Solana derivation path: m/44'/501'/{accountIndex}'/0'
    const path = `m/44'/501'/${accountIndex}'/0'`;
    const { key } = derivePath(path, Buffer.from(seed).toString('hex'));
    const keypair = Keypair.fromSeed(Uint8Array.from(key));
    return {
      secretKey: keypair.secretKey,
      publicKey: keypair.publicKey.toBytes(),
      address: keypair.publicKey.toBase58(),
    };
  }

  override resolveAccountRaw(
    rawAccount: IAccountRaw,
    idx: number,
    globalIdx: number,
    seed?: Uint8Array,
  ): IAccount | null {
    if (rawAccount.type === 'private-key' && rawAccount.privateKey) {
      try {
        const parsePrivateKeyToBytes = (value: any): Uint8Array | null => {
          // Handle Node.js Buffer-like objects that may come through JSON as
          // { type: 'Buffer', data: [...] }
          if (
            value && typeof value === 'object'
            && value.type === 'Buffer' && Array.isArray(value.data)
          ) {
            return Uint8Array.from(value.data.map((n: any) => Number(n)));
          }
          // Handle real Buffers if available
          try {
            const maybeBuffer = (globalThis as any).Buffer;
            if (maybeBuffer?.isBuffer?.(value)) {
              return new Uint8Array(value);
            }
          } catch (_) { /* NOOP */ }
          // Direct typed arrays
          if (value instanceof Uint8Array) return value;
          if (Array.isArray(value)) return Uint8Array.from(value as number[]);
          if (typeof value === 'string') {
            const trimmed = value.trim();
            // JSON array form: "[1,2,3,...]"
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              try {
                const arr = JSON.parse(trimmed);
                if (Array.isArray(arr)) return Uint8Array.from(arr.map((n: any) => Number(n)));
              } catch (_) { /* NOOP */ }
            }
            // Hex string
            const hex = trimmed.toLowerCase();
            if (/^[0-9a-f]+$/.test(hex) && hex.length % 2 === 0) {
              const bytes = new Uint8Array(hex.length / 2);
              for (let i = 0; i < bytes.length; i += 1) {
                bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
              }
              return bytes;
            }
            // Base64 fallback
            try {
              const buf = Buffer.from(trimmed, 'base64');
              if (buf.length > 0) return new Uint8Array(buf);
            } catch (_) { /* NOOP */ }
          }
          return null;
        };
        const secretBytes = parsePrivateKeyToBytes(rawAccount.privateKey);
        if (!secretBytes) return null;

        let keypair: Keypair;
        if (secretBytes.length === 64) {
          try {
            keypair = Keypair.fromSecretKey(secretBytes);
          } catch (_) {
            // Some exports provide 64-byte hex that actually represents a 32-byte seed;
            // try first half
            keypair = Keypair.fromSeed(secretBytes.slice(0, 32));
          }
        } else if (secretBytes.length === 32) {
          keypair = Keypair.fromSeed(secretBytes);
        } else {
          return null;
        }
        return {
          idx,
          globalIdx,
          secretKey: Buffer.from(keypair.secretKey),
          ...rawAccount,
          privateKey: undefined,
          address: keypair.publicKey.toBase58(),
          publicKey: Buffer.from(keypair.publicKey.toBytes()),
        } as any;
      } catch (e) {
        return null;
      }
    }

    if (rawAccount.type === 'hd-wallet' && seed) {
      const hd = this.getHdWalletAccountFromMnemonicSeed(seed, idx);
      return {
        globalIdx,
        idx,
        ...rawAccount,
        ...hd,
      } as any;
    }

    return null;
  }

  override async discoverLastUsedAccountIndex(seed: Uint8Array): Promise<number> {
    return getLastNotEmptyAccountIndex(
      this.isAccountUsed.bind(this),
      this.getHdWalletAccountFromMnemonicSeed.bind(this),
      seed,
    );
  }

  override async fetchAvailableTokens(): Promise<IToken[] | null> {
    return this.loadTokenList();
  }

  override async fetchAccountTokenBalances(
    address: AccountAddress,
  ): Promise<ITokenBalance[] | null> {
    try {
      const conn = this.getConnection();
      const owner = new PublicKey(address as string);
      const resp = await conn.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID });
      const tokenList = await this.loadTokenList();
      const balances: ITokenBalance[] = resp.value.map(({ account }) => {
        const { data }: any = account;
        const { parsed } = data || {};
        const { info } = parsed || {} as any;
        const amountInfo = info?.tokenAmount;
        const mint = info?.mint;
        const amountUi = amountInfo?.uiAmount || 0;
        const decimals = amountInfo?.decimals || 0;
        const tokenMeta = tokenList.find((t) => t.contractId === mint);
        return {
          address,
          amount: new BigNumber(amountUi).shiftedBy(decimals).toString(),
          decimals,
          convertedBalance: Number(amountUi),
          contractId: mint,
          name: tokenMeta?.name || mint,
          symbol: tokenMeta?.symbol || 'UNKNOWN',
          protocol: PROTOCOLS.solana,
          price: 0,
        } as ITokenBalance;
      });
      return balances;
    } catch (e) {
      return [];
    }
  }

  override async fetchTokenInfo(contractId: AssetContractId): Promise<IToken | undefined> {
    // Fast path: if we already have the token list cached, use it
    const cached = this.tokenListCache?.find((t) => t.contractId === contractId);
    if (cached) return cached;

    // Fallback: fetch minimal info directly from the mint account on-chain
    try {
      const conn = this.getConnection();
      const mintPk = new PublicKey(contractId as string);
      const mintInfo = await conn.getParsedAccountInfo(mintPk);
      // @ts-ignore
      const decimals = mintInfo?.value?.data?.parsed?.info?.decimals || 0;
      return {
        contractId,
        name: contractId as string,
        symbol: 'UNKNOWN',
        decimals,
        protocol: PROTOCOLS.solana,
        price: 0,
      } as IToken;
    } catch (_) {
      return undefined;
    }
  }

  override async transferPreparedTransaction(
    _transactionData: any,
  ): Promise<ITransferResponse> {
    if (_transactionData) { /* NOOP */ }
    throw new Error('Solana transaction sending is not implemented yet.');
  }

  override async transferToken(
    amount: string,
    recipient: AccountAddress,
    contractId: AssetContractId,
    options: { fromAccount: AccountAddress },
  ): Promise<ITransferResponse> {
    const { getAccountByAddress } = useAccounts();
    const sender = getAccountByAddress(options.fromAccount);
    if (!sender || sender.protocol !== PROTOCOLS.solana) {
      throw new Error('Solana token transfer initiated from invalid account.');
    }

    const conn = this.getConnection();
    const mintPk = new PublicKey(contractId as string);
    const ownerPk = new PublicKey(sender.address as string);
    const recipientPk = new PublicKey(recipient as string);

    // Resolve decimals (try token list first)
    let decimals = this.tokenListCache?.find((t) => t.contractId === contractId)?.decimals || 0;
    if (!decimals) {
      try {
        const mintInfo = await conn.getParsedAccountInfo(mintPk);
        // @ts-ignore
        decimals = mintInfo?.value?.data?.parsed?.info?.decimals || 0;
      } catch (e) { /* NOOP */ }
    }

    const rawAmount = BigInt(new BigNumber(amount || 0).shiftedBy(decimals).toFixed(0));

    // Sender token account
    const ownerTokenAccount = (await conn.getParsedTokenAccountsByOwner(ownerPk, { mint: mintPk }))
      .value?.[0]?.pubkey;
    if (!ownerTokenAccount) {
      throw new Error('Sender does not have the specified token account.');
    }

    // Recipient token account (ATA)
    const recipientAta = await getAssociatedTokenAddress(
      mintPk,
      recipientPk,
      false,
      SPL_TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const recipientHasAta = (await conn.getParsedAccountInfo(recipientAta))?.value != null;

    const { blockhash } = await conn.getLatestBlockhash('finalized');
    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: ownerPk });

    if (!recipientHasAta) {
      tx.add(createAssociatedTokenAccountInstruction(
        ownerPk, // payer
        recipientAta,
        recipientPk,
        mintPk,
        SPL_TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ));
    }

    tx.add(createTransferInstruction(
      ownerTokenAccount,
      recipientAta,
      ownerPk,
      rawAmount,
      [],
      SPL_TOKEN_PROGRAM_ID,
    ));

    const keypair = Keypair.fromSecretKey(Uint8Array.from(sender.secretKey!));
    tx.sign(keypair);
    try {
      const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed' } as any);
      return { hash: sig };
    } catch (error: any) {
      handleUnknownError(error);
      throw error;
    }
  }

  private normalizeTransaction(
    signature: string,
    tx: any,
    owner?: AccountAddress,
  ): ITransaction {
    const feeLamports = Number(tx?.meta?.fee || 0);
    const preBalances: number[] = tx?.meta?.preBalances || [];
    const postBalances: number[] = tx?.meta?.postBalances || [];
    const signerIndex = 0;
    const lamportsSpentBySigner = (
      (preBalances[signerIndex] || 0)
      - (postBalances[signerIndex] || 0)
    );
    const amountSol = Math.max(0, (lamportsSpentBySigner - feeLamports)) / LAMPORTS_PER_SOL;
    const accountKeys = tx?.transaction?.message?.accountKeys || [];
    // Resolve per-account lamports delta for SOL system transfers
    const accountOwnersBase58: string[] = accountKeys.map((k: any) => k?.toBase58?.());
    const solDeltas = accountOwnersBase58.map((addr, idx) => ({
      owner: addr,
      deltaLamports: Number((postBalances[idx] || 0) - (preBalances[idx] || 0)),
    }));
    const from = accountKeys?.[0] || undefined;
    // Try to detect recipient for simple transfers
    const to = (() => {
      try {
        const ix = tx?.transaction?.message?.instructions?.[0];
        const accIndex = ix?.accounts?.[1];
        const key = tx?.transaction?.message?.accountKeys?.[accIndex];
        return key?.toBase58?.();
      } catch (e) {
        return undefined;
      }
    })();

    const firstIx = tx?.transaction?.message?.instructions?.[0];
    const programIdBase58 = tx?.transaction?.message?.indexToProgramIds.get(
      firstIx?.programIdIndex,
    )?.toBase58?.();
    const isSystemTransfer = programIdBase58 === SystemProgram.programId.toBase58();
    const isTokenProgram = programIdBase58 === SPL_TOKEN_PROGRAM_ID.toBase58()
      || ((tx?.meta?.postTokenBalances?.length || 0) > 0)
      || ((tx?.meta?.preTokenBalances?.length || 0) > 0);

    if (isTokenProgram) {
      const postTokens = tx?.meta?.postTokenBalances || [];
      const preTokens = tx?.meta?.preTokenBalances || [];
      const mint = postTokens?.[0]?.mint || preTokens?.[0]?.mint || SOL_CONTRACT_ID;

      const owners = Array.from(new Set([
        ...preTokens.map((b: any) => b.owner),
        ...postTokens.map((b: any) => b.owner),
      ].filter(Boolean)));

      const deltas = owners.map((o) => {
        const preAmt = Number(
          preTokens.find((b: any) => b.owner === o)?.uiTokenAmount?.uiAmount || 0,
        );
        const postAmt = Number(
          postTokens.find((b: any) => b.owner === o)?.uiTokenAmount?.uiAmount || 0,
        );
        return { owner: o, delta: postAmt - preAmt };
      });

      const inc = deltas.reduce(
        (a, c) => (c.delta > (a?.delta || -Infinity) ? c : a),
        undefined as any,
      );
      const dec = deltas.reduce(
        (a, c) => (c.delta < (a?.delta || Infinity) ? c : a),
        undefined as any,
      );

      let recipientId: any = inc?.owner || to;
      let senderId: any = dec?.owner || from;
      let tokenAmount = Math.abs(inc?.delta || 0);

      // Adjust perspective for the provided transaction owner
      // Recipients should see only the amount they actually received
      if (owner) {
        const ownerStr = owner as string;
        const ownerDelta = deltas.find((d) => d.owner === ownerStr)?.delta;
        if (typeof ownerDelta === 'number' && Number.isFinite(ownerDelta)) {
          if (ownerDelta > 0) {
            tokenAmount = ownerDelta;
            recipientId = ownerStr;
            senderId = (dec?.owner) || senderId;
          } else if (ownerDelta < 0) {
            tokenAmount = Math.abs(ownerDelta);
            senderId = ownerStr;
            // keep recipientId as the main positive delta owner
          }
        }
      }

      const senderIdStr = typeof senderId === 'string' ? senderId : senderId?.toBase58?.();
      const recipientIdStr = typeof recipientId === 'string' ? recipientId : recipientId?.toBase58?.();

      return {
        hash: signature,
        protocol: PROTOCOLS.solana,
        transactionOwner: owner,
        pending: false,
        microTime: tx?.blockTime ? tx.blockTime * 1000 : undefined,
        tx: {
          amount: tokenAmount,
          senderId: senderIdStr,
          recipientId: recipientIdStr,
          contractId: mint,
          type: (Tag[Tag.ContractCallTx] as any),
          tag: Tag.ContractCallTx as any,
          arguments: [],
          callerId: senderIdStr as any,
          fee: feeLamports / LAMPORTS_PER_SOL,
        } as any,
      } as ITransaction;
    }

    // Treat any non-system program as contract call
    const isContractCall = !isSystemTransfer;

    // Try to resolve system transfer participants from instruction accounts
    let sysSender = from;
    let sysRecipient = to;
    if (isSystemTransfer && firstIx?.accounts?.length >= 2) {
      try {
        const fromIdx = firstIx.accounts[0];
        const toIdx = firstIx.accounts[1];
        sysSender = accountKeys[fromIdx] || from;
        sysRecipient = accountKeys[toIdx] || to;
      } catch (e) { /* NOOP */ }
    }

    // Adjust SOL amount per transaction owner perspective (batch transfers)
    let finalAmountSol = Number.isFinite(amountSol) ? amountSol : 0;
    if (owner) {
      const ownerStr = owner as string;
      const ownerDeltaLamports = solDeltas.find((d) => d.owner === ownerStr)?.deltaLamports || 0;
      if (ownerDeltaLamports > 0) {
        // Recipient: show only what they received
        finalAmountSol = ownerDeltaLamports / LAMPORTS_PER_SOL;
        try {
          sysRecipient = new PublicKey(ownerStr);
        } catch (_) { /* NOOP */ }
        // Best-effort sender detection from the most negative delta
        const decSol = solDeltas.reduce(
          (a: any, c: any) => (c.deltaLamports < (a?.deltaLamports || Infinity) ? c : a),
          undefined as any,
        );
        if (decSol?.owner) {
          try {
            sysSender = new PublicKey(decSol.owner);
          } catch (_) { /* NOOP */ }
        }
      } else if (ownerDeltaLamports < 0) {
        // Sender: show total sent excluding fee
        const sentAbs = Math.abs(ownerDeltaLamports);
        finalAmountSol = Math.max(0, sentAbs - feeLamports) / LAMPORTS_PER_SOL;
      }
    }

    return {
      hash: signature,
      protocol: PROTOCOLS.solana,
      transactionOwner: owner,
      pending: false,
      microTime: tx?.blockTime ? tx.blockTime * 1000 : undefined,
      tx: {
        amount: finalAmountSol,
        senderId: sysSender.toBase58(),
        recipientId: sysRecipient.toBase58(),
        ...(!isSystemTransfer ? { contractId: (programIdBase58 || SOL_CONTRACT_ID) } : {}),
        type: (isContractCall ? (Tag[Tag.ContractCallTx] as any) : (Tag[Tag.SpendTx] as any)),
        tag: (isContractCall ? Tag.ContractCallTx : Tag.SpendTx),
        arguments: [],
        ...(isContractCall ? { callerId: sysSender } : {}),
        fee: feeLamports / LAMPORTS_PER_SOL,
      } as any,
    } as ITransaction;
  }

  override async fetchTransactionByHash(
    hash: string,
    transactionOwner?: AccountAddress,
  ): Promise<ITransaction> {
    const conn = this.getConnection();
    const tx = await conn.getTransaction(hash, { maxSupportedTransactionVersion: 0 });
    if (!tx) {
      return {
        hash,
        protocol: PROTOCOLS.solana,
        transactionOwner,
        pending: true,
        tx: { amount: 0, contractId: SOL_CONTRACT_ID, type: 'transfer' } as any,
      } as ITransaction;
    }
    return this.normalizeTransaction(hash, tx, transactionOwner);
  }

  override async fetchAccountTransactions(
    address: AccountAddress,
    { nextPageUrl }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    const conn = this.getConnection();
    const owner = new PublicKey(address as string);
    const signatures = await conn.getSignaturesForAddress(
      owner,
      {
        limit: TXS_PER_PAGE,
        before: nextPageUrl as string | undefined,
      },
    );

    const txs = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await conn.getTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
        return this.normalizeTransaction(sig.signature, tx, address);
      }),
    );

    const paginationParams: ITransactionApiPaginationParams = {};
    if (signatures.length === TXS_PER_PAGE) {
      paginationParams.nextPageUrl = signatures[signatures.length - 1]?.signature;
    }

    return {
      regularTransactions: txs,
      paginationParams,
    };
  }

  override async fetchAccountAssetTransactions(
    address: AccountAddress,
    assetContractId: AssetContractId,
    { nextPageUrl }: ITransactionApiPaginationParams = {},
  ): Promise<IFetchTransactionResult> {
    const all = await this.fetchAccountTransactions(address, { nextPageUrl });
    const regularTransactions = (assetContractId === this.coinContractId)
      ? all.regularTransactions.filter((t) => t.tx.contractId === this.coinContractId)
      : all.regularTransactions.filter((t) => (
        t.tx.contractId === assetContractId
      ));
    return {
      regularTransactions,
      paginationParams: all.paginationParams,
    };
  }

  override async constructAndSignTx(
    amount: number,
    recipient: string,
    options: { fromAccount: AccountAddress },
  ): Promise<any> {
    const { getAccountByAddress } = useAccounts();
    const account = getAccountByAddress(options.fromAccount);
    if (!account || account.protocol !== PROTOCOLS.solana) {
      throw new Error('Solana tx signing initiated from invalid account.');
    }

    const fromPubkey = new PublicKey(account.address as string);
    const toPubkey = new PublicKey(recipient as string);
    const conn = this.getConnection();
    const { blockhash } = await conn.getLatestBlockhash('finalized');

    const lamports = Math.round(amount * LAMPORTS_PER_SOL);
    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: fromPubkey });
    tx.add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));

    const secret = Uint8Array.from(account.secretKey!);
    const keypair = Keypair.fromSecretKey(secret);
    tx.sign(keypair);

    return tx;
  }

  /**
   * Build a single transaction with multiple SOL transfer instructions.
   */
  private async constructAndSignBatchTx(
    amount: number,
    recipients: string[],
    options: { fromAccount: AccountAddress },
  ): Promise<Transaction> {
    const { getAccountByAddress } = useAccounts();
    const account = getAccountByAddress(options.fromAccount);
    if (!account || account.protocol !== PROTOCOLS.solana) {
      throw new Error('Solana tx signing initiated from invalid account.');
    }

    const fromPubkey = new PublicKey(account.address as string);
    const conn = this.getConnection();
    const { blockhash } = await conn.getLatestBlockhash('finalized');
    const lamports = Math.round(amount * LAMPORTS_PER_SOL);
    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: fromPubkey });

    recipients.forEach((r) => {
      const toPubkey = new PublicKey(r as string);
      tx.add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));
    });

    const keypair = Keypair.fromSecretKey(Uint8Array.from(account.secretKey!));
    tx.sign(keypair);
    return tx;
  }

  /**
   * Send SOL to multiple recipients using as few transactions as possible.
   * This method automatically chunks recipients to fit transaction size limits.
   * Returns an array of hashes with the list of recipients included in each tx.
   */
  async spendBatch(
    amount: number,
    recipients: AccountAddress[],
    options: { fromAccount: AccountAddress },
  ): Promise<Array<{ hash: string; recipients: AccountAddress[] }>> {
    const conn = this.getConnection();

    const trySend = async (
      list: AccountAddress[],
    ): Promise<Array<{ hash: string; recipients: AccountAddress[] }>> => {
      try {
        const tx = await this.constructAndSignBatchTx(amount, list as string[], options);
        // Preflight balance check: base fee and total lamports
        try {
          const feeInfo = await conn.getFeeForMessage(tx.compileMessage(), 'confirmed');
          const feeLamports = Number(feeInfo?.value || 0);
          const amountLamports = Math.round(amount * LAMPORTS_PER_SOL) * list.length;
          const payer = tx.feePayer as PublicKey;
          const payerBalance = await conn.getBalance(payer);
          const required = amountLamports + feeLamports;
          if (payerBalance < required) {
            throw new Error(`Insufficient SOL to cover total ${required / LAMPORTS_PER_SOL} (amount + fees). Balance: ${payerBalance / LAMPORTS_PER_SOL}`);
          }
        } catch (_) { /* best-effort */ }

        // Preflight rent check: prevent sending to program-owned accounts below rent-exempt
        try {
          const pubkeys = (list as string[]).map((r) => new PublicKey(r));
          const infos = await conn.getMultipleAccountsInfo(pubkeys);
          // Pre-compute rent-exempt minimum for unique data sizes
          const uniqueSizes = Array.from(new Set(
            infos
              .filter((info) => info && !info.owner.equals(SystemProgram.programId))
              .map((info) => info!.data?.length || 0)
              .filter((len) => len > 0),
          ));
          const rentValues = await Promise.all(
            uniqueSizes.map((size) => conn.getMinimumBalanceForRentExemption(size)),
          );
          const rentMap = new Map<number, number>(
            uniqueSizes.map((size, idx) => [size, rentValues[idx]]),
          );

          for (let i = 0; i < infos.length; i += 1) {
            const info = infos[i];
            if (!info) {
              // Non-existent: system transfer to new account is fine
              // No rent requirement for zero-size system accounts
              // eslint-disable-next-line no-continue
              continue;
            }
            const isSystemOwned = info.owner.equals(SystemProgram.programId);
            const dataLen = info.data?.length || 0;
            if (!isSystemOwned && dataLen > 0) {
              const required = rentMap.get(dataLen) || 0;
              const perRecipientLamports = Math.round(amount * LAMPORTS_PER_SOL);
              const afterTransfer = info.lamports + perRecipientLamports;
              if (afterTransfer < required) {
                throw new Error(
                  `Recipient ${pubkeys[i].toBase58()} is a program account with `
                  + `insufficient rent. After transfer: ${afterTransfer / LAMPORTS_PER_SOL} SOL, `
                  + `Requires: ${required / LAMPORTS_PER_SOL} SOL to be rent-exempt`,
                );
              }
            }
          }
        } catch (_) { /* best-effort */ }
        const signature = await conn.sendRawTransaction(tx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        } as any);
        return [{ hash: signature, recipients: list }];
      } catch (error: any) {
        handleUnknownError(error);
        throw error;
      }
    };

    // Conservative pre-chunking to reduce likelihood of oversize txs
    const MAX_INSTRUCTIONS_PER_TX = 16;
    const chunks: AccountAddress[][] = [];
    for (let i = 0; i < recipients.length; i += MAX_INSTRUCTIONS_PER_TX) {
      chunks.push(recipients.slice(i, i + MAX_INSTRUCTIONS_PER_TX));
    }
    const results: Array<{ hash: string; recipients: AccountAddress[] }> = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const c of chunks) {
      // eslint-disable-next-line no-await-in-loop
      const partial = await trySend(c);
      results.push(...partial);
    }
    return results;
  }

  override async spend(
    amount: number,
    recipient: AccountAddress,
    options: { fromAccount: AccountAddress },
  ): Promise<ITransferResponse> {
    const signed = await this.constructAndSignTx(amount, recipient as string, options);
    const conn = this.getConnection();
    const raw = signed.serialize();
    try {
      const signature = await conn.sendRawTransaction(raw, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      } as any);
      return { hash: signature };
    } catch (error: any) {
      handleUnknownError(error);
      throw error;
    }
  }

  /**
   * Send SPL token transfers in batch using minimal number of transactions.
   * Will create recipient ATAs if missing. Automatically chunks to fit size limits.
   */
  async transferTokenBatch(
    amount: string,
    recipients: AccountAddress[],
    contractId: AssetContractId,
    options: { fromAccount: AccountAddress },
  ): Promise<Array<{ hash: string; recipients: AccountAddress[] }>> {
    const { getAccountByAddress } = useAccounts();
    const sender = getAccountByAddress(options.fromAccount);
    if (!sender || sender.protocol !== PROTOCOLS.solana) {
      throw new Error('Solana token transfer initiated from invalid account.');
    }

    const conn = this.getConnection();
    const mintPk = new PublicKey(contractId as string);
    const ownerPk = new PublicKey(sender.address as string);

    // Resolve decimals and owner token account once
    let decimals = this.tokenListCache?.find((t) => t.contractId === contractId)?.decimals || 0;
    if (!decimals) {
      try {
        const mintInfo = await conn.getParsedAccountInfo(mintPk);
        // @ts-ignore
        decimals = mintInfo?.value?.data?.parsed?.info?.decimals || 0;
      } catch (e) { /* NOOP */ }
    }
    const rawAmount = BigInt(new BigNumber(amount || 0).shiftedBy(decimals).toFixed(0));
    const ownerTokenAccount = (await conn.getParsedTokenAccountsByOwner(ownerPk, { mint: mintPk }))
      .value?.[0]?.pubkey;
    if (!ownerTokenAccount) {
      throw new Error('Sender does not have the specified token account.');
    }

    const keypair = Keypair.fromSecretKey(Uint8Array.from(sender.secretKey!));

    const trySend = async (
      list: AccountAddress[],
    ): Promise<Array<{ hash: string; recipients: AccountAddress[] }>> => {
      try {
        const { blockhash } = await conn.getLatestBlockhash('finalized');
        const tx = new Transaction({ recentBlockhash: blockhash, feePayer: ownerPk });

        // Prepare ATAs and build instructions; batch existence checks
        const resolvedMeta = await Promise.all(list.map(async (r) => {
          const recipientPk = new PublicKey(r as string);
          const recipientAta = await getAssociatedTokenAddress(
            mintPk,
            recipientPk,
            false,
            SPL_TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          );
          return { recipientPk, recipientAta };
        }));
        const accountsInfo = await conn.getMultipleAccountsInfo(
          resolvedMeta.map((x) => x.recipientAta),
        );
        const resolved = resolvedMeta.map(
          (m, idx) => ({ ...m, hasAta: accountsInfo[idx] != null }),
        );

        resolved.forEach(({ recipientPk, recipientAta, hasAta }) => {
          if (!hasAta) {
            tx.add(createAssociatedTokenAccountInstruction(
              ownerPk, // payer
              recipientAta,
              recipientPk,
              mintPk,
              SPL_TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID,
            ));
          }
          tx.add(createTransferInstruction(
            ownerTokenAccount,
            recipientAta,
            ownerPk,
            rawAmount,
            [],
            SPL_TOKEN_PROGRAM_ID,
          ));
        });

        // Preflight balance check: include fees + ATA rent if any
        try {
          const feeInfo = await conn.getFeeForMessage(tx.compileMessage(), 'confirmed');
          const feeLamports = Number(feeInfo?.value || 0);
          const missingCount = resolved.filter((r) => !r.hasAta).length;
          const rentPerAta = missingCount > 0
            ? await conn.getMinimumBalanceForRentExemption(165)
            : 0;
          const required = feeLamports + (missingCount * rentPerAta);
          const payerBalance = await conn.getBalance(ownerPk);
          if (payerBalance < required) {
            throw new Error(
              `Insufficient SOL to fund ${missingCount} new token account(s) and fees. `
              + `Required: ${required / LAMPORTS_PER_SOL}, Balance: ${payerBalance / LAMPORTS_PER_SOL}`,
            );
          }
        } catch (_) { /* best-effort */ }

        tx.sign(keypair);
        const sig = await conn.sendRawTransaction(
          tx.serialize(),
          { skipPreflight: false, preflightCommitment: 'confirmed' } as any,
        );
        return [{ hash: sig, recipients: list }];
      } catch (error: any) {
        handleUnknownError(error);
        throw error;
      }
    };

    const MAX_INSTRUCTIONS_PER_TX = 12; // Tokens may require extra ATA create instructions
    const chunks: AccountAddress[][] = [];
    for (let i = 0; i < recipients.length; i += MAX_INSTRUCTIONS_PER_TX) {
      chunks.push(recipients.slice(i, i + MAX_INSTRUCTIONS_PER_TX));
    }
    const results: Array<{ hash: string; recipients: AccountAddress[] }> = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const c of chunks) {
      // eslint-disable-next-line no-await-in-loop
      const partial = await trySend(c);
      results.push(...partial);
    }
    return results;
  }

  override async waitTransactionMined(hash: string): Promise<any> {
    const conn = this.getConnection();

    return new Promise((resolve) => {
      let attemptNo = 0;
      const interval = setInterval(async () => {
        attemptNo += 1;
        const isLastAttempt = attemptNo >= TRANSACTION_POLLING_MAX_ATTEMPTS;
        try {
          const status = await conn.getSignatureStatus(hash, { searchTransactionHistory: true });
          const confirmationStatus = status?.value?.confirmationStatus;
          if (
            confirmationStatus === 'confirmed'
            || confirmationStatus === 'finalized'
          ) {
            clearInterval(interval);
            resolve(status?.value ?? null);
          } else if (isLastAttempt) {
            clearInterval(interval);
            resolve(null);
          }
        } catch (e) {
          if (isLastAttempt) {
            clearInterval(interval);
            resolve(null);
          }
        }
      }, TRANSACTION_POLLING_INTERVAL);
    });
  }
}
