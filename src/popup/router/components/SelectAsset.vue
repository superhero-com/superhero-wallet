<template>
  <ButtonPlain
    class="select-asset"
    :class="{ focused }"
    @click="openAssetSelector"
  >
    {{ displayToken }}
    <ChevronDown />
  </ButtonPlain>
</template>

<script>
import ChevronDown from '../../../icons/chevron-down.svg?vue-component';
import { MODAL_ASSET_SELECTOR } from '../../utils/constants';
import ButtonPlain from './ButtonPlain.vue';

export default {
  components: {
    ButtonPlain,
    ChevronDown,
  },
  props: {
    value: { type: Object, default: null },
    focused: Boolean,
  },
  computed: {
    displayToken() {
      if (!this.value) return '';
      const { symbol } = this.value;
      return `${String(symbol).substring(0, 11)}${symbol.length > 11 ? '...' : ''}`;
    },
  },
  methods: {
    handleChange(token) {
      this.$emit('input', token);
    },
    openAssetSelector() {
      this.$store.dispatch('modals/open',
        {
          ...this.$attrs,
          name: MODAL_ASSET_SELECTOR,
          selectedToken: this.value,
          resolve: (token) => token,
        }).then((token) => this.handleChange(token));
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.select-asset {
  @include mixins.flex(center, center);

  @extend %face-sans-14-medium;

  padding: 2px 12px;
  background-color: rgba(variables.$color-black, 0.3);
  border-radius: 16px;
  gap: 6px;
  color: variables.$color-blue;
  white-space: nowrap;
  border: 2px solid transparent;
  transition: all 0.12s ease-out;

  .chevron-down {
    width: 8px !important;
    color: variables.$color-white;
    opacity: 0.75;
  }

  &:hover {
    border-color: rgba(variables.$color-white, 0.15);
  }

  &.focused {
    background-color: rgba(variables.$color-white, 0.05);
  }
}
</style>
