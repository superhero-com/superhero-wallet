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
import { pick } from 'lodash-es';
import { mapState, mapGetters } from 'vuex';
import { SIMPLEX_URL } from '../../../utils/constants';
import TokensListItem from './TokensListItem.vue';
import Button from '../Button.vue';
import Receive from '../../../../icons/receive.svg?vue-component';
import Buy from '../../../../icons/buy.svg?vue-component';

export default {
  components: {
    TokensListItem,
    Button,
    Receive,
    Buy,
  },
  props: {
    showMyTokens: { type: Boolean },
    searchTerm: { type: String, default: '' },
  },
  data: () => ({
    SIMPLEX_URL,
  }),
  subscriptions() {
    return pick(this.$store.state.observables, ['tokenBalance', 'balanceCurrency']);
  },
  computed: {
    ...mapState('fungibleTokens', ['availableTokens', 'aePublicData']),
    ...mapGetters('fungibleTokens', ['tokenBalances']),

    /**
     * Returns the default aeternity meta information
     */
    aeternityToken() {
      return this.aePublicData && Object.keys(this.aePublicData).length > 0
        ? {
          ...this.aePublicData,
          convertedBalance: this.tokenBalance,
          symbol: 'AE',
          balanceCurrency: this.balanceCurrency,
          contractId: 'aeternity',
        }
        : null;
    },
    /**
     * Converts the token information object into a searchable list
     */
    convertedTokenInfo() {
      const tokens = Object.entries(this.availableTokens).map(([contractId, tokenData]) => ({
        name: tokenData.name,
        symbol: tokenData.symbol,
        contractId,
        decimals: tokenData.decimals,
        convertedBalance: tokenData.convertedBalance,
      }));
      this.tokenBalances.forEach((b) => {
        const index = tokens.findIndex((t) => t.contractId === b.contractId);
        if (index !== -1) {
          tokens[index] = b;
        }
      });
      return tokens;
    },
    filteredResults() {
      const tokensInfo = [
        ...(this.aeternityToken ? [this.aeternityToken] : []),
        ...this.convertedTokenInfo,
      ];
      const searchTerm = this.searchTerm.trim().toLowerCase();
      return (this.showMyTokens
        ? [...(this.aeternityToken ? [this.aeternityToken] : []), ...this.tokenBalances]
        : tokensInfo
      )
        .filter((token) => token.contractId === 'aeternity' || this.tokenBalances.includes(token))
        .filter(
          (token) => !searchTerm
            || token.symbol.toLowerCase().includes(searchTerm)
            || token.name.toLowerCase().includes(searchTerm)
            || token.contractId.toLowerCase().includes(searchTerm),
        );
    },
  },
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
