<template>
  <DetailsItem
    :label="label"
    class="pool-token-row"
  >
    <div slot="value">
      <TokenAmount
        v-if="!hideAmount"
        :amount="+convertToken(token.amount, -token.decimals)"
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
</template>

<script>
import { convertToken } from '../utils';
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
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
    label: {
      type: String,
      default: '',
    },
    token: {
      type: Object,
      required: true,
    },
    tokens: {
      type: Array,
      required: true,
    },
    hideAmount: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    convertToken,
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/typography';
@use '../../styles/variables';
@use '../../styles/mixins';

.pool-token-row {
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

    .separator {
      color: variables.$color-white;
    }
  }
}
</style>
