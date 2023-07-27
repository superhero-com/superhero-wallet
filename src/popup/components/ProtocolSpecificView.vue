<template>
  <Component
    :is="componentToDisplay"
    v-if="viewComponentName"
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

import { PropType, defineAsyncComponent, defineComponent } from 'vue';
import { useStore } from 'vuex';
import type { Protocol, ProtocolView, ProtocolViewsConfig } from '@/types';
import { DISTINCT_PROTOCOL_VIEWS } from '@/popup/utils';
import { useAccounts } from '@/composables';
import Logger from '@/lib/logger';

import aeternityViews from '@/protocols/aeternity/views';
import bitcoinViews from '@/protocols/bitcoin/views';

import InfoBox from './InfoBox.vue';

/**
 * All protocol related views (pages and modals).
 */
const views: Record<Protocol, ProtocolViewsConfig> = {
  aeternity: aeternityViews,
  bitcoin: bitcoinViews,
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
    const store = useStore();
    const { activeAccount } = useAccounts({ store });

    const importViewComponent = views[activeAccount.value.protocol]?.[props.viewComponentName];

    if (!importViewComponent) {
      Logger.write({
        message: `Failed to access "${props.viewComponentName}" component for the "${activeAccount.value.protocol}" protocol`,
        type: 'vue-error',
      });
    }

    const componentToDisplay = importViewComponent
      ? defineAsyncComponent(() => importViewComponent())
      : null;

    return {
      componentToDisplay,
    };
  },
});
</script>