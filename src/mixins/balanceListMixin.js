import { mapGetters, mapState } from 'vuex';
import { pick } from 'lodash-es';
import { AETERNITY_CONTRACT_ID } from '../popup/utils/constants';

export default (showAllTokens) => ({
  subscriptions() {
    return pick(this.$store.state.observables, ['balance', 'balanceCurrency']);
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
        tokenBalance: this.balance,
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
          : token.contractId === AETERNITY_CONTRACT_ID || this.tokenBalances.includes(token)))
        .filter((token) => (this.showTokensWithBalance
          ? token.contractId === AETERNITY_CONTRACT_ID || +token?.convertedBalance : token))
        .filter(
          (token) => !searchTerm
            || token.symbol.toLowerCase().includes(searchTerm)
            || token.name.toLowerCase().includes(searchTerm)
            || token.contractId.toLowerCase().includes(searchTerm),
        );
    },
  },
});
