<template>
  <div
    ref="dashboardWrapperEl"
    class="dashboard"
  >
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
        v-if="!isSeedBackedUp"
        :title="$t('dashboard.backUpCard.title')"
        :description="$t('dashboard.backUpCard.description')"
        :btn-text="$t('dashboard.backUpCard.button')"
        :icon="WarningTriangleIcon"
        :to="{ name: 'settings-seed-phrase' }"
        data-cy="backup-seed-phrase"
        variant="danger"
      />

      <slot name="cards" />
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
} from 'vue';
import { useUi, useViewport } from '@/composables';

import DashboardCard from './DashboardCard.vue';

import WarningTriangleIcon from '../../icons/warning-triangle.svg?vue-component';

export default defineComponent({
  name: 'DashboardWrapper',
  components: {
    DashboardCard,
  },
  setup() {
    const dashboardWrapperEl = ref<HTMLElement | null>(null);

    const { isSeedBackedUp } = useUi();
    const { initViewport } = useViewport();

    onMounted(() => {
      initViewport(dashboardWrapperEl.value?.parentElement!);
    });

    return {
      isSeedBackedUp,
      dashboardWrapperEl,
      WarningTriangleIcon,
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
