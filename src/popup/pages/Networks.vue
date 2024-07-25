<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div
        data-cy="networks"
        class="networks"
      >
        <p class="text-description">
          {{ $t('pages.network.listLabel') }}
        </p>

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
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { defineComponent } from 'vue';
import { useNetworks } from '@/composables';
import { ROUTE_NETWORK_ADD } from '@/popup/router/routeNames';

import NetworkRow from '@/popup/components/NetworkRow.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import PlusCircleIcon from '@/icons/plus-circle.svg?vue-component';

export default defineComponent({
  components: {
    BtnMain,
    NetworkRow,
    IonPage,
    IonContent,
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
@use '@/styles/mixins';
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
