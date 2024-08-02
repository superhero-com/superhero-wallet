<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="secure-login-settings">
        <div
          v-if="IS_MOBILE_APP"
          class="top-wrapper"
        >
          <p class="text-description">
            {{ $t('pages.secureLogin.description') }}
          </p>

          <SwitchButton
            :label="$t('pages.secureLogin.enableSecureLogin')"
            :model-value="isBiometricLoginEnabled"
            :disabled="!isBiometricLoginAvailable"
            @update:modelValue="setBiometricLoginEnabled"
          />
        </div>
        <hr v-if="IS_MOBILE_APP">
        <div class="options-wrapper">
          <div class="options">
            <div
              class="options-info"
              :class="{ dimmed: IS_MOBILE_APP && !isBiometricLoginEnabled }"
            >
              <span class="options-label" v-text="$t('pages.secureLogin.autoLock.title')" />
              <span class="options-description" v-text="$t('pages.secureLogin.autoLock.descriptionPart1')" />
              <span class="options-description" v-text="$t('pages.secureLogin.autoLock.descriptionPart2')" />
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
              <div class="row" v-text="$t('pages.secureLogin.authenticationTimeout', Number(minutes))" />
            </RadioButton>
          </div>
        </div>
        <template v-if="!IS_MOBILE_APP">
          <hr>
          <div class="options">
            <div class="options-info">
              <span class="options-label" v-text="$t('pages.secureLogin.changePassword.title')" />
              <span class="options-description" v-text="$t('pages.secureLogin.changePassword.description')" />
            </div>
            <div class="inputs">
              <div class="current-password">
                <InputPassword
                  v-model="currentPassword"
                  data-cy="currentPassword"
                  :placeholder="$t('pages.secureLogin.changePassword.currentPasswordPlaceholder')"
                  :label="$t('pages.secureLogin.changePassword.currentPassword')"
                  :message="isAuthFailed ? $t('pages.secureLogin.login.error') : null"
                  @input="isAuthFailed = false; isPasswordChangedSuccessfully = false"
                />
              </div>

              <Form
                v-slot="{ errors, handleSubmit, resetForm }"
                class="new-password"
              >
                <Field
                  v-slot="{ field, errorMessage }"
                  key="newPassword"
                  name="newPassword"
                  :validate-on-blur="true"
                  :validate-on-model-update="!!errors.password"
                  :rules="{
                    password_min_len: 8,
                  }"
                >
                  <InputPassword
                    v-bind="field"
                    v-model="newPassword"
                    data-cy="newPassword"
                    :placeholder="$t('pages.secureLogin.changePassword.newPasswordPlaceholder')"
                    :label="$t('pages.secureLogin.changePassword.newPassword')"
                    :message="errorMessage ?? errors.confirmNewPassword"
                    show-password-strength
                  />
                </Field>
                <Field
                  v-slot="{ field, errorMessage }"
                  key="confirmNewPassword"
                  name="confirmNewPassword"
                  :rules="{
                    passwords_match: newPassword,
                  }"
                >
                  <InputPassword
                    v-bind="field"
                    v-model="confirmNewPassword"
                    data-cy="confirmNewPassword"
                    :placeholder="$t('pages.secureLogin.setPassword.confirmPlaceholder')"
                    :label="$t('pages.secureLogin.changePassword.confirmNewPassword')"
                    :message="errorMessage"
                    hide-eye-icon
                  />
                </Field>

                <BtnMain
                  class="btn-main"
                  variant="primary"
                  extend
                  :disabled="(
                    !newPassword
                    || !currentPassword
                    || !confirmNewPassword
                    || !!errors.newPassword
                    || !!errors.confirmNewPassword
                  )"
                  :text="$t('pages.secureLogin.changePassword.reset')"
                  @click="handleSubmit($event, setNewPassword).then(resetForm)"
                />
              </Form>
              <InfoBox
                v-if="isPasswordChangedSuccessfully"
                ref="infoBoxEl"
                class="info-box"
                type="success"
                :text="$t('pages.secureLogin.changePassword.success')"
              />
            </div>
          </div>
        </template>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  defineComponent,
  nextTick,
  onMounted,
  ref,
} from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { Form, Field } from 'vee-validate';

import { AUTHENTICATION_TIMEOUTS, IS_MOBILE_APP } from '@/constants';
import { ComponentRef } from '@/types';
import { useAccounts, useAuth, useUi } from '@/composables';

import RadioButton from '@/popup/components/RadioButton.vue';
import SwitchButton from '@/popup/components/SwitchButton.vue';
import InputPassword from '@/popup/components/InputPassword.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import InfoBox from '@/popup/components/InfoBox.vue';

export default defineComponent({
  name: 'SecureLoginSettings',
  components: {
    InputPassword,
    BtnMain,
    RadioButton,
    SwitchButton,
    IonPage,
    IonContent,
    Form,
    Field,
    InfoBox,
  },
  setup() {
    const infoBoxEl = ref<ComponentRef>();
    const isBiometricLoginAvailable = ref(false);
    const isAuthFailed = ref(false);
    const isAuthenticating = ref(false);
    const isPasswordChangedSuccessfully = ref(false);
    const currentPassword = ref('');
    const newPassword = ref('');
    const confirmNewPassword = ref('');

    const { updatePassword } = useAccounts();
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

    async function setNewPassword() {
      if (isAuthenticating.value) {
        return;
      }
      isAuthFailed.value = false;
      isAuthenticating.value = true;

      try {
        await updatePassword(currentPassword.value, newPassword.value);
        isPasswordChangedSuccessfully.value = true;
        await nextTick();
        infoBoxEl.value?.$el?.scrollIntoView();
      } catch (error) {
        isAuthFailed.value = true;
        isPasswordChangedSuccessfully.value = false;
      } finally {
        isAuthenticating.value = false;
        currentPassword.value = '';
        newPassword.value = '';
        confirmNewPassword.value = '';
      }
    }

    onMounted(async () => {
      isBiometricLoginAvailable.value = await checkBiometricLoginAvailability();
      if (!isBiometricLoginAvailable.value && IS_MOBILE_APP) {
        openEnableBiometricLoginModal();
      }
    });

    return {
      infoBoxEl,
      isBiometricLoginEnabled,
      isBiometricLoginAvailable,
      isPasswordChangedSuccessfully,
      isAuthFailed,
      secureLoginTimeout,
      currentPassword,
      newPassword,
      confirmNewPassword,
      setNewPassword,
      setBiometricLoginEnabled,
      setSecureLoginTimeout,
      IS_MOBILE_APP,
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

  .inputs {
    width: 100%;

    .current-password {
      display: flex;
      flex-direction: column;
    }

    .new-password {
      margin-top: 4px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .btn-main {
      margin-top: 40px;
      margin-bottom: 24px;
    }
  }

  .info-box {
    margin-bottom: 24px;
  }
}
</style>
