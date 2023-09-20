<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg--lighter">
      <div class="names-list">
        <template v-if="namesForAccount.length">
          <NameItem
            v-for="({ name, owner, autoExtend }, index) in namesForAccount"
            :key="index"
            :name="name"
            :address="owner"
            :auto-extend="autoExtend"
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
import { computed, defineComponent, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import type { IName } from '@/types';
import { executeAndSetInterval } from '@/utils';
import { useDispatch, useState } from '../../../composables/vuex';
import { useAccounts, useUi } from '../../../composables';
import NameItem from '../../components/NameItem.vue';
import RegisterName from '../../components/RegisterName.vue';
import AnimatedSpinner from '../../../icons/animated-spinner.svg?skip-optimize';

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
    const store = useStore();

    const { isAppActive } = useUi();
    const { activeAccount } = useAccounts({ store });
    const areNamesFetching = useState('names', 'areNamesFetching');
    const namesOwned = useState<IName[]>('names', 'owned');
    const fetchOwned = useDispatch('names/fetchOwned');

    const namesForAccount = computed(
      () => namesOwned.value.filter(({ owner }) => owner === activeAccount.value.address),
    );

    const id = executeAndSetInterval(() => {
      if (isAppActive.value) {
        fetchOwned();
      }
    }, POLLING_INTERVAL);

    onBeforeUnmount(() => {
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
@use '../../../styles/variables';
@use '../../../styles/typography';

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
