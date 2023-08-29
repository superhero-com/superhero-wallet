<template>
  <div class="currency-settings">
    <p class="text-description">
      {{ $t('pages.currencySettings.chooseLanguage') }}
    </p>

    <div class="options">
      <RadioButton
        v-for="({ code, name, symbol }, index) in CURRENCIES"
        :key="`${index}-${code}`"
        :value="currentCurrencyCode === code"
        :class="{ active: currentCurrencyCode === code }"
        class="currency"
        @input="setCurrentCurrency(code)"
      >
        <div
          class="row"
          @click="setCurrentCurrency(code)"
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from 'vuex';
import { useCurrencies } from '../../composables';
import RadioButton from '../components/RadioButton.vue';

export default defineComponent({
  name: 'CurrencySettings',
  components: {
    RadioButton,
  },
  setup() {
    const store = useStore();
    const { CURRENCIES, currentCurrencyCode, setCurrentCurrency } = useCurrencies({ store });

    return {
      CURRENCIES,
      currentCurrencyCode,
      setCurrentCurrency,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.currency-settings {
  padding: var(--screen-padding-x);

  .options {
    margin-top: 20px;
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
