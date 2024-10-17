<template>
  <div class="dashboard-base">
    <div class="dashboard-header">
      <div
        v-if="accounts.length > 1"
        class="dashboard-header-info"
      >
        <TotalWalletAmount
          :total-balance="balancesTotal"
          :is-multisig="isMultisig"
          class="total-amount"
        />

        <BtnPill
          class="account-select-btn"
          hollow
        >
          <FormSelect
            v-if="accounts.length > 5 && accountsSelectOptions"
            :default-text="$t('dashboard.selectAccount')"
            :options="accountsSelectOptions"
            :model-value="activeAccountAddress"
            class="account-select-input"
            unstyled
            account-select
            @update:model-value="(address: string) => $emit('select-account', address)"
          >
            <template #current-text>
              <div class="account-number">
                <span class="account-number-current">{{ activeIdx + 1 }}</span>
                / {{ accounts.length }}
              </div>
            </template>
          </FormSelect>
        </BtnPill>
      </div>
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
        :to="{ name: ROUTE_SEED_PHRASE_SETTINGS }"
        data-cy="backup-seed-phrase"
        variant="danger"
      />

      <slot name="cards" />
    </div>
  </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue';
import type { IAccount, IFormSelectOption, IMultisigAccount } from '@/types';
import { ROUTE_SEED_PHRASE_SETTINGS } from '@/popup/router/routeNames';
import { useUi } from '@/composables';

import DashboardCard from './DashboardCard.vue';
import TotalWalletAmount from './TotalWalletAmount.vue';
import FormSelect from './form/FormSelect.vue';
import BtnPill from './buttons/BtnPill.vue';

import WarningTriangleIcon from '../../icons/warning-triangle.svg?vue-component';

export default defineComponent({
  name: 'DashboardBase',
  components: {
    BtnPill,
    DashboardCard,
    FormSelect,
    TotalWalletAmount,
  },
  props: {
    accounts: { type: Array as PropType<IAccount[] | IMultisigAccount[]>, default: () => [] },
    accountsSelectOptions: { type: Array as PropType<IFormSelectOption[]>, default: null },
    activeAccountAddress: { type: String, default: '' },
    activeIdx: { type: Number, default: 0 },
    balancesTotal: { type: String, default: null },
    isMultisig: Boolean,
  },
  emits: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    'select-account': (address: string) => true,
  },
  setup() {
    const { isSeedBackedUp } = useUi();

    return {
      isSeedBackedUp,
      WarningTriangleIcon,
      ROUTE_SEED_PHRASE_SETTINGS,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.dashboard-base {
  display: flex;
  flex-direction: column;

  .dashboard-header-info {
    padding: 5px 20px 8px 24px;
    display: flex;
    align-items: center;

    .account-select-btn {
      padding: 0;
      margin-left: auto;
    }

    .account-select-input {
      padding: 4px 8px;
    }

    .account-number {
      @extend %face-sans-13-medium;

      margin-right: 2px;
      opacity: 0.5;
      line-height: 14px;
      letter-spacing: -0.5px;
    }
  }

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
