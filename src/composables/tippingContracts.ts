import { computed, ref } from 'vue';
import { Contract } from '@aeternity/aepp-sdk';

import TippingV1ACI from '../lib/contracts/TippingV1ACI.json';
import TippingV2ACI from '../lib/contracts/TippingV2ACI.json';
import { useSdk } from './sdk';
import { watchUntilTruthy } from '../popup/utils';
import {
  IDefaultComposableOptions,
  INetwork,
  TippingV1ContractApi,
  TippingV2ContractApi,
} from '../types';

interface TippingContracts {
  tippingV1: Contract<TippingV1ContractApi>;
  tippingV2?: Contract<TippingV2ContractApi>;
}

let tippingV1: Contract<TippingV1ContractApi> | undefined;
let tippingV2: Contract<TippingV2ContractApi> | undefined;
const initializing = ref(false);

export function useTippingContracts({ store }: IDefaultComposableOptions) {
  const { getSdk, isTippingSupported } = useSdk({ store });

  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  async function initTippingContracts() {
    if (!isTippingSupported.value) {
      return;
    }
    initializing.value = true;
    const sdk = await getSdk();

    [
      tippingV1,
      tippingV2,
    ] = await Promise.all([
      sdk.initializeContract<TippingV1ContractApi>({
        aci: TippingV1ACI,
        address: activeNetwork.value.tipContractV1,
      }),
      activeNetwork.value.tipContractV2
        ? sdk.initializeContract<TippingV2ContractApi>({
          aci: TippingV2ACI,
          address: activeNetwork.value.tipContractV2,
        })
        : undefined,
    ]);

    initializing.value = false;
  }

  async function getTippingContracts(): Promise<TippingContracts> {
    if (
      !tippingV1
      || tippingV1.$options.address !== activeNetwork.value.tipContractV1
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
    getTippingContracts,
  };
}
