<template>
  <span class="tokens">
    <img
      :src="fromToken.img"
      :class="{ border: fromToken.imgBorder }"
    >
    <img
      v-if="toToken"
      :src="toToken.img"
      :class="{ border: toToken.imgBorder }"
    >
    <Tooltip
      v-if="fromToken"
      class="symbol"
      :tooltip="fromToken.name"
    >
      {{ shrinkString(fromToken.symbol) }}
    </Tooltip>
    <span
      v-if="fromToken && toToken"
      class="seperator"
    >
      /
    </span>
    <Tooltip
      v-if="toToken"
      class="symbol"
      :tooltip="toToken.name"
    >
      {{ shrinkString(toToken.symbol) }}
    </Tooltip>
  </span>
</template>

<script>
import Tooltip from './Tooltip.vue';
import AeIcon from '../../../icons/tokens/ae.svg';

export default {
  components: {
    Tooltip,
  },
  props: {
    /**
     * transactionTokenInfoResolvers []
     */
    tokens: { type: Array, required: true },
    symbolLength: { type: Number, default: 11 },
  },
  computed: {
    fromToken() {
      return this.tokens?.[0] ? this.mapToken(this.tokens[0]) : null;
    },
    toToken() {
      return this.tokens?.[1] ? this.mapToken(this.tokens[1]) : null;
    },
  },
  methods: {
    shrinkString(text) {
      return `${String(text).substring(0, this.symbolLength)}${text.length > this.symbolLength ? ' ...' : ''}`;
    },
    mapToken(token) {
      let img = `https://avatars.z52da5wt.xyz/${token.contract}`;
      let imgBorder = true;

      if (token.isAe) {
        img = AeIcon;
        imgBorder = false;
      }

      return {
        ...token,
        symbol: token.isAe ? 'AE' : token.symbol,
        name: token.isAe ? 'Aeternity' : token.symbol,
        img,
        imgBorder,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.tokens {
  color: variables.$color-light-grey;
  display: inline-flex;
  align-items: center;

  @extend %face-sans-14-regular;

  .symbol {
    vertical-align: middle;
  }

  .divider {
    color: variables.$color-blue;
    margin: 0 4px;
    word-break: break-all;
    vertical-align: middle;
  }

  .seperator {
    color: variables.$color-blue;
    margin: 0 1px;
    vertical-align: middle;
  }

  img {
    width: 16px;
    height: 16px;
    border-radius: 8px;
    margin-right: 6px;
    vertical-align: middle;

    &.border {
      border: 0.25px solid variables.$color-light-grey;
    }

    &:nth-child(2) {
      margin-left: -10px;
    }
  }
}
</style>
