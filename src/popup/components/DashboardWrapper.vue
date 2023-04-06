<template>
  <div class="dashboard">
    <slot name="header" />

    <div class="dashboard-cards">
      <div
        v-if="$slots.buttons"
        class="buttons-row"
      >
        <slot name="buttons" />
      </div>

      <slot name="widgets" />

      <DashboardCard
        v-if="!backedUpSeed"
        :title="$t('dashboard.backUpCard.title')"
        :description="$t('dashboard.backUpCard.description')"
        :btn-text="$t('dashboard.backUpCard.button')"
        :icon="SubtractIcon"
        :to="{ name: 'settings-seed-phrase' }"
        data-cy="backup-seed-phrase"
        variant="danger"
      />

      <slot name="cards" />
    </div>
  </div>
</template>

<script lang="ts">
import { isEmpty } from 'lodash-es';
import {
  computed,
  defineComponent,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import { MODAL_TRANSFER_SEND } from '../utils';
import { useState } from '../../composables/vuex';
import { useModals } from '../../composables';

import DashboardCard from './DashboardCard.vue';

import SubtractIcon from '../../icons/subtract.svg?vue-component';

export default defineComponent({
  name: 'DashboardWrapper',
  components: {
    DashboardCard,
  },
  setup(props) {
    console.log(props);
    const { openModal } = useModals();
    const route = useRoute();

    const backedUpSeed = useState('backedUpSeed');
    const query = computed(() => route.query);

    watch(query, (value) => {
      if (!isEmpty(value)) {
        openModal(MODAL_TRANSFER_SEND);
      }
    }, { immediate: true });

    return {
      backedUpSeed,
      SubtractIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.dashboard {
  display: flex;
  flex-direction: column;

  .dashboard-cards {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    margin-top: 8px;
    padding-inline: var(--screen-padding-x);
    padding-bottom: var(--screen-padding-x);

    .buttons-row {
      display: flex;
      gap: var(--gap);
    }
  }
}
</style>
