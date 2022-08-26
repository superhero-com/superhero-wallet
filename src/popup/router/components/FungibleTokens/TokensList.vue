<template>
  <div class="tokens-list">
    <TokensListItem
      v-for="value in filteredResults"
      :key="value.contractId || value.id"
      :token-data="value"
    />
    <div v-if="checkZeroBalance(aeternityToken) && filteredResults.length <= 1">
      <div class="tokens-msg">
        {{ $t('pages.fungible-tokens.noTokens') }}
      </div>

      <div class="buttons">
        <Button
          small
          backgroundless
          icon-text
          :to="{ name: 'transfer-receive' }"
        >
          <Receive />
          {{ $t('pages.fungible-tokens.receiveTokens') }}
        </Button>
        <Button
          fill="alternative"
          small
          backgroundless
          icon-text
          :to="SIMPLEX_URL"
        >
          <Buy />
          {{ $t('pages.fungible-tokens.buyAe') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script>
import { SIMPLEX_URL } from '../../../utils/constants';
import TokensListItem from './TokensListItem.vue';
import Button from '../Button.vue';
import Receive from '../../../../icons/receive.svg?vue-component';
import Buy from '../../../../icons/buy.svg?vue-component';
import balanceListMixin from '../../../../mixins/balanceListMixin';

export default {
  components: {
    TokensListItem,
    Button,
    Receive,
    Buy,
  },
  mixins: [balanceListMixin(false)],
  props: {
    searchTerm: { type: String, default: '' },
  },
  data: () => ({
    SIMPLEX_URL,
  }),
  methods: {
    checkZeroBalance(token) {
      return !+token.convertedBalance?.toString();
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';

.tokens-list {
  .tokens-msg {
    margin: 40px 0;
    text-align: center;

    @extend %face-sans-15-medium;

    color: variables.$color-light-grey;
  }

  .buttons {
    display: flex;
    justify-content: center;

    .button {
      margin: 0;

      &:first-child {
        margin-right: 16px;
      }
    }
  }
}
</style>
