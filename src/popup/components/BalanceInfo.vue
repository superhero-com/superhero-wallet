<template>
  <div
    class="balance-info"
    data-cy="balance-info"
  >
    <AeBalance :balance="balance" />
    <div class="display-value">
      {{ currencyFormatted }}
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { useCurrencies } from '../../composables';
import AeBalance from './AeBalance.vue';

export default defineComponent({
  components: {
    AeBalance,
  },
  props: {
    balance: { type: Number, required: true },
  },
  setup(props) {
    const { getFormattedFiat } = useCurrencies();

    const currencyFormatted = computed(() => getFormattedFiat(props.balance));

    return {
      currencyFormatted,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.balance-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;

  .display-value {
    @extend %face-sans-16-regular;

    color: rgba(variables.$color-white, 1);
    line-height: 18px;
    margin-top: 2px;
    opacity: 0.75;
  }
}
</style>
