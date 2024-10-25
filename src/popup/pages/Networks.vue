<template>
  <PageWrapper :page-title="$t('pages.titles.networks')">
    <div
      data-cy="networks"
      class="networks"
    >
      <p
        class="text-description"
        v-text="$t('pages.network.listLabel')"
      />

      <div class="networks-list">
        <NetworkRow
          v-for="network in networks"
          :key="network.name"
          :network="network"
          :is-active="network.name === activeNetwork.name"
          @network-select="switchNetwork"
          @network-delete="deleteCustomNetwork"
        />
      </div>

      <BtnMain
        extend
        variant="muted"
        class="add-custom-network"
        data-cy="to-add"
        :text="$t('pages.network.addCustomNetwork')"
        :icon="PlusCircleIcon"
        :to="{ name: ROUTE_NETWORK_ADD }"
      />
    </div>
  </PageWrapper>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useNetworks } from '@/composables';
import { ROUTE_NETWORK_ADD } from '@/popup/router/routeNames';

import PageWrapper from '@/popup/components/PageWrapper.vue';
import NetworkRow from '@/popup/components/NetworkRow.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import PlusCircleIcon from '@/icons/plus-circle.svg?vue-component';

export default defineComponent({
  components: {
    PageWrapper,
    BtnMain,
    NetworkRow,
  },
  setup() {
    const {
      activeNetwork,
      networks,
      switchNetwork,
      deleteCustomNetwork,
    } = useNetworks();

    return {
      activeNetwork,
      networks,
      PlusCircleIcon,
      ROUTE_NETWORK_ADD,
      switchNetwork,
      deleteCustomNetwork,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.networks {
  padding-inline: var(--screen-padding-x);

  .networks-list {
    margin-top: 20px;
  }

  .add-custom-network {
    margin-block: 20px;
  }
}
</style>
