<template>
  <div class="transaction-speed-picker">
    <div class="radio-wrapper">
      <RadioButton
        v-for="(feeItem, index) in feeList"
        :key="index"
        :value="modelValue === index"
        :label="feeItem.label"
        has-label-effect
        @input="handleInput(index)"
      />
    </div>
    <p
      v-if="UNFINISHED_FEATURES"
      class="completion-time"
    >
      {{
        $t('modals.send.transactionWillBeCompleted', {
          time: secondsToRelativeTime(feeList[modelValue].time, true),
        })
      }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { IFeeItem } from '@/types';
import { secondsToRelativeTime } from '@/utils';
import { UNFINISHED_FEATURES } from '@/constants';

import RadioButton from '@/popup/components/RadioButton.vue';

export default defineComponent({
  components: { RadioButton },
  props: {
    feeList: {
      type: Array as PropType<IFeeItem[]>,
      required: true,
      validate: (val: string[]) => val.length === 3,
    },
    modelValue: { type: Number, default: 1 },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function handleInput(index: number) {
      emit('update:modelValue', index);
    }

    return {
      UNFINISHED_FEATURES,
      secondsToRelativeTime,
      handleInput,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';

.transaction-speed-picker {
  margin-top: 4px;
  margin-bottom: 16px;

  .radio-wrapper {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
    margin-bottom: 10px;
  }

  .completion-time {
    @extend %face-sans-15-regular;

    letter-spacing: 0;
    opacity: 0.75;
  }
}
</style>
