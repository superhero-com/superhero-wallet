import { computed, ref } from 'vue';
import { Contract } from '@aeternity/aepp-sdk';

import { NETWORK_TYPE_MAINNET, NETWORK_TYPE_TESTNET } from '@/constants';
import TippingV1ACI from '@/protocols/aeternity/aci/TippingV1ACI.json';
import TippingV2ACI from '@/protocols/aeternity/aci/TippingV2ACI.json';
import { watchUntilTruthy } from '@/utils';
import {
  AeTippingContractAddresses,
  AeTippingContracts,
  AeTippingV1ContractApi,
  AeTippingV2ContractApi,
} from '@/protocols/aeternity/types';
import {
  AE_TIPPING_CONTRACTS_MAINNET,
  AE_TIPPING_CONTRACTS_TESTNET,
} from '@/protocols/aeternity/config';
import { useAeSdk } from './aeSdk';
import { useNetworks } from './networks';

let tippingV1: Contract<AeTippingV1ContractApi> | undefined;
let tippingV2: Contract<AeTippingV2ContractApi> | undefined;
const initializing = ref(false);

export function useTippingContracts() {
  const { activeNetwork } = useNetworks();
  const { getAeSdk, isTippingSupported } = useAeSdk();

  const tippingContractAddresses = computed((): AeTippingContractAddresses => {
    switch (activeNetwork.value.type) {
      case NETWORK_TYPE_MAINNET: return AE_TIPPING_CONTRACTS_MAINNET;
      case NETWORK_TYPE_TESTNET: return AE_TIPPING_CONTRACTS_TESTNET;
      default: return {};
    }
  });

  async function initTippingContracts() {
    if (!isTippingSupported.value || !tippingContractAddresses.value) {
      return;
    }
    initializing.value = true;
    const aeSdk = await getAeSdk();

    [
      tippingV1,
      tippingV2,
    ] = await Promise.all([
      Contract.initialize<AeTippingV1ContractApi>({
        ...aeSdk.getContext(),
        aci: TippingV1ACI,
        address: tippingContractAddresses.value.tippingV1,
      }),
      tippingContractAddresses.value.tippingV2
        ? Contract.initialize<AeTippingV2ContractApi>({
          ...aeSdk.getContext(),
          aci: TippingV2ACI,
          address: tippingContractAddresses.value.tippingV2,
        })
        : undefined,
    ]);

    initializing.value = false;
  }

  async function getTippingContracts(): Promise<AeTippingContracts> {
    if (
      !tippingV1
      || tippingV1.$options.address !== tippingContractAddresses.value?.tippingV1
    ) {
      await initTippingContracts();
    } else if (initializing.value) {
      await watchUntilTruthy(() => !initializing.value);
    }
    if (!tippingV1) {
      throw Error('failed to initialize tipping contract');
    }
    return { tippingV1, tippingV2 };
  }

  return {
    tippingContractAddresses,
    getTippingContracts,
  };
}
