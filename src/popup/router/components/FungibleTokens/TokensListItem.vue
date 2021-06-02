<template>
  <RouterLink
    v-if="tokenData"
    class="tokens-list-item"
    :to="{
      name: 'token-details',
      params: { id: tokenData.contract },
    }"
  >
    <Avatar
      :address="tokenData.contract !== 'aeternity' ? tokenData.contract : ''"
      :src="tokenData.image || null"
    />
    <div class="details">
      <div>
        <Truncate :str="tokenData.name" />
        <div>
          <label>{{ $t('pages.fungible-tokens.mcap') }}</label>
          {{
            tokenData.market_cap
              ? formatCurrency(tokenData.market_cap)
              : $t('pages.fungible-tokens.not-available')
          }}
        </div>
      </div>
      <div>
        <TokenAmount
          :amount="+tokenData.convertedBalance || 0"
          :symbol="tokenData.symbol"
        />
        <div>
          <label>{{ $t('pages.fungible-tokens.price') }}</label>
          {{
            tokenData.current_price
              ? formatCurrency(tokenData.current_price)
              : $t('pages.fungible-tokens.not-available')
          }}
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<script>
import { mapGetters } from 'vuex';
import Avatar from '../Avatar';
import Truncate from '../Truncate';
import TokenAmount from '../TokenAmount';

export default {
  components: { Avatar, Truncate, TokenAmount },
  props: { tokenData: { type: Object, default: null } },
  computed: mapGetters(['formatCurrency']),
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';

.tokens-list-item {
  background-color: variables.$color-bg-1;
  margin-bottom: 3px;
  height: 50px;
  display: flex;
  align-items: center;
  padding: 7px 15px;
  color: unset;
  text-decoration: unset;

  &:first-child {
    margin-top: 3px;
  }

  .details {
    margin-left: 7px;
    flex-grow: 1;

    .truncate {
      max-width: 215px;
    }

    > div {
      display: flex;
      justify-content: space-between;
      line-height: 17px;
      font-size: 13px;
      color: variables.$color-light-grey;

      .title {
        font-size: 14px;
      }

      label {
        color: variables.$color-dark-grey;
      }

      :nth-child(1) {
        flex-grow: 1;
      }
    }
  }
}
</style>
