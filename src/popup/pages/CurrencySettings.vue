<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
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
            <div class="row">
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
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { useCurrencies } from '@/composables';

import RadioButton from '../components/RadioButton.vue';

export default defineComponent({
  name: 'CurrencySettings',
  components: {
    RadioButton,
    IonPage,
    IonContent,
  },
  setup() {
    const { CURRENCIES, currentCurrencyCode, setCurrentCurrency } = useCurrencies();

    return {
      CURRENCIES,
      currentCurrencyCode,
      setCurrentCurrency,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.currency-settings {
  padding-inline: var(--screen-padding-x);

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
      display: flex;
      align-items: center;

      .left {
        width: 95px;
        display: flex;

        .code,
        .symbol {
          text-transform: uppercase;
          padding-right: 2px;
        }
      }

      .name {
        font-weight: 400;
      }
    }
  }
}
</style>
