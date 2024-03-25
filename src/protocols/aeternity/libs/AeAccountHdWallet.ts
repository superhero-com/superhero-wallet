/* eslint-disable class-methods-use-this */
import {
  AccountBase,
  MemoryAccount,
  sign,
  RpcRejectedByUserError,
  unpackTx,
  Encoded,
  METHODS,
  Tag,
  AensName,
} from '@aeternity/aepp-sdk';
import { ContractByteArrayEncoder, TypeResolver } from '@aeternity/aepp-calldata';
import { Ref } from 'vue';
import type { ITx } from '@/types';
import { useAccounts } from '@/composables/accounts';
import { usePermissions } from '@/composables/permissions';
import { PROTOCOLS } from '@/constants';

interface InternalOptions {
  fromAccount?: Encoded.AccountAddress;
}

/**
 * Tags that don't need permission if they are not called from an aepp
 */
const TAGS_TO_SIGN_WITHOUT_PERMISSION: Tag[] = [Tag.SpendTx, Tag.PayingForTx];

export class AeAccountHdWallet extends MemoryAccount {
  override readonly address: Encoded.AccountAddress;

  nodeNetworkId: Ref<string | undefined>;

  constructor(nodeNetworkId: Ref<string | undefined>) {
    super(Buffer.alloc(64));
    const { getLastActiveProtocolAccount } = useAccounts();
    this.address = getLastActiveProtocolAccount(PROTOCOLS.aeternity)!
      .address as Encoded.AccountAddress;
    this.nodeNetworkId = nodeNetworkId;
  }

  override async signTransaction(
    txBase64: Encoded.Transaction,
    options: Parameters<AccountBase['signTransaction']>[1],
  ): Promise<Encoded.Transaction> {
    if (!this.nodeNetworkId.value) {
      throw new Error('Not connected to any network');
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
      networkId: this.nodeNetworkId.value,
    });
  }

  override async signMessage(
    message: string,
    options: Parameters<AccountBase['signMessage']>[1],
  ): Promise<Uint8Array> {
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
      options, // Mainly to pass the `fromAccount` property
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
        METHODS.signMessage,
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
      options, // Mainly to pass the `fromAccount` property
    );
  }

  override async signDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    options: Parameters<AccountBase['signDelegationToContract']>[1] = {},
  ): Promise<Encoded.Signature> {
    if (options?.aeppOrigin) {
      const message = `sign delegation of name preclaim and oracle to ${contractAddress}`;
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

    return super.signDelegationToContract(contractAddress, {
      ...options, // Mainly to pass the `fromAccount` property
      networkId: this.nodeNetworkId.value,
    });
  }

  override async signNameDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    name: AensName,
    options: Parameters<AccountBase['signNameDelegationToContract']>[2] = {},
  ): Promise<Encoded.Signature> {
    if (options?.aeppOrigin) {
      const message = `sign delegation of ${name} to ${contractAddress}`;
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

    return super.signNameDelegationToContract(contractAddress, name, {
      ...options, // Mainly to pass the `fromAccount` property
      networkId: this.nodeNetworkId.value,
    });
  }

  override async signOracleQueryDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    oracleQueryId: Encoded.OracleQueryId,
    options: Parameters<AccountBase['signOracleQueryDelegationToContract']>[2] = {},
  ): Promise<Encoded.Signature> {
    if (options?.aeppOrigin) {
      const message = `sign delegation of ${oracleQueryId} to ${contractAddress}`;
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

    return super.signOracleQueryDelegationToContract(contractAddress, oracleQueryId, {
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
