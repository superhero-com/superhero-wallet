<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="secure-login-settings">
        <div class="top-wrapper">
          <p class="text-description">
            {{ $t('pages.secureLogin.description') }}
          </p>

          <SwitchButton
            v-if="IS_MOBILE_APP"
            :label="$t('pages.secureLogin.enableSecureLogin')"
            :model-value="isBiometricLoginEnabled"
            :disabled="!isBiometricLoginAvailable"
            @update:modelValue="setBiometricLoginEnabled"
          />
        </div>
        <hr>
        <div class="options-wrapper">
          <div class="options">
            <div
              class="options-info"
              :class="{ dimmed: IS_MOBILE_APP && !isBiometricLoginEnabled }"
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
              :class="{ active: secureLoginTimeout === ms }"
              class="timeout"
              has-label-effect
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
import { defineComponent, onMounted, ref } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';

import { IS_MOBILE_APP } from '@/constants';
import { useAuth, useUi } from '@/composables';

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
    const isBiometricLoginAvailable = ref(false);

    const {
      checkBiometricLoginAvailability,
      openEnableBiometricLoginModal,
    } = useAuth();
    const {
      isBiometricLoginEnabled,
      secureLoginTimeout,
      setBiometricLoginEnabled,
      setSecureLoginTimeout,
    } = useUi();

    onMounted(async () => {
      isBiometricLoginAvailable.value = await checkBiometricLoginAvailability();
      if (!isBiometricLoginAvailable.value && IS_MOBILE_APP) {
        openEnableBiometricLoginModal();
      }
    });

    return {
      IS_MOBILE_APP,
      isBiometricLoginEnabled,
      isBiometricLoginAvailable,
      secureLoginTimeout,
      setBiometricLoginEnabled,
      setSecureLoginTimeout,
      AUTHENTICATION_TIMEOUTS,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';
@use '@/styles/typography';

.secure-login-settings {
  .top-wrapper {
    padding-inline: var(--screen-padding-x);
    margin-bottom: 28px;
  }

  .text-description {
    padding: 16px 0;
  }

  .options-info {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
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

.warning-box {
  margin: 16px;
}
</style>
