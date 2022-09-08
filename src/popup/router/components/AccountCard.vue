<template>
  <RouterLink
    class="account-card"
    :style="cardCssProps"
    :to="{ name: 'account-details' }"
  >
    <AccountInfo
      :account-idx="accountIdx"
      :color="color"
    />

    <BalanceInfo :account-idx="accountIdx" />
    <div class="misc">
      <div class="total-tokens">
        <span class="digit">
          {{ totalTokens }}
        </span>
        <span class="wording">
          {{ $t('pages.fungible-tokens.tokens') }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>

<script>
import { mapGetters } from 'vuex';
import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import { getAddressColor } from '../../utils/avatar';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
  },
  props: {
    accountIdx: { type: Number, required: true },
  },
  computed: {
    ...mapGetters('fungibleTokens', ['getTokenBalance']),
    ...mapGetters(['accounts']),
    cardCssProps() {
      return { 'background-color': this.color };
    },
    totalTokens() {
      return this.getTokenBalance(this.accounts[this.accountIdx].address).length;
    },
    color() {
      return getAddressColor(this.accounts[this.accountIdx].address);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.account-card {
  display: flex;
  flex-direction: column;
  width: 328px;
  height: 192px;
  border-radius: 16px;
  margin: 8px 16px 32px 16px;
  padding: 12px;
  align-items: flex-start;
  text-decoration: none;
  color: inherit;
  cursor: pointer;

  .balance-info {
    margin-top: 12px;
    align-self: center;
  }

  .misc {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    flex: 1;

    .total-tokens {
      @extend %face-sans-14-medium;

      line-height: 16px;

      .wording {
        opacity: 0.85;
      }
    }
  }
}
</style>
