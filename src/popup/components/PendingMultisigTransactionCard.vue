<template>
  <Panel
    v-if="pendingMultisigTransaction?.tx"
    class="pending-multisig-transaction-card"
    :header="$t('dashboard.pendingMultisigCard.title')"
  >
    <Transition name="page-transition">
      <AnimatedSpinner
        v-if="isLoading"
        class="spinner"
      />
      <div v-else>
        <TransactionListItem
          :multisig-transaction="pendingMultisigTransaction"
        />
      </div>
    </Transition>
  </Panel>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { usePendingMultisigTransaction } from '@/composables';

import Panel from './Panel.vue';
import TransactionListItem from './TransactionListItem.vue';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';

export default defineComponent({
  components: {
    AnimatedSpinner,
    Panel,
    TransactionListItem,
  },
  setup() {
    const { isLoading, pendingMultisigTransaction } = usePendingMultisigTransaction();

    return {
      isLoading,
      pendingMultisigTransaction,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.pending-multisig-transaction-card {
  .spinner {
    display: block;
    margin-inline: auto;
    height: 60px;
  }
}
</style>
