<template>
  <div class="pool-tokens">
    <DetailsItem
      v-for="(token, index) in tokens"
      :key="index"
      :label="$t(`pages.transactionDetails.${getLabel(token.isPool)}`)"
      data-cy="fee"
    >
      <div slot="value">
        <TokenAmount
          v-if="withAmount"
          :amount="+convertToken(token.amount, -token.decimals)"
          symbol="AE"
          hide-fiat
          no-symbol
        />
        <div class="token-info">
          <Tokens
            v-if="token"
            :tokens="token.isPool ? [tokens[0], tokens[1]] : [token]"
          />
          <AddressShortening
            v-if="token.contractId"
            :address="token.contractId"
          />
        </div>
      </div>
    </DetailsItem>
  </div>
</template>

<script>
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import { getDexTransactionTag } from '../../utils';
import { aettosToAe, convertToken } from '../../utils/helper';
import Tokens from './Tokens.vue';
import AddressShortening from './AddressShortening.vue';

export default {
  components: {
    AddressShortening,
    TokenAmount,
    DetailsItem,
    Tokens,
  },
  props: {
    tokens: {
      type: Array,
      required: true,
    },
    txFunction: {
      type: String,
      required: true,
    },
    withAmount: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    aettosToAe,
    convertToken,
    getLabel(isPool) {
      const tag = getDexTransactionTag[this.txFunction];
      if (tag === 'allow_token') return 'approveTokenUse';
      const provideLiquidity = tag === 'provide_liquidity';
      if (isPool) return provideLiquidity ? 'poolTokenReceived' : 'poolTokenSpent';
      return provideLiquidity ? 'deposited' : 'withdrawn';
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.pool-tokens {
  @include mixins.flex(flex-start, flex-start, column);

  gap: 16px;

  .contract-id {
    @extend %face-mono-12-medium;

    color: variables.$color-light-grey;
    letter-spacing: 0.07em;
    cursor: pointer;

    .icon {
      width: 22px;
      height: 22px;
    }
  }

  .details-item.label::v-deep {
    margin-bottom: 4px;
  }

  .token-info {
    @include mixins.flex(flex-start, center);

    gap: 8px;
    padding-top: 4px;

    .symbol::v-deep,
    .address-shortening::v-deep {
      font-weight: 500;
    }
  }

  .tokens::v-deep {
    .symbol {
      @extend %face-sans-15-medium;

      color: variables.$color-white;
    }

    .seperator {
      color: variables.$color-white;
    }
  }
}
</style>
