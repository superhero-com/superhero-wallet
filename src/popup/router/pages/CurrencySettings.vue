<template>
  <div class="currency-settings">
    <div class="description">
      {{ $t('pages.currencySettings.chooseLanguage') }}
    </div>

    <RadioButton
      v-for="{ code, name, symbol }, index in currencies"
      :key="`${index}-${code}`"
      :value="current && current.currency == code"
      :disabled="false"
      :class="['currency', {active: current && current.currency == code}]"
      @input="switchCurrency(code)"
    >
      <div
        class="row"
        @click="switchCurrency(code)"
      >
        <div class="left">
          <div class="code">
            {{ code }}
          </div>
          <div class="symbol">
            ({{ symbol }})
          </div>
        </div>
        <div class="name">
          {{ name }}
        </div>
      </div>
    </RadioButton>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import RadioButton from '../components/RadioButton.vue';
import { CURRENCIES } from '../../utils/constants';

export default {
  components: { RadioButton },
  data() {
    return {
      currencies: CURRENCIES,
    };
  },
  computed: mapState(['current']),
  methods: {
    switchCurrency(selectedCurrency) {
      this.$store.commit('setCurrentCurrency', selectedCurrency);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.currency-settings {
  padding: 16px;
  height: 100%;
  position: absolute;
  overflow-y: auto;
  top: 0;

  .description {
    padding-top: 56px;
    padding-bottom: 12px;
    text-align: left;
    line-height: 20px;
    color: rgba(variables.$color-white, 0.65);

    @extend %face-sans-14-light;
  }

  .currency {
    padding: 6px 0;
    font-weight: 500;
    font-size: 14px;
    line-height: 24px;

    .row {
      width: 100%;
      display: inline-flex;
      align-items: center;

      .left {
        display: inline-flex;
        align-items: center;
        width: 95px;

        .code,
        .symbol {
          text-transform: uppercase;
          padding-right: 2px;
          color: rgba(variables.$color-white, 0.5);

          @extend %face-sans-15-regular;
        }
      }

      .name {
        color: rgba(variables.$color-white, 0.75);

        @extend %face-sans-14-regular;
      }
    }

    &.active .row {
      .name,
      .left .code,
      .left .symbol {
        color: rgba(variables.$color-white, 1);
      }
    }
  }
}
</style>
