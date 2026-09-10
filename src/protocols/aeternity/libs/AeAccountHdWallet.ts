/* eslint-disable class-methods-use-this */
import {
  AccountBase,
  DelegationTag,
  MemoryAccount,
  RpcRejectedByUserError,
  getTransactionSignerAddress,
  unpackDelegation,
  unpackTx,
  Encoded,
  Encoding,
  METHODS,
  encode,
} from '@aeternity/aepp-sdk';
import { ContractByteArrayEncoder, TypeResolver } from '@aeternity/aepp-calldata';
import { Ref } from 'vue';

import { tg } from '@/popup/plugins/i18n';
import type { IAccount, ISignModalResolution, ITx } from '@/types';
import {
  ACCOUNT_TYPES,
  AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE,
  IN_FRAME,
  IS_OFFSCREEN_TAB,
  MODAL_SIGN_AIR_GAP_TRANSACTION,
  PROTOCOLS,
} from '@/constants';
import { handleUnknownError, isAccountAirGap } from '@/utils';

import { useModals } from '@/composables/modals';
import { useAccounts } from '@/composables/accounts';
import { useDeepLinkApi } from '@/composables/deepLinkApi';
import { useAeSdk, useLedger } from '@/composables';
import { useAeMiddleware } from '@/protocols/aeternity/composables';
import {
  canRebuildTransactionForSigner,
  fetchAccountNextNonce,
  rebuildTransactionForSigner,
} from '@/protocols/aeternity/helpers';
import { SEED_LENGTH } from '@/protocols/aeternity/config';
import { usePermissions } from '@/composables/permissions';
import Logger from '@/lib/logger';

interface InternalOptions {
  fromAccount?: Encoded.AccountAddress;
}

/**
 * A pending wait for an Air Gap device's signature, which the caller must
 * `cancel` if it turns out not to be needed.
 */
interface IPendingAirGapSignature {
  promise: Promise<Encoded.Transaction>;
  cancel: () => void;
}

/**
 * Tags that don't need permission if they are not called from an aepp
 */

export class AeAccountHdWallet extends MemoryAccount {
  override readonly address: Encoded.AccountAddress;

  /**
   * The `isSigningAlreadyConfirmed` property
   * is used to not show an additional confirmation modal
   * at the time of the actual raw sign,
   * in case the user has already confirmed the action.
   */
  isSigningAlreadyConfirmed: boolean;

  nodeNetworkId: Ref<string | undefined>;

  constructor(nodeNetworkId: Ref<string | undefined>) {
    super(encode(Buffer.alloc(SEED_LENGTH), Encoding.AccountSecretKey));
    const aeAccount = AeAccountHdWallet.getAccount();
    this.address = aeAccount!.address as Encoded.AccountAddress;
    this.isSigningAlreadyConfirmed = false;
    this.nodeNetworkId = nodeNetworkId;
  }

  static getAccount(fromAccount?: Encoded.AccountAddress) {
    const { getLastActiveProtocolAccount, getAccountByProtocolAndAddress } = useAccounts();
    return fromAccount
      ? getAccountByProtocolAndAddress(PROTOCOLS.aeternity, fromAccount)
      : getLastActiveProtocolAccount(PROTOCOLS.aeternity);
  }

  /**
   * Whether an Air Gap device could end up signing - not whether it will. The
   * confirmation modal offers every account of the protocol as a signing
   * option, so this cannot be narrowed down to the account a request arrived
   * for.
   */
  private static hasAirGapAccount(): boolean {
    const { aeAccounts } = useAccounts();
    return aeAccounts.value.some(isAccountAirGap);
  }

  /**
   * In-memory signer for one of the wallet's accounts, used where the signing
   * key has to be named explicitly rather than resolved again downstream.
   *
   * Rejects the accounts whose key the wallet does not hold - a Ledger or an
   * Air Gap account has to be signed with through its device - exactly as
   * signing has always rejected them here.
   */
  private static getInMemorySigner(account?: IAccount): MemoryAccount {
    if (account && isAccountAirGap(account)) {
      throw new Error('AirGap sign not implemented yet');
    }
    if (!account?.secretKey || account.protocol !== PROTOCOLS.aeternity) {
      throw new Error('Unsupported protocol');
    }
    return new MemoryAccount(encode(account.secretKey, Encoding.AccountSecretKey));
  }

  override async signTransaction(
    txBase64: Encoded.Transaction,
    options: Parameters<AccountBase['signTransaction']>[1] & InternalOptions,
  ): Promise<Encoded.Transaction> {
    if (!this.nodeNetworkId.value) {
      // The initial node status request may have failed (e.g. no connectivity
      // right after a fresh browser start), leaving `nodeNetworkId` empty even
      // though the node is now reachable. Try to recover it before giving up so
      // signing works without forcing the user to switch networks.
      await useAeSdk().ensureNodeNetworkId();
    }
    if (!this.nodeNetworkId.value) {
      throw new Error('Not connected to any network');
    }

    const account = AeAccountHdWallet.getAccount(options?.fromAccount);
    if (account && isAccountAirGap(account) && !IS_OFFSCREEN_TAB) {
      const { openModal } = useModals();
      return openModal(MODAL_SIGN_AIR_GAP_TRANSACTION, { txRaw: txBase64 });
    }

    // If the tab is offscreen, we need to listen for the signed transaction
    // which will be sent from the confirmation modal. Which account signs is
    // the user's to pick there, so a device can end up signing even when the
    // request did not arrive for an Air Gap account - and the listener has to
    // be registered before the modal opens, while that is still unknown. Hence
    // "the wallet holds an Air Gap account" rather than "this request is for
    // one": narrowing it any further would drop the signature of an account
    // switched to in the modal.
    const airGapSignedTx: IPendingAirGapSignature | undefined = (
      IS_OFFSCREEN_TAB && AeAccountHdWallet.hasAirGapAccount()
    )
      ? AeAccountHdWallet.awaitAirGapSignedTransaction()
      : undefined;

    try {
      const { isDeepLinkUsed } = useDeepLinkApi({ doNotInitializeRouter: true });

      let tx: ITx | undefined;
      try {
        tx = unpackTx(txBase64) as unknown as ITx;
      } catch {
        tx = undefined;
      }
      const wasConfirmationAsked = isDeepLinkUsed || IS_OFFSCREEN_TAB || IN_FRAME;

      /**
       * Filled in only when the confirmation modal actually ran and resolved -
       * never on a standing permission that `checkOrAskPermission` auto-grants
       * without showing anything. That distinction matters: only a modal the
       * user actually saw can have picked a signing account, so only then does
       * that choice get to override `fromAccount` or trigger a rebuild.
       */
      let modalResolution: ISignModalResolution | undefined;

      if (wasConfirmationAsked) {
        const { checkOrAskPermission } = usePermissions();
        const permissionGranted = await checkOrAskPermission(
          METHODS.sign,
          options?.aeppOrigin,
          { ...options, txBase64, tx },
          (payload) => { modalResolution = payload; },
        );
        if (!permissionGranted) {
          throw new RpcRejectedByUserError();
        }
      }

      const signingAccount = modalResolution
        ? AeAccountHdWallet.getAccount(modalResolution.selectedAddress as Encoded.AccountAddress)
        : AeAccountHdWallet.getAccount(options?.fromAccount);

      if (signingAccount && isAccountAirGap(signingAccount) && IS_OFFSCREEN_TAB && airGapSignedTx) {
        // The device signs whatever the confirmation modal hands it, rebuild
        // included, so there is nothing left to do here but wait for the result
        // - in particular no rebuild, which would only spend a nonce request on
        // a transaction that is then thrown away, and could fail the signing
        // outright over a transaction the device has already signed.
        // Awaited here rather than returned, so the `finally` below only runs
        // once the signature has arrived.
        const signedTransaction = await airGapSignedTx.promise;
        return signedTransaction;
      }

      // Only rebuild when the user explicitly opted into it in the modal - a
      // mismatch alone is not consent, since it can also mean the transaction
      // was prepared for an account the wallet does not (or no longer) hold.
      const txToSign = (modalResolution?.rebuildForSelectedAccount && signingAccount?.address)
        ? await this.rebuildForSignerIfNeeded(
          txBase64,
          signingAccount.address as Encoded.AccountAddress,
        )
        : txBase64;

      if (signingAccount && signingAccount.type === ACCOUNT_TYPES.ledger) {
        const { signTransaction } = useLedger();
        const signedTransaction = await signTransaction(
          signingAccount.address as Encoded.AccountAddress,
          signingAccount.idx,
          txToSign,
        );
        if (!signedTransaction) {
          throw new RpcRejectedByUserError();
        }
        return signedTransaction;
      }

      this.isSigningAlreadyConfirmed = true;
      return await super.signTransaction(txToSign, {
        ...options,
        // `unsafeSign` resolves the signing key from `fromAccount` again, so it has
        // to name the same account the transaction was just rebuilt for. Leaving the
        // caller's value here would sign the rebuilt transaction with the wrong key.
        fromAccount: signingAccount?.address ?? options?.fromAccount,
        networkId: this.nodeNetworkId.value,
      } as any);
    } finally {
      // The listener has to be registered before the confirmation modal opens,
      // but by the time it closes it may have turned out to be unnecessary: the
      // user can pick a non-Air Gap account to sign with, or reject outright, in
      // which case nothing ever sends that message and the handler would sit
      // there forever.
      airGapSignedTx?.cancel();
    }
  }

  /**
   * Listen for the transaction an Air Gap device signs in the confirmation
   * popup, which is sent back to the offscreen tab over a runtime message.
   *
   * The listener must be registered before the popup opens, so it cannot be
   * known yet whether it will be needed - hence `cancel`, which the caller is
   * responsible for invoking once the outcome is known. Calling it after the
   * message has arrived is a no-op.
   */
  private static awaitAirGapSignedTransaction(): IPendingAirGapSignature {
    let handleMessage!: (msg: any) => void;
    const promise = new Promise<Encoded.Transaction>((resolve) => {
      handleMessage = (msg: any) => {
        if (msg.type === AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE) {
          browser.runtime.onMessage.removeListener(handleMessage);
          resolve(msg.payload);
        }
      };
      browser.runtime.onMessage.addListener(handleMessage);
    });
    return {
      promise,
      cancel: () => browser.runtime.onMessage.removeListener(handleMessage),
    };
  }

  /**
   * The sender is part of the transaction, so only the account it was prepared
   * for can produce a signature the node accepts. When the user deliberately
   * signs with another account - the confirmation modal only lets them confirm
   * that after opting into the rebuild - re-point the transaction at it and give
   * it a nonce valid for that account.
   */
  private async rebuildForSignerIfNeeded(
    txBase64: Encoded.Transaction,
    signerAddress: Encoded.AccountAddress,
  ): Promise<Encoded.Transaction> {
    if (
      !canRebuildTransactionForSigner(txBase64)
      || getTransactionSignerAddress(txBase64) === signerAddress
    ) {
      return txBase64;
    }

    const aeSdk = await useAeSdk().getAeSdk();
    return rebuildTransactionForSigner(
      txBase64,
      signerAddress,
      (address) => fetchAccountNextNonce(aeSdk.api, address),
    );
  }

  override async signMessage(
    message: string,
    options: Parameters<AccountBase['signMessage']>[1] & InternalOptions,
  ): Promise<Uint8Array> {
    let modalResolution: ISignModalResolution | undefined;

    if (IS_OFFSCREEN_TAB || IN_FRAME) {
      const { checkOrAskPermission } = usePermissions();
      const permissionGranted = await checkOrAskPermission(
        METHODS.signMessage,
        options.aeppOrigin,
        { message },
        (payload) => { modalResolution = payload; },
      );
      if (!permissionGranted) {
        throw new RpcRejectedByUserError();
      }
    }

    // Resolved after the modal so a switch made there is honoured, instead of
    // a snapshot taken before the user had a chance to pick an account.
    const account = modalResolution
      ? AeAccountHdWallet.getAccount(modalResolution.selectedAddress as Encoded.AccountAddress)
      : AeAccountHdWallet.getAccount(options?.fromAccount);

    if (account && isAccountAirGap(account)) {
      Logger.write({
        title: tg('airGap.signMessageErrorModal.title'),
        message: tg('airGap.signMessageErrorModal.msg'),
        type: 'api-response',
        modal: true,
      });
    }

    if (account && account.type === ACCOUNT_TYPES.ledger) {
      const { signMessage } = useLedger();
      const signedMessage = await signMessage(
        account.address as Encoded.AccountAddress,
        account.idx,
        message,
      );
      if (!signedMessage) {
        throw new RpcRejectedByUserError();
      }
      return signedMessage;
    }

    this.isSigningAlreadyConfirmed = true;
    return super.signMessage(
      message,
      { ...options, fromAccount: account?.address ?? options?.fromAccount },
    );
  }

  override async signTypedData(
    data: Encoded.ContractBytearray,
    aci: Parameters<AccountBase['signTypedData']>[1],
    options: Parameters<AccountBase['signTypedData']>[2] = {},
  ): Promise<Encoded.Signature> {
    let modalResolution: ISignModalResolution | undefined;

    if (IS_OFFSCREEN_TAB || IN_FRAME) {
      const dataType = new TypeResolver().resolveType(aci);
      const decodedData = new ContractByteArrayEncoder().decodeWithType(data, dataType);
      const {
        name, version, networkId, contractAddress,
      } = options;
      const opt = {
        name, version, networkId, contractAddress, aci, data, decodedData,
      };
      const bigintReplacer = (k: string, v: any) => (
        typeof v === 'bigint' ? `${v} (as BigInt)` : v
      );
      const message = `sign typed data:\n${JSON.stringify(opt, bigintReplacer, 2)}`;
      const { checkOrAskPermission } = usePermissions();
      const permissionGranted = await checkOrAskPermission(
        METHODS.signTypedData,
        options.aeppOrigin,
        { message },
        (payload) => { modalResolution = payload; },
      );
      if (!permissionGranted) {
        throw new RpcRejectedByUserError();
      }
    }

    const selectedAddress = modalResolution?.selectedAddress as Encoded.AccountAddress | undefined;

    this.isSigningAlreadyConfirmed = true;
    return super.signTypedData(
      data,
      aci,
      selectedAddress ? { ...options, fromAccount: selectedAddress } as typeof options : options,
    );
  }

  override async signDelegation(
    delegation: Encoded.Bytearray,
    options: Parameters<AccountBase['signDelegation']>[1] & InternalOptions = {},
  ): Promise<Encoded.Signature> {
    let message;
    let resolvedName;
    let modalResolution: ISignModalResolution | undefined;
    const { getMiddleware } = useAeMiddleware();

    if (IS_OFFSCREEN_TAB || IN_FRAME) {
      const params = unpackDelegation(delegation);
      switch (params.tag) {
        case DelegationTag.AensName:
          try {
            resolvedName = (await (await getMiddleware()).getName(params.nameId)).name;
          } catch (e) {
            handleUnknownError(e);
          }
          message = `sign delegation of ${resolvedName ?? params.nameId} to ${params.contractAddress}`;
          break;
        case DelegationTag.AensPreclaim:
          message = `sign delegation of name preclaim to ${params.contractAddress}`;
          break;
        case DelegationTag.AensWildcard:
          message = `sign delegation of all names management to ${params.contractAddress}`;
          break;
        case DelegationTag.Oracle:
          message = `sign delegation to allow ${params.contractAddress} operate oracle binded to current account`;
          break;
        case DelegationTag.OracleResponse:
          message = `sign delegation of ${params.queryId} to ${params.contractAddress}`;
          break;
        default:
          message = 'failed to distinguish delegation type';
      }
      const { checkOrAskPermission } = usePermissions();
      const permissionGranted = await checkOrAskPermission(
        METHODS.signDelegation,
        options.aeppOrigin,
        { message },
        (payload) => { modalResolution = payload; },
      );
      if (!permissionGranted) {
        throw new RpcRejectedByUserError();
      }
    }

    if (!this.nodeNetworkId.value) {
      await useAeSdk().ensureNodeNetworkId();
    }

    // Resolved after the modal so a switch made there is honoured, instead of
    // a snapshot taken before the user had a chance to pick an account.
    const account = modalResolution
      ? AeAccountHdWallet.getAccount(modalResolution.selectedAddress as Encoded.AccountAddress)
      : AeAccountHdWallet.getAccount(options?.fromAccount);

    // Unlike the other signing methods, this one cannot name the signing key in
    // the options it passes on: `MemoryAccount.signDelegation` builds the
    // payload and then hands it to `unsafeSign` without forwarding any of them,
    // so the account resolved above would be silently dropped and resolved
    // again - from state that is not guaranteed to have caught up with what the
    // user just picked. Sign with its key directly instead.
    return AeAccountHdWallet.getInMemorySigner(account)
      .signDelegation(delegation, { networkId: this.nodeNetworkId.value });
  }

  /**
   * Sign data without any confirmation.
   */
  override async unsafeSign(
    data: string | Uint8Array,
    options?: Record<string, any> & InternalOptions,
  ): Promise<Uint8Array> {
    let modalResolution: ISignModalResolution | undefined;

    if ((IN_FRAME || IS_OFFSCREEN_TAB) && !this.isSigningAlreadyConfirmed) {
      this.isSigningAlreadyConfirmed = false;
      const { checkOrAskPermission } = usePermissions();
      const permissionGranted = await checkOrAskPermission(
        METHODS.unsafeSign,
        options?.aeppOrigin,
        { ...options, data },
        (payload) => { modalResolution = payload; },
      );
      if (!permissionGranted) {
        throw new RpcRejectedByUserError('Rejected by user');
      }
    }

    // Resolved after the modal (when one ran) so the airGap check below and
    // the actual signing key both reflect what the user picked there, rather
    // than a snapshot taken before they had the chance to pick anything.
    const account = modalResolution
      ? AeAccountHdWallet.getAccount(modalResolution.selectedAddress as Encoded.AccountAddress)
      : AeAccountHdWallet.getAccount(options?.fromAccount);

    return AeAccountHdWallet.getInMemorySigner(account).unsafeSign(data);
  }
}
