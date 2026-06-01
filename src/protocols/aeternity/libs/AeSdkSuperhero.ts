/* eslint-disable class-methods-use-this */

import {
  AensName,
  AeSdkWallet,
  METHODS,
  sendTransaction,
  spend,
  Encoded,
} from '@aeternity/aepp-sdk';
import { Ref } from 'vue';
import type { IWalletInfo } from '@/types';
import { PROTOCOLS } from '@/constants';
import { useAccounts } from '@/composables/accounts';
import { AeAccountHdWallet } from './AeAccountHdWallet';

type ISpendOptions = Omit<Parameters<typeof spend>[2], 'onAccount' | 'onNode'>
  & {
    payload?: Encoded.Any; // support payload along with the transaction
  }

type IWalletPresenceInfo = Pick<IWalletInfo, 'id' | 'name' | 'origin' | 'type'>;

/**
 * The wallet-info shape required by the aepp-sdk RPC layer. Derived from the
 * base method so we stay in sync with the SDK without a fragile deep import.
 * Note its `networkId` is a required `string`: the dApp connection protocol
 * mandates it, so `getWalletInfo` must satisfy that even though we may not have
 * resolved a network id yet (see the cast below).
 */
type SdkWalletInfo = Awaited<ReturnType<AeSdkWallet['getWalletInfo']>>;

/**
 * Class extends `AeSdkWallet` from aepp-sdk-js
 * provides flexibility to manage the accounts the way wallet would like to handle
 */
export class AeSdkSuperhero extends AeSdkWallet {
  nodeNetworkId: Ref<string | undefined>;

  constructor(
    options: ConstructorParameters<typeof AeSdkWallet>[0],
    nodeNetworkId: Ref<string | undefined>,
  ) {
    super(options);
    this.nodeNetworkId = nodeNetworkId;
  }

  _resolveAccount() {
    // TODO cache the account instead of instantiating it whenever the library is asked for it
    return new AeAccountHdWallet(this.nodeNetworkId);
  }

  getAccounts() {
    type Accounts = ReturnType<InstanceType<typeof AeSdkWallet>['getAccounts']>;
    const accounts: Accounts = { connected: {}, current: {} };
    const { getLastActiveProtocolAccount } = useAccounts();
    const account = getLastActiveProtocolAccount(PROTOCOLS.aeternity)!;

    if (account) {
      accounts.current[account.address as Encoded.AccountAddress] = {};
    }

    return accounts;
  }

  addresses() {
    const { aeAccounts } = useAccounts();
    return aeAccounts.value.map(({ address }) => address as Encoded.AccountAddress);
  }

  spendWithCustomOptions(
    amount: string | number,
    recipientId: Encoded.AccountAddress | AensName,
    options: ISpendOptions,
  ): ReturnType<typeof sendTransaction> {
    return super.spend(amount, recipientId, options);
  }

  async getWalletInfo(): Promise<SdkWalletInfo> {
    // Prefer the network id resolved during node setup. Fall back to
    // `this.api.getNetworkId()` only when it is missing, and tolerate that
    // request failing: the node may be selected but momentarily unreachable
    // (e.g. right after a fresh browser start). Letting it throw here would
    // reject wallet info retrieval and break the dApp connection flow this
    // fallback is meant to stabilize.
    let networkId = this.nodeNetworkId.value;
    if (!networkId && this.isNodeConnected()) {
      try {
        networkId = await this.api.getNetworkId();
      } catch (error) {
        networkId = undefined;
      }
    }
    const walletInfo: IWalletInfo = {
      id: this.id,
      name: this.name,
      networkId: networkId as IWalletInfo['networkId'],
      origin: window.location.origin === 'file://' ? '*' : window.location.origin,
      type: this._type as any,
    };
    // The RPC contract requires `networkId: string`; during the brief startup
    // window it may still be `undefined`. Cast here at the single wire boundary
    // rather than weakening the SDK type for every caller.
    return walletInfo as SdkWalletInfo;
  }

  getWalletPresenceInfo(): IWalletPresenceInfo {
    return {
      id: this.id,
      name: this.name,
      origin: window.location.origin === 'file://' ? '*' : window.location.origin,
      type: this._type as any,
    };
  }

  shareWalletInfo(clientId: string): Promise<void> {
    (this as any)._getClient(clientId).rpc.notify(
      METHODS.readyToConnect,
      this.getWalletPresenceInfo(),
    );
    return Promise.resolve();
  }
}
