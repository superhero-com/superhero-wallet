<template>
  <div class="dashboard-base">
    <div style="padding: 0 16px; margin-bottom: var(--gap);">
      <Tabs>
        <Tab
          :to="{ name: ROUTE_ACCOUNT }"
        >
          <div style="line-height: 1.3em;">
            Accounts<br>
            <TotalWalletAmount
              :total-balance="balancesTotal"
              style="font-size: 13px; font-weight: normal;"
              class="total-amount"
            />
          </div>
        </Tab>
        <Tab
          :to="{ name: ROUTE_MULTISIG_ACCOUNT }"
        >
          <div style="line-height: 1.3em; text-align: center;">
            Multisig Vaults<br>
            <span style="font-size: 12px; opacity: 0.4; font-weight: normal;">
              Switch to see amount
            </span>
          </div>
        </Tab>
      </Tabs>
    </div>

    <div class="dashboard-base-swiper">
      <slot name="swiper" />
    </div>

    <div class="dashboard-base-cards">
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
import { PropType, defineComponent } from 'vue';
import type { IAccount, IFormSelectOption } from '@/types';
import { useUi } from '@/composables';
import { ROUTE_ACCOUNT, ROUTE_MULTISIG_ACCOUNT } from '@/popup/router/routeNames';

import DashboardCard from './DashboardCard.vue';
import TotalWalletAmount from './TotalWalletAmount.vue';
import Tab from './tabs/Tab.vue';
import Tabs from './tabs/Tabs.vue';

import WarningTriangleIcon from '../../icons/warning-triangle.svg?vue-component';

export default defineComponent({
  name: 'DashboardBase',
  components: {
    DashboardCard,
    TotalWalletAmount,
    Tab,
    Tabs,
  },
  props: {
    accounts: { type: Array as PropType<IAccount[]>, default: () => [] },
    accountsSelectOptions: { type: Array as PropType<IFormSelectOption[]>, default: null },
    activeAccountAddress: { type: String, default: '' },
    activeIdx: { type: Number, default: 0 },
    balancesTotal: { type: String, default: null },
  },
  emits: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    'select-account': (address: string) => undefined,
  },
  setup() {
    const { isSeedBackedUp } = useUi();

    return {
      ROUTE_ACCOUNT,
      ROUTE_MULTISIG_ACCOUNT,
      isSeedBackedUp,
      WarningTriangleIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables';
@use '@/styles/typography';
@use '@/styles/mixins';

.dashboard-base {
  display: flex;
  flex-direction: column;

  .dashboard-base-cards {
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
