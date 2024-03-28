/* eslint-disable class-methods-use-this */
import {
  AccountBase,
  sign,
  messageToHash,
  RpcRejectedByUserError,
  unpackTx,
  Encoded,
  METHODS,
  buildTx,
  Tag,
  decode,
  signJWT,
} from '@aeternity/aepp-sdk';
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

export class AeAccountHdWallet extends AccountBase {
  override readonly address: Encoded.AccountAddress;

  nodeNetworkId: Ref<string | undefined>;

  constructor(nodeNetworkId: Ref<string | undefined>) {
    super();
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
        throw new RpcRejectedByUserError('Rejected by user');
      }
    }

    const encodedTx = decode(txBase64);
    const signature = await this.sign(
      Buffer.concat([
        Buffer.from(this.nodeNetworkId.value),
        Buffer.from(encodedTx),
      ]),
      options, // Mainly to pass the `fromAccount` property
    );
    return buildTx({ tag: Tag.SignedTx, encodedTx, signatures: [signature] });
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
        throw new RpcRejectedByUserError('Rejected by user');
      }
    }

    return this.sign(
      messageToHash(message),
      options, // Mainly to pass the `fromAccount` property
    );
  }

  override async signJWT(
    message: object,
    options: Parameters<AccountBase['signJWT']>[1] & InternalOptions,
  ): Promise<`${string}.${string}`> {
    if (options?.aeppOrigin) {
      const { checkOrAskPermission } = usePermissions();
      const permissionGranted = await checkOrAskPermission(
        METHODS.signJWT,
        options.aeppOrigin,
        { message: JSON.stringify(message, null, 2), jwt: true },
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
      return signJWT(
        message,
        account.secretKey,
      );
    }

    throw new Error('Unsupported protocol');
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
