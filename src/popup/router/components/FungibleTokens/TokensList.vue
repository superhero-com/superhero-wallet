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
          hollow
          icon-text
          @click="openReceiveModal"
        >
          <Receive />
          {{ $t('pages.fungible-tokens.receiveTokens') }}
        </Button>
        <Button
          fill="alternative"
          small
          hollow
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
import { mapActions } from 'vuex';
import { MODAL_TRANSFER_RECEIVE, SIMPLEX_URL } from '../../../utils/constants';
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
    ...mapActions('modals', {
      openModal: 'open',
    }),
    checkZeroBalance(token) {
      return !+token.convertedBalance?.toString();
    },
    openReceiveModal() {
      this.openModal({
        name: MODAL_TRANSFER_RECEIVE,
      });
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
