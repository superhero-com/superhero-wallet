<template>
  <span class="consensus-label">
    {{ localConfirmedBy }}/{{ confirmationsRequired }}
    {{ $t('common.of') }}
    {{ totalConfirmations }}
  </span>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

export default defineComponent({
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

    const totalConfirmations = computed(() => props.signers.length);

    return {
      localConfirmedBy,
      totalConfirmations,
    };
  },
});
</script>
