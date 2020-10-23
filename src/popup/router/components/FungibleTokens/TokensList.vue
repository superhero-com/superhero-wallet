<template>
  <div v-if="filteredResults.length > 0">
    <TokenDisplay
      v-for="value in filteredResults"
      :key="value.contract || value.id"
      :tokenData="value"
    />
  </div>
  <div v-else class="tokens-msg">{{ $t('pages.fungible-tokens.no-results') }}</div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import TokenDisplay from './TokenDisplay';

export default {
  components: {
    TokenDisplay,
  },
  props: {
    showMyTokens: { type: Boolean },
    searchTerm: { type: String, default: '' },
  },
  computed: {
    ...mapState('fungibleTokens', ['tokenBalances', 'tokenInfo', 'aeTokenInfo']),
    ...mapGetters(['tokenBalance', 'balanceCurrency']),

    /**
     * Returns the default aeternity meta information
     */
    aeternityToken() {
      const aeInformation =
        this.aeTokenInfo && Object.keys(this.aeTokenInfo).length > 0
          ? {
              ...this.aeTokenInfo,
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
      return Object.entries(this.tokenInfo).map(([contract, tokenData]) => ({
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
