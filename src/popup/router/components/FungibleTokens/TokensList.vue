<template>
  <div v-if="filteredResults.length > 0">
    <TokensListItem
      v-for="value in filteredResults"
      :key="value.contract || value.id"
      :token-data="value"
    />
  </div>
  <div
    v-else
    class="tokens-msg"
  >
    {{ $t('pages.fungible-tokens.no-results') }}
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapState, mapGetters } from 'vuex';
import TokensListItem from './TokensListItem.vue';

export default {
  components: {
    TokensListItem,
  },
  props: {
    showMyTokens: { type: Boolean },
    searchTerm: { type: String, default: '' },
  },
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
      const aeInformation = this.aePublicData && Object.keys(this.aePublicData).length > 0
        ? {
          ...this.aePublicData,
          convertedBalance: this.tokenBalance,
          symbol: 'AE',
          balanceCurrency: this.balanceCurrency,
          contract: 'aeternity',
        }
        : null;
      return aeInformation;
    },
    /**
     * Converts the token information object into a searchable list
     */
    convertedTokenInfo() {
      const tokens = Object.entries(this.availableTokens).map(([contract, tokenData]) => ({
        name: tokenData.name,
        symbol: tokenData.symbol,
        contract,
        decimals: tokenData.decimals,
        convertedBalance: tokenData.convertedBalance,
      }));
      this.tokenBalances.forEach((b) => {
        const index = tokens.findIndex((t) => t.contract === b.contract);
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
        .filter((token) => +token.convertedBalance?.toString() > 0)
        .filter(
          (token) => !searchTerm
            || token.symbol.toLowerCase().includes(searchTerm)
            || token.name.toLowerCase().includes(searchTerm)
            || token.contract.toLowerCase().includes(searchTerm),
        );
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';

.tokens-msg {
  margin-top: 40px;
  text-align: center;

  @extend %face-sans-15-medium;

  color: variables.$color-light-grey;
}
</style>
