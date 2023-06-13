import { computed, ref } from '@vue/composition-api';
import TIPPING_V1_INTERFACE from 'tipping-contract/Tipping_v1_Interface.aes';
import TIPPING_V2_INTERFACE from 'tipping-contract/Tipping_v2_Interface.aes';

import { useSdk } from './sdk';
import { watchUntilTruthy } from '../popup/utils';
import {
  IDefaultComposableOptions,
  INetwork,
} from '../types';

const tippingV1 = ref<any>(null);
const tippingV2 = ref<any>(null);
const initializing = ref(false);

export function useTippingContracts({ store }: IDefaultComposableOptions) {
  const { getSdk } = useSdk({ store });

  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);
  const tippingSupported = computed(() => store.getters.tippingSupported);

  async function initTippingContracts() {
    if (!tippingSupported && !process.env.RUNNING_IN_TESTS) {
      return;
    }
    initializing.value = true;
    const sdk = await getSdk();

    const [
      contractInstanceV1,
      contractInstanceV2,
    ] = await Promise.all([
      sdk.getContractInstance({
        source: TIPPING_V1_INTERFACE,
        contractAddress: activeNetwork.value.tipContractV1,
      }),
      activeNetwork.value.tipContractV2
        ? sdk.getContractInstance({
          source: TIPPING_V2_INTERFACE,
          contractAddress: activeNetwork.value.tipContractV2,
        })
        : null,
    ]);
    tippingV1.value = contractInstanceV1;
    tippingV2.value = contractInstanceV2;

    initializing.value = false;
  }

  async function getTippingContracts(): Promise<any> {
    if (
      !tippingV1.value
      || tippingV1.value.deployInfo.address !== activeNetwork.value.tipContractV1
    ) {
      await initTippingContracts();
    } else if (initializing.value) {
      await watchUntilTruthy(tippingV1);
    }
    return { tippingV1, tippingV2 };
  }

  return {
    initTippingContracts,
    getTippingContracts,
  };
}
