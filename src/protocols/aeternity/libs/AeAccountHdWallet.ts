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
} from '@aeternity/aepp-sdk';
import { Ref } from 'vue';
import type { ITx } from '@/types';
import { useAccounts } from '@/composables/accounts';
import { usePermissions } from '@/composables/permissions';
import { PROTOCOL_AETERNITY } from '@/constants';

interface InternalOptions {
  fromAccount?: Encoded.AccountAddress;
}

export class AeAccountHdWallet extends AccountBase {
  override readonly address: Encoded.AccountAddress;

  nodeNetworkId: Ref<string | undefined>;

  constructor(nodeNetworkId: Ref<string | undefined>) {
    super();
    const { getLastActiveProtocolAccount } = useAccounts();
    this.address = getLastActiveProtocolAccount(PROTOCOL_AETERNITY)!.address;
    this.nodeNetworkId = nodeNetworkId;
  }

  override async signTransaction(
    txBase64: Encoded.Transaction,
    options: Parameters<AccountBase['signTransaction']>[1],
  ): Promise<Encoded.Transaction> {
    if (!this.nodeNetworkId.value) {
      throw new Error('Not connected to any network');
    }
    if (options?.aeppOrigin) {
      const { checkOrAskPermission } = usePermissions();
      const tx = unpackTx(txBase64) as any as ITx;
      const permissionGranted = await checkOrAskPermission(
        options.aeppOrigin,
        METHODS.sign,
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
        options.aeppOrigin,
        METHODS.signMessage,
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
      : getLastActiveProtocolAccount(PROTOCOL_AETERNITY);

    if (account && account.secretKey && account.protocol === PROTOCOL_AETERNITY) {
      return sign(data, Buffer.from(account.secretKey, 'hex'));
    }

    throw new Error('Unsupported protocol');
  }
}
