<template>
  <BtnBase
    :class="['account-card', { selected }]"
    :to="{ name: 'account-details' }"
    :disabled="!selected"
    :bg-color="color"
    data-cy="account-card"
  >
    <div class="top">
      <AccountInfo
        :account-idx="accountIdx"
        :color="color"
      />
    </div>

    <div class="middle">
      <BalanceInfo
        :account-idx="accountIdx"
      />
    </div>

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
  </BtnBase>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { IAccount } from '../../types';
import { useGetter } from '../../composables/vuex';
import { getAddressColor } from '../utils/avatar';
import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import BtnBase from './buttons/BtnBase.vue';

export default defineComponent({
  components: {
    AccountInfo,
    BalanceInfo,
    BtnBase,
  },
  props: {
    accountIdx: { type: Number, required: true },
    selected: Boolean,
  },
  setup(props) {
    const getTokenBalance = useGetter('fungibleTokens/getTokenBalance');
    const accounts = useGetter<IAccount[]>('accounts');
    const account = computed(() => accounts.value[props.accountIdx]);
    const totalTokens = computed(() => getTokenBalance.value(account.value.address).length);
    const color = computed(() => getAddressColor(account.value.address));

    return {
      totalTokens,
      color,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.account-card {
  display: flex;
  flex-direction: column;
  border-radius: variables.$border-radius-card;
  margin: 8px 16px 32px 16px;
  padding: 12px;
  text-decoration: none;
  color: inherit;

  &.selected {
    .account-info,
    .middle,
    .misc {
      opacity: 1;
    }
  }

  .account-info,
  .middle,
  .misc {
    opacity: 0.5;
  }

  .middle {
    margin-top: 5px;
    text-align: center;
  }

  .misc {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    width: 100%;
    margin-top: auto;

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
