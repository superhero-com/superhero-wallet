import { mapGetters, mapState } from 'vuex';
import { pick } from 'lodash-es';

export default (showAllTokens) => ({
  subscriptions() {
    return pick(this.$store.state.observables, ['tokenBalance', 'balanceCurrency']);
  },
  props: {
    showTokensWithBalance: { type: Boolean },
  },
  computed: {
    ...mapState('fungibleTokens', ['availableTokens', 'aePublicData']),
    ...mapGetters('fungibleTokens', ['tokenBalances', 'getAeternityToken']),

    /**
     * Returns the default aeternity meta information
     */
    aeternityToken() {
      return this.getAeternityToken({
        tokenBalance: this.tokenBalance,
        balanceCurrency: this.balanceCurrency,
      });
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
      this.tokenBalances.forEach((balance) => {
        const index = tokens.findIndex((token) => token.contractId === balance.contractId);
        if (index !== -1) {
          tokens[index] = balance;
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
      return tokensInfo
        .filter((token) => (showAllTokens
          ? token
          : token.contractId === 'aeternity' || this.tokenBalances.includes(token)))
        .filter((token) => (this.showTokensWithBalance
          ? token.contractId === 'aeternity' || +token?.convertedBalance : token))
        .filter(
          (token) => !searchTerm
            || token.symbol.toLowerCase().includes(searchTerm)
            || token.name.toLowerCase().includes(searchTerm)
            || token.contractId.toLowerCase().includes(searchTerm),
        );
    },
  },
});
