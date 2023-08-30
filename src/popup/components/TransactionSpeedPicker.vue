<template>
  <div class="transaction-speed-picker">
    <div class="radio-wrapper">
      <RadioButton
        v-for="(fee, index) in feeList"
        :key="fee"
        :value="selectedIndex === index"
        @input="handleInput(index)"
      >
        <p>
          {{ labels[index] }}
        </p>
      </RadioButton>
    </div>
    <p
      v-if="UNFINISHED_FEATURES"
      class="completion-time"
    >
      {{
        $t('modals.send.transactionWillBeCompleted', {
          time: secondsToRelativeTime(feeList[selectedIndex].time, true)
        })
      }}
    </p>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import BigNumber from 'bignumber.js';

import RadioButton from '@/popup/components/RadioButton.vue';
import { secondsToRelativeTime } from '@/utils';
import { UNFINISHED_FEATURES } from '@/constants';

type FeeItem = {
  fee: BigNumber,
  time: number, // time in seconds
}

export default defineComponent({
  components: { RadioButton },
  props: {
    feeList: {
      type: Array as PropType<FeeItem[]>,
      required: true,
      validate: (val: string[]) => val.length === 3,
    },
  },
  emits: ['changeFee'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const selectedIndex = ref(1);
    const labels = [t('common.transferSpeed.slow'), t('common.transferSpeed.medium'), t('common.transferSpeed.fast')];

    function handleInput(index: number) {
      selectedIndex.value = index;
      emit('changeFee', props.feeList[index].fee);
    }

    watch(
      () => props.feeList,
      () => {
        emit('changeFee', props.feeList[selectedIndex.value].fee);
      },
      { immediate: true },
    );

    return {
      UNFINISHED_FEATURES,
      labels,
      selectedIndex,
      secondsToRelativeTime,
      handleInput,
    };
  },
});
</script>

<style lang="scss" scoped>
@import '@/styles/typography';

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
