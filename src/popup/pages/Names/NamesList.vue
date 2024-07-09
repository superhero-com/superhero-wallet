<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg--lighter">
      <div class="names-list">
        <template v-if="namesForAccount.length">
          <NameItem
            v-for="(entry, index) in namesForAccount"
            :key="index"
            :name-entry="entry"
          />
        </template>
        <AnimatedSpinner
          v-else-if="areNamesFetching"
          class="spinner"
        />
        <RegisterName
          v-else
          :msg="$t('pages.names.list.no-names')"
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { computed, defineComponent, onUnmounted } from 'vue';
import { executeAndSetInterval } from '@/utils';
import { useAccounts, useAeSdk, useUi } from '@/composables';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';

import NameItem from '../../components/NameItem.vue';
import RegisterName from '../../components/RegisterName.vue';
import AnimatedSpinner from '../../../icons/animated-spinner.svg?vue-component';

const POLLING_INTERVAL = 10000;

export default defineComponent({
  components: {
    NameItem,
    AnimatedSpinner,
    RegisterName,
    IonPage,
    IonContent,
  },
  setup() {
    const { isAppActive } = useUi();
    const { activeAccount } = useAccounts();
    const { nodeNetworkId } = useAeSdk();
    const {
      areNamesFetching, ownedNames, preclaimedNames, updateOwnedNames,
    } = useAeNames();

    const namesForAccount = computed(
      () => [
        ...preclaimedNames.value[nodeNetworkId.value!]
          ? Object.values(preclaimedNames.value[nodeNetworkId.value!])
            .filter(({ address }) => address === activeAccount.value.address)
            .map((preclaimedName) => ({
              ...preclaimedName,
              pending: true,
            }))
          : [],
        ...ownedNames.value.filter(({ owner }) => owner === activeAccount.value.address),
      ],
    );

    const id = executeAndSetInterval(() => {
      if (isAppActive.value) {
        updateOwnedNames();
      }
    }, POLLING_INTERVAL);

    onUnmounted(() => {
      clearInterval(id);
    });

    return {
      areNamesFetching,
      namesForAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.names-list {
  padding: 4px 12px 0 12px;

  .name-item {
    margin-top: 1px;
  }

  .spinner {
    display: flex;
    width: 56px;
    height: 56px;
    margin: 72px auto 0 auto;
  }
}
</style>
