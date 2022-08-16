<template>
  <select
    class="asset-selector"
    :value="JSON.stringify(currentToken)"
    @change="(event) => handleChange(event.target.value) "
  >
    <option
      v-for="token in tokenList"
      :key="token.contractId"
      :value="JSON.stringify(token)"
    >
      {{ token.symbol }}
    </option>
  </select>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  computed: {
    ...mapState('fungibleTokens', ['availableTokens', 'aePublicData', 'selectedToken']),
    ...mapGetters('fungibleTokens', ['tokenBalances']),
    currentToken() {
      return this.selectedToken || this.aeternityToken;
    },
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
    tokenList() {
      return [
        ...(this.aeternityToken ? [this.aeternityToken] : []),
        ...this.convertedTokenInfo,
      ];
    },
  },
  created() {
    this.$emit('input', JSON.parse(JSON.stringify(this.currentToken)));
  },
  methods: {
    handleChange(value) {
      this.$emit('input', JSON.parse(value));
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';

.asset-selector {
  align-self: center;
  max-width: 70px;
  padding: 2px 12px;
  gap: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  height: 28px;
  margin-right: 2px;
  font-weight: 500;
  color: variables.$color-blue;
  border-color: #171717 transparent;
  margin-bottom: 2px;
}
</style>
