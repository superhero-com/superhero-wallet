<template>
  <span class="consensus-approved-label">
    <template v-if="isConsensusReached">
      {{ $t('multisig.approved') }}
    </template>
    <template v-else>
      <PendingIcon class="icon" />
      {{ $t('multisig.consensusPending') }}
    </template>
    &hairsp;
    <ConsensusLabel
      :confirmations-required="confirmationsRequired"
      :has-pending-transaction="hasPendingTransaction"
      :default-confirmed-by="defaultConfirmedBy"
      :confirmed-by="confirmedBy"
      :signers="signers"
    />
    <template v-if="isConsensusReached">
      .
      {{ $t('multisig.waitingToBeSent') }}
    </template>
  </span>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import ConsensusLabel from './ConsensusLabel.vue';
import PendingIcon from '../../icons/animated-pending.svg?vue-component';

export default defineComponent({
  components: {
    ConsensusLabel,
    PendingIcon,
  },
  props: {
    signers: { type: Array as PropType<string[]>, required: true },
    confirmedBy: { type: Array as PropType<string[]>, default: () => [] },
    confirmationsRequired: { type: Number, required: true },
    defaultConfirmedBy: { type: Number, default: 0 },
    hasPendingTransaction: Boolean,
  },
  setup(props) {
    const localConfirmedBy = computed(
      () => (props.hasPendingTransaction)
        ? props.confirmedBy?.length
        : props.defaultConfirmedBy,
    );

    const isConsensusReached = computed(
      () => localConfirmedBy.value === props.confirmationsRequired,
    );

    return {
      localConfirmedBy,
      isConsensusReached,
    };
  },
});
</script>

<style lang="scss">
@use '../../styles/typography';

.consensus-approved-label {
  @extend %face-sans-12-medium;

  display: flex;
  align-items: center;

  .icon {
    width: 16px;
    height: 16px;
    margin-right: 6px;
  }
}
</style>
