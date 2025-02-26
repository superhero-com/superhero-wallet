/* eslint-disable class-methods-use-this */
import {
  AccountBase,
  DelegationTag,
  MemoryAccount,
  RpcRejectedByUserError,
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
import type { ITx } from '@/types';
import {
  ACCOUNT_TYPES,
  AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE,
  IS_OFFSCREEN_TAB,
  MODAL_SIGN_AIR_GAP_TRANSACTION,
  PROTOCOLS,
} from '@/constants';
import { handleUnknownError, isAccountAirGap } from '@/utils';

import { useModals } from '@/composables/modals';
import { useAccounts } from '@/composables/accounts';
import { useDeepLinkApi } from '@/composables/deepLinkApi';
import { useLedger } from '@/composables';
import { useAeMiddleware } from '@/protocols/aeternity/composables';
import { SEED_LENGTH } from '@/protocols/aeternity/config';
import { usePermissions } from '@/composables/permissions';
import Logger from '@/lib/logger';

interface InternalOptions {
  fromAccount?: Encoded.AccountAddress;
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
    const { getLastActiveProtocolAccount, getAccountByAddress } = useAccounts();
    return fromAccount
      ? getAccountByAddress(fromAccount)
      : getLastActiveProtocolAccount(PROTOCOLS.aeternity);
  }

  override async signTransaction(
    txBase64: Encoded.Transaction,
    options: Parameters<AccountBase['signTransaction']>[1] & InternalOptions,
  ): Promise<Encoded.Transaction> {
    if (!this.nodeNetworkId.value) {
      throw new Error('Not connected to any network');
    }

    const account = AeAccountHdWallet.getAccount(options?.fromAccount);
    let signedTx: Promise<Encoded.Transaction> | undefined;
    if (account && isAccountAirGap(account)) {
      // If the tab is offscreen, we need to listen for the signed transaction
      // which will be sent from the confirmation modal
      if (IS_OFFSCREEN_TAB) {
        signedTx = new Promise((resolve) => {
          const handleMessage = async (msg: any) => {
            if (msg.type === AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE) {
              browser.runtime.onMessage.removeListener(handleMessage);
              resolve(msg.payload);
            }
          };
          browser.runtime.onMessage.addListener(handleMessage);
        });
      } else {
        const { openModal } = useModals();
        return openModal(MODAL_SIGN_AIR_GAP_TRANSACTION, { txRaw: txBase64 });
      }
    }

    const { isDeepLinkUsed } = useDeepLinkApi({ doNotInitializeRouter: true });

    let tx: ITx | undefined;
    try {
      tx = unpackTx(txBase64) as unknown as ITx;
    } catch {
      tx = undefined;
    }
    if (isDeepLinkUsed || IS_OFFSCREEN_TAB) {
      const { checkOrAskPermission } = usePermissions();
      const permissionGranted = await checkOrAskPermission(
        METHODS.sign,
        options?.aeppOrigin,
        { ...options, txBase64, tx },
      );
      if (!permissionGranted) {
        throw new RpcRejectedByUserError();
      }
    }

    if (account && account.type === ACCOUNT_TYPES.ledger) {
      const { signTransaction } = useLedger();
      const signedTransaction = await signTransaction(
        account.address as Encoded.AccountAddress,
        account.idx,
        txBase64,
      );
      if (!signedTransaction) {
        throw new RpcRejectedByUserError();
      }
      return signedTransaction;
    }

    if (account && isAccountAirGap(account) && IS_OFFSCREEN_TAB && signedTx) {
      return signedTx;
    }

    this.isSigningAlreadyConfirmed = true;
    return super.signTransaction(txBase64, {
      ...options, // Mainly to pass the `fromAccount` property
      networkId: this.nodeNetworkId.value,
    } as any);
  }

  override async signMessage(
    message: string,
    options: Parameters<AccountBase['signMessage']>[1] & InternalOptions,
  ): Promise<Uint8Array> {
    const account = AeAccountHdWallet.getAccount(options?.fromAccount);
    if (account && isAccountAirGap(account)) {
      Logger.write({
        title: tg('airGap.signMessageErrorModal.title'),
        message: tg('airGap.signMessageErrorModal.msg'),
        type: 'api-response',
        modal: true,
      });
    }

    if (IS_OFFSCREEN_TAB) {
      const { checkOrAskPermission } = usePermissions();
      const permissionGranted = await checkOrAskPermission(
        METHODS.signMessage,
        options.aeppOrigin,
        { message },
      );
      if (!permissionGranted) {
        throw new RpcRejectedByUserError();
      }
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
      options, // Mainly to pass the `fromAccount` property
    );
  }

  override async signTypedData(
    data: Encoded.ContractBytearray,
    aci: Parameters<AccountBase['signTypedData']>[1],
    options: Parameters<AccountBase['signTypedData']>[2] = {},
  ): Promise<Encoded.Signature> {
    if (IS_OFFSCREEN_TAB) {
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
      );
      if (!permissionGranted) {
        throw new RpcRejectedByUserError();
      }
    }

    this.isSigningAlreadyConfirmed = true;
    return super.signTypedData(
      data,
      aci,
      options, // Mainly to pass the `fromAccount` property
    );
  }

  override async signDelegation(
    delegation: Encoded.Bytearray,
    options: Parameters<AccountBase['signDelegation']>[1] = {},
  ): Promise<Encoded.Signature> {
    let message;
    let resolvedName;
    const { getMiddleware } = useAeMiddleware();

    if (IS_OFFSCREEN_TAB) {
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
      );
      if (!permissionGranted) {
        throw new RpcRejectedByUserError();
      }
    }

    this.isSigningAlreadyConfirmed = true;
    return super.signDelegation(delegation, {
      ...options, // Mainly to pass the `fromAccount` property
      networkId: this.nodeNetworkId.value,
    });
  }

  /**
   * Sign data without any confirmation.
   */
  override async sign(
    data: string | Uint8Array,
    options?: Record<string, any> & InternalOptions,
  ): Promise<Uint8Array> {
    const account = AeAccountHdWallet.getAccount(options?.fromAccount);
    if (account && isAccountAirGap(account)) {
      throw new Error('AirGap sign not implemented yet');
    }

    if (IS_OFFSCREEN_TAB && !this.isSigningAlreadyConfirmed) {
      this.isSigningAlreadyConfirmed = false;
      const { checkOrAskPermission } = usePermissions();
      const permissionGranted = await checkOrAskPermission(
        METHODS.unsafeSign,
        options?.aeppOrigin,
        { ...options, data },
      );
      if (!permissionGranted) {
        throw new RpcRejectedByUserError('Rejected by user');
      }
    }
    if (account && account.secretKey && account.protocol === PROTOCOLS.aeternity) {
      return new MemoryAccount(
        encode(account.secretKey.subarray(0, SEED_LENGTH), Encoding.AccountSecretKey),
      ).sign(data);
    }

    throw new Error('Unsupported protocol');
  }
}
