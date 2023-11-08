<template>
  <Component
    :is="componentToDisplay"
    v-if="viewComponentName"
    :ionic-lifecycle-status="ionicLifecycleStatus"
  />
  <div v-else>
    <InfoBox
      type="danger"
      text="Missing component name"
    />
  </div>
</template>

<script lang="ts">

/**
 * This components serves the purpose of loading a view component
 * related to active account's protocol. Mostly usable when defining the route
 * or displaying the modals.
 */

import {
  PropType,
  defineAsyncComponent,
  defineComponent,
  ref,
} from 'vue';
import type {
  IonicLifecycleStatus,
  WalletRouteMeta,
  Protocol,
  ProtocolView,
  ProtocolViewsConfig,
} from '@/types';
import { DISTINCT_PROTOCOL_VIEWS, PROTOCOL_AETERNITY } from '@/constants';
import { useAccounts, useNetworks } from '@/composables';
import Logger from '@/lib/logger';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import aeternityViews from '@/protocols/aeternity/views';
import bitcoinViews from '@/protocols/bitcoin/views';
import ethereumViews from '@/protocols/ethereum/views';

import { useRoute, useRouter } from 'vue-router';
import {
  onIonViewDidEnter,
  onIonViewDidLeave,
  onIonViewWillEnter,
  onIonViewWillLeave,
} from '@ionic/vue';
import InfoBox from './InfoBox.vue';

/**
 * All protocol related views (pages and modals).
 */
const views: Record<Protocol, ProtocolViewsConfig> = {
  aeternity: aeternityViews,
  bitcoin: bitcoinViews,
  ethereum: ethereumViews,
};

export default defineComponent({
  components: {
    InfoBox,
  },
  props: {
    viewComponentName: {
      type: String as PropType<ProtocolView>,
      required: true,
      validator: (val: ProtocolView) => DISTINCT_PROTOCOL_VIEWS.includes(val),
    },
  },
  setup(props) {
    const route = useRoute();
    const routeMeta = route.meta as WalletRouteMeta;
    const routeParams = route.params;
    const transactionOwner = routeParams.transactionOwner as string | undefined;

    const router = useRouter();

    const { activeNetwork } = useNetworks();
    const { activeAccount } = useAccounts();

    const ionicLifecycleStatus = ref<IonicLifecycleStatus>();

    const protocol = ((): Protocol => {
      if (routeMeta.isMultisig) {
        return PROTOCOL_AETERNITY;
      }
      if (transactionOwner) {
        const ownerProtocol = ProtocolAdapterFactory.getAdapterByAccountAddress(
          transactionOwner,
          activeNetwork.value.type,
        )?.protocol;
        if (ownerProtocol) {
          return ownerProtocol;
        }
      }
      return activeAccount.value.protocol;
    })();

    const importViewComponent = views[protocol]?.[props.viewComponentName!];

    if (!importViewComponent) {
      if (routeMeta.redirectIfNull) {
        router.replace({ name: routeMeta.redirectIfNull, replace: true });
      } else {
        Logger.write({
          message: `Failed to access "${props.viewComponentName}" component for the "${activeAccount.value.protocol}" protocol`,
          type: 'vue-error',
        });
      }
    }

    const componentToDisplay = importViewComponent
      ? defineAsyncComponent(() => importViewComponent())
      : null;

    onIonViewDidEnter(() => {
      ionicLifecycleStatus.value = 'didEnter';
    });

    onIonViewDidLeave(() => {
      ionicLifecycleStatus.value = 'didLeave';
    });

    // In case the component is a tab view, will enter will only be called
    // when we are switching to the tab from another tab
    // not when we are refreshing the page or navigating to the page containing the tab
    onIonViewWillEnter(() => {
      ionicLifecycleStatus.value = 'willEnter';
    });

    onIonViewWillLeave(() => {
      ionicLifecycleStatus.value = 'willLeave';
    });

    return {
      componentToDisplay,
      ionicLifecycleStatus,
    };
  },
});
</script>
