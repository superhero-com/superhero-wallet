<template>
  <Modal
    from-bottom
    has-close-button
    @close="reject()"
  >
    <p
      class="text-heading-1 text-center"
      v-text="$t('pages.network.connectToNetwork')"
    />
    <BtnSubheader
      v-for="network in defaultNetworks"
      :key="network.type"
      :header="network.name"
      :subheader="
        (network.name === activeNetwork.name)
          ? $t('pages.network.connectedTo', { name: network.name.toLowerCase() })
          : $t('pages.network.connectTo', { name: network.name.toLowerCase() })
      "
      :icon="(network.type === NETWORK_TYPE_MAINNET) ? GlobeIcon : GlobeCogIcon"
      :selected="network.name === activeNetwork.name"
      icon-size="lg"
      @click="switchNetworkAndClose(network.name)"
    />

    <BtnSubheader
      :to="{ name: ROUTE_NETWORK_SETTINGS }"
      :icon="ThreeDotsIcon"
      :header="$t('pages.network.moreNetworks')"
      :subheader="$t('pages.network.viewAndManage')"
      @click="resolve()"
    />
  </Modal>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue';
import type { RejectCallback, ResolveCallback } from '@/types';
import { NETWORK_TYPE_MAINNET } from '@/constants';
import { useNetworks } from '@/composables';
import { ROUTE_NETWORK_SETTINGS } from '@/popup/router/routeNames';

import Modal from '@/popup/components/Modal.vue';
import BtnSubheader from '@/popup/components/buttons/BtnSubheader.vue';

import GlobeIcon from '@/icons/globe.svg?vue-component';
import GlobeCogIcon from '@/icons/globe-cog.svg?vue-component';
import ThreeDotsIcon from '@/icons/three-dots.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnSubheader,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup(props) {
    const {
      activeNetwork,
      defaultNetworks,
      customNetworks,
      switchNetwork,
    } = useNetworks();

    function switchNetworkAndClose(name: string) {
      if (name === activeNetwork.value.name) {
        props.resolve();
      } else {
        switchNetwork(name);

        // Add little delay to give visual feedback of changing the active network button
        setTimeout(() => props.resolve(), 500);
      }
    }

    return {
      ROUTE_NETWORK_SETTINGS,
      NETWORK_TYPE_MAINNET,
      GlobeIcon,
      GlobeCogIcon,
      ThreeDotsIcon,
      activeNetwork,
      defaultNetworks,
      customNetworks,
      switchNetworkAndClose,
    };
  },
});
</script>
