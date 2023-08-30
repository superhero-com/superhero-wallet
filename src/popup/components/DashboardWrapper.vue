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
import { defineComponent } from 'vue';
import { useUi } from '@/composables';

import DashboardCard from './DashboardCard.vue';

import WarningTriangleIcon from '../../icons/warning-triangle.svg?vue-component';

export default defineComponent({
  name: 'DashboardWrapper',
  components: {
    DashboardCard,
  },
  setup() {
    const { isSeedBackedUp } = useUi();

    return {
      isSeedBackedUp,
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
