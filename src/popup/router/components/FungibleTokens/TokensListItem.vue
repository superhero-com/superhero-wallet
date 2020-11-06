<template>
  <RouterLink
    v-if="tokenData"
    class="token-row"
    :to="{
      name: 'token-details',
      params: { id: tokenData.contract },
    }"
  >
    <Avatar
      class="token-image"
      :address="tokenData.contract !== 'aeternity' ? tokenData.contract : ''"
      :src="tokenData.image || null"
    />
    <div class="token-info">
      <div>
        <div class="first-cell title text-ellipsis" :title="tokenData.name">
          {{ tokenData.name }}
        </div>
        <div class="second-cell">
          <label>{{ $t('pages.fungible-tokens.mcap') }}</label>
          <span>{{
            tokenData.market_cap
              ? formatCurrency(tokenData.market_cap)
              : $t('pages.fungible-tokens.not-available')
          }}</span>
        </div>
      </div>
      <div>
        <div class="first-cell amount">
          {{ tokenData.convertedBalance || '0.00' }}
          <span class="symbol">{{ tokenData.symbol }}</span>
          <FormatFiatCurrency :balance="tokenData.balanceCurrency || 0" />
        </div>
        <div class="second-cell">
          <label>{{ $t('pages.fungible-tokens.price') }}</label>
          <span>{{
            tokenData.current_price
              ? formatCurrency(tokenData.current_price)
              : $t('pages.fungible-tokens.not-available')
          }}</span>
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<script>
import { mapGetters } from 'vuex';
import Avatar from '../Avatar';
import FormatFiatCurrency from '../FormatFiatCurrency';

export default {
  components: {
    Avatar,
    FormatFiatCurrency,
  },
  props: {
    tokenData: Object,
    name: String,
  },
  computed: mapGetters(['formatCurrency']),
};
</script>

<style lang="scss" scoped>
@import '../../../../common/variables';

.token-row {
  background-color: $black-1;
  margin-bottom: 3px;
  height: 50px;
  display: flex;
  padding: 7px 15px;
  color: unset;
  text-decoration: unset;

  &:first-child {
    margin-top: 3px;
  }

  .token-image {
    margin-right: 7px;
  }
}

.token-info {
  width: 100%;

  > div {
    display: flex;
    line-height: 17px;
  }
}

.first-cell {
  width: 100%;

  &.title {
    color: $gray-1;
    font-size: 14px;
  }

  &.amount {
    font-size: 13px;

    .symbol {
      color: $secondary-color;
    }
  }
}

.second-cell {
  flex-shrink: 0;

  label,
  span {
    color: $gray-3;
    font-size: 13px;
  }

  span {
    color: $gray-1;
  }
}
</style>
