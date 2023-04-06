<template>
  <div
    class="balance-info"
    data-cy="balance-info"
  >
    <template v-if="isOnline">
      <AeBalance :balance="balance" />
      <div class="display-value">
        {{ currencyFormatted }}
      </div>
    </template>
    <MessageOffline
      v-else
      :text="$t('common.balanceUnavailable')"
      :horizontal="horizontalOfflineMessage"
      :disable-colors="!horizontalOfflineMessage"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useConnection, useCurrencies } from '../../composables';
import AeBalance from './AeBalance.vue';
import MessageOffline from './MessageOffline.vue';

export default defineComponent({
  components: {
    AeBalance,
    MessageOffline,
  },
  props: {
    balance: { type: Number, required: true },
    horizontalOfflineMessage: Boolean,
  },
  setup(props) {
    const { getFormattedFiat } = useCurrencies();
    const { isOnline } = useConnection();

    const currencyFormatted = computed(() => getFormattedFiat(props.balance));

    return {
      isOnline,
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
    @extend %face-sans-16-medium;

    color: rgba(variables.$color-white, 1);
    line-height: 18px;
    margin-top: 4px;
    opacity: 0.75;
  }
}
</style>
