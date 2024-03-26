/* eslint-disable class-methods-use-this */
import {
  AccountBase,
  DelegationTag,
  MemoryAccount,
  sign,
  RpcRejectedByUserError,
  unpackDelegation,
  unpackTx,
  Encoded,
  METHODS,
  Tag,
} from '@aeternity/aepp-sdk';
import { ContractByteArrayEncoder, TypeResolver } from '@aeternity/aepp-calldata';
import { Ref } from 'vue';
import type { ITx } from '@/types';
import { useModals } from '@/composables/modals';
import { useAccounts } from '@/composables/accounts';
import { useAeMiddleware } from '@/protocols/aeternity/composables';
import { usePermissions } from '@/composables/permissions';
import { MODAL_AIR_GAP_SIGN_TRANSACTION, PROTOCOLS } from '@/constants';
import { handleUnknownError } from '@/utils';

interface InternalOptions {
  fromAccount?: Encoded.AccountAddress;
}

/**
 * Tags that don't need permission if they are not called from an aepp
 */
const TAGS_TO_SIGN_WITHOUT_PERMISSION: Tag[] = [Tag.SpendTx, Tag.PayingForTx];

export class AeAccountHdWallet extends MemoryAccount {
  override readonly address: Encoded.AccountAddress;

  readonly isAirgap: boolean = false;

  nodeNetworkId: Ref<string | undefined>;

  constructor(nodeNetworkId: Ref<string | undefined>) {
    super(Buffer.alloc(64));
    const { getLastActiveProtocolAccount } = useAccounts();
    const aeAccount = getLastActiveProtocolAccount(PROTOCOLS.aeternity);
    this.address = aeAccount!.address as Encoded.AccountAddress;
    this.isAirgap = aeAccount?.type === 'airgap';
    this.nodeNetworkId = nodeNetworkId;
  }

  override async signTransaction(
    txBase64: Encoded.Transaction,
    options: Parameters<AccountBase['signTransaction']>[1],
  ): Promise<Encoded.Transaction> {
    if (!this.nodeNetworkId.value) {
      throw new Error('Not connected to any network');
    }

    if (this.isAirgap) {
      const { openModal } = useModals();
      return openModal(MODAL_AIR_GAP_SIGN_TRANSACTION, { txRaw: txBase64 });
    }

    const tx = unpackTx(txBase64) as any as ITx;
    if (!TAGS_TO_SIGN_WITHOUT_PERMISSION.includes(tx.tag!) || options?.aeppOrigin) {
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

    return super.signTransaction(txBase64, {
      ...options, // Mainly to pass the `fromAccount` property
      aeppOrigin: undefined,
      networkId: this.nodeNetworkId.value,
    } as any);
  }

  override async signMessage(
    message: string,
    options: Parameters<AccountBase['signMessage']>[1],
  ): Promise<Uint8Array> {
    if (this.isAirgap) {
      throw new Error('AirGap signMessage not implemented yet');
    }

    if (options?.aeppOrigin) {
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

    return super.signMessage(
      message,
      {
        ...options, // Mainly to pass the `fromAccount` property
        aeppOrigin: undefined,
      },
    );
  }

  override async signTypedData(
    data: Encoded.ContractBytearray,
    aci: Parameters<AccountBase['signTypedData']>[1],
    options: Parameters<AccountBase['signTypedData']>[2] = {},
  ): Promise<Encoded.Signature> {
    if (options?.aeppOrigin) {
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

    return super.signTypedData(
      data,
      aci,
      {
        ...options, // Mainly to pass the `fromAccount` property
        aeppOrigin: undefined,
      },
    );
  }

  override async signDelegation(
    delegation: Encoded.Bytearray,
    options: Parameters<AccountBase['signDelegation']>[1] = {},
  ): Promise<Encoded.Signature> {
    let message;
    let resolvedName;
    const { getMiddleware } = useAeMiddleware();
    if (options?.aeppOrigin) {
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
    if (this.isAirgap) {
      throw new Error('AirGap sign not implemented yet');
    }
    if (options?.aeppOrigin) {
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
    const { getLastActiveProtocolAccount, getAccountByAddress } = useAccounts();
    const account = (options?.fromAccount)
      ? getAccountByAddress(options.fromAccount)
      : getLastActiveProtocolAccount(PROTOCOLS.aeternity);

    if (account && account.secretKey && account.protocol === PROTOCOLS.aeternity) {
      return sign(data, account.secretKey);
    }

    throw new Error('Unsupported protocol');
  }
}
