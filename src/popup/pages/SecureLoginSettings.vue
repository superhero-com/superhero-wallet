<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="secure-login-settings">
        <div class="top-wrapper">
          <p class="text-description">
            {{ $t('pages.secureLogin.description') }}
          </p>

          <SwitchButton
            :label="$t('pages.secureLogin.enableSecureLogin')"
            :model-value="isSecureLoginEnabled"
            @update:modelValue="setSecureLoginEnabled"
          />
        </div>

        <div class="options-wrapper">
          <div class="options">
            <div
              class="options-info"
              :class="{ dimmed: !isSecureLoginEnabled }"
            >
              <span class="options-label">
                {{ $t('pages.secureLogin.autoLock.title') }}
              </span>
              <span class="options-description">
                {{ $t('pages.secureLogin.autoLock.descriptionPart1') }}
              </span>
              <span class="options-description">
                {{ $t('pages.secureLogin.autoLock.descriptionPart2') }}
              </span>
            </div>

            <RadioButton
              v-for="(ms, minutes) in AUTHENTICATION_TIMEOUTS"
              :key="`timeout-${minutes}`"
              :value="secureLoginTimeout === ms"
              :disabled="!isSecureLoginEnabled"
              :class="{ active: secureLoginTimeout === ms }"
              class="timeout"
              @input="setSecureLoginTimeout(ms)"
            >
              <div class="row">
                {{ $t('pages.secureLogin.authenticationTimeout', Number(minutes)) }}
              </div>
            </RadioButton>
          </div>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { useUi } from '@/composables';

import RadioButton from '../components/RadioButton.vue';
import SwitchButton from '../components/SwitchButton.vue';

const AUTHENTICATION_TIMEOUTS = {
  0: 0,
  1: 60000,
  5: 300000,
  15: 900000,
  30: 1800000,
} as const;

export default defineComponent({
  name: 'SecureLoginSettings',
  components: {
    RadioButton,
    SwitchButton,
    IonPage,
    IonContent,
  },
  setup() {
    const {
      isSecureLoginEnabled,
      secureLoginTimeout,
      setSecureLoginEnabled,
      setSecureLoginTimeout,
    } = useUi();

    return {
      isSecureLoginEnabled,
      secureLoginTimeout,
      setSecureLoginEnabled,
      setSecureLoginTimeout,
      AUTHENTICATION_TIMEOUTS,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/mixins';
@use '../../styles/typography';

.secure-login-settings {
  .top-wrapper {
    padding-inline: var(--screen-padding-x);
    margin-bottom: 28px;
  }

  .text-description {
    padding: 16px 0;
  }

  .options-wrapper {
    border-top: 1px solid rgba(255, 255, 255, 0.15);
  }

  .options-info {
    @include mixins.flex(flex-start, flex-start, column);
    gap: 8px;

    &.dimmed {
      opacity: 0.5;
    }
  }

  .options-label {
    @extend %face-sans-15-medium;
  }

  .options-description {
    @extend %face-sans-15-regular;
    opacity: 0.85;
  }

  .options {
    margin-top: 20px;
    padding-inline: var(--screen-padding-x);
    display: flex;
    flex-direction: column;
    gap: 15px;

    .row {
      @extend %face-sans-15-medium;
    }
  }
}
</style>
