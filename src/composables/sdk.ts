import { ref } from 'vue';
import type {
  IDefaultComposableOptions,
  Protocol,
} from '@/types';
import { BaseProtocol } from '@/protocols/BaseProtocol';
import { AeternityProtocol } from '@/protocols/aeternity/AeternityProtocol';
import { BitcoinProtocol } from '@/protocols/bitcoin/BitcoinProtocol';
import { DogecoinProtocol } from '@/protocols/dogecoin/DogecoinProtocol';
import {
  PROTOCOL_AETERNITY,
  PROTOCOL_BITCOIN,
  PROTOCOL_DOGECOIN,
} from '@/popup/utils';
import { watchUntilTruthy } from '@/utils';
import { useAccounts } from './accounts';

const isSdkRegistryReady = ref(true);
const sdkRegistry: Partial<Record<Protocol, BaseProtocol>> = {};

export function useSdk({ store }: IDefaultComposableOptions) {
  const { activeAccount } = useAccounts({ store });

  function registerSdk(protocol: Protocol, instance: BaseProtocol) {
    if (sdkRegistry[protocol]) {
      throw new Error('Protocol instance already exists in the registry');
    }
    sdkRegistry[protocol] = instance;
  }

  function getSdkFromRegistry(protocol: Protocol): BaseProtocol | undefined {
    return sdkRegistry[protocol];
  }

  function initSdk(protocol: Protocol): BaseProtocol {
    switch (protocol) {
      case PROTOCOL_AETERNITY:
        return new AeternityProtocol(store);
      case PROTOCOL_BITCOIN:
        return new BitcoinProtocol();
      case PROTOCOL_DOGECOIN:
        return new DogecoinProtocol();
      default:
        throw new Error('Unknown protocol');
    }
  }

  /**
   * get SDK of given protocol or active account protocol
   */
  async function getSdk(targetProtocol?: Protocol): Promise<BaseProtocol> {
    const protocol = targetProtocol || activeAccount.value.protocol;
    if (!isSdkRegistryReady.value) {
      await watchUntilTruthy(isSdkRegistryReady);
    } else if (!getSdkFromRegistry(protocol)) {
      isSdkRegistryReady.value = false;
      registerSdk(protocol, initSdk(protocol));
      isSdkRegistryReady.value = true;
    }
    return getSdkFromRegistry(protocol)!;
  }

  return {
    getSdk,
  };
}
