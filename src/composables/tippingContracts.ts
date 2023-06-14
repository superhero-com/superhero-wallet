import { computed, ref } from '@vue/composition-api';
import TIPPING_V1_INTERFACE from 'tipping-contract/Tipping_v1_Interface.aes';
import TIPPING_V2_INTERFACE from 'tipping-contract/Tipping_v2_Interface.aes';
import { Contract } from '@aeternity/aepp-sdk-13';

import { RUNNING_IN_TESTS } from '../lib/environment';
import { useSdk13 } from './sdk13';
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
  const { getSdk } = useSdk13({ store });

  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  async function initTippingContracts() {
    if (!store.getters.tippingSupported && !RUNNING_IN_TESTS) {
      return;
    }
    initializing.value = true;
    const sdk = await getSdk();

    [
      tippingV1,
      tippingV2,
    ] = await Promise.all([
      sdk.initializeContract<TippingV1ContractApi>({
        sourceCode: TIPPING_V1_INTERFACE,
        address: activeNetwork.value.tipContractV1,
      }),
      activeNetwork.value.tipContractV2
        ? sdk.initializeContract<TippingV2ContractApi>({
          sourceCode: TIPPING_V2_INTERFACE,
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
