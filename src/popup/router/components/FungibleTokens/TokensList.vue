<template>
  <div v-if="filteredResults.length > 0">
    <TokensListItem
      v-for="value in filteredResults"
      :key="value.contract || value.id"
      :tokenData="value"
    />
  </div>
  <div v-else class="tokens-msg">{{ $t('pages.fungible-tokens.no-results') }}</div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import TokensListItem from './TokensListItem';

export default {
  components: {
    TokensListItem,
  },
  props: {
    showMyTokens: { type: Boolean },
    searchTerm: { type: String, default: '' },
  },
  computed: {
    ...mapState('fungibleTokens', ['tokenBalances', 'availableTokens', 'aePublicData']),
    ...mapGetters(['tokenBalance', 'balanceCurrency']),

    /**
     * Returns the default aeternity meta information
     */
    aeternityToken() {
      const aeInformation =
        this.aePublicData && Object.keys(this.aePublicData).length > 0
          ? {
              ...this.aePublicData,
              convertedBalance: this.tokenBalance,
              symbol: 'AE',
              balanceCurrency: this.balanceCurrency,
              contract: '',
            }
          : null;
      return aeInformation;
    },
    /**
     * Converts the token information object into a searchable list
     */
    convertedTokenInfo() {
      return Object.entries(this.availableTokens).map(([contract, tokenData]) => ({
        name: tokenData.name,
        symbol: tokenData.symbol,
        contract,
        decimals: tokenData.decimals,
        convertedBalance: tokenData.convertedBalance,
      }));
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
      ).filter(
        token =>
          !searchTerm ||
          token.symbol.toLowerCase().includes(searchTerm) ||
          token.name.toLowerCase().includes(searchTerm) ||
          token.contract.toLowerCase().includes(searchTerm),
      );
    },
  },
};
</script>

<style lang="scss" scoped>
.tokens-msg {
  text-align: center;
  margin-top: 15px;
}
</style>
