<template>
  <div class="total-amount">
    <span>{{ totalAmount }}</span>
    <span
      class="label"
    >
      {{ isMultisig ? $t('common.totalMultisig') : $t('common.total') }}
    </span>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useCurrencies } from '../../composables';

export default defineComponent({
  props: {
    totalBalance: { type: String, required: true },
    isMultisig: Boolean,
  },
  setup(props) {
    const { getFormattedFiat } = useCurrencies();

    const totalAmount = computed(() => getFormattedFiat(+props.totalBalance));

    return {
      totalAmount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/typography';
@use '../../styles/variables';

.total-amount {
  @extend %face-sans-16-bold;

  color: variables.$color-white;
  line-height: 18px;
  margin-bottom: 12px;
  margin-left: 24px;

  .label {
    @extend %face-sans-14-medium;

    margin-left: 6px;
    line-height: 18px;
    opacity: 0.5;
  }
}
</style>
