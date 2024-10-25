<template>
  <IonPage>
    <IonContent
      ref="infoBoxEl"
      class="ion-padding ion-content-bg"
    >
      <div class="secure-login-settings">
        <!--
          Enable secure login option
        -->
        <div class="form-group">
          <template v-if="IS_MOBILE_APP">
            <p
              class="text-description"
              v-text="$t('pages.secureLogin.descriptionBiometric')"
            />
            <div class="form-group-fields">
              <SwitchButton
                :label="$t('pages.secureLogin.enableSecureLogin')"
                :model-value="isBiometricLoginEnabled"
                :disabled="!isBiometricLoginAvailable"
                @update:modelValue="setBiometricLoginEnabled"
              />
            </div>
          </template>
          <template v-else>
            <p
              class="text-description"
              v-text="$t('pages.secureLogin.descriptionPassword')"
            />
            <div class="form-group-fields">
              <SwitchButton
                :label="$t('pages.secureLogin.enablePasswordProtection')"
                :model-value="!isUsingDefaultPassword"
                @update:modelValue="setPasswordEnabled"
              />
            </div>
          </template>

          <hr>
        </div>

        <!--
          Auto-lock wallet time options
        -->
        <div
          class="form-group"
          :class="{
            dimmed: (
              (IS_MOBILE_APP && !isBiometricLoginEnabled)
              || (!IS_MOBILE_APP && isUsingDefaultPassword)
            ),
          }"
        >
          <div>
            <p class="text-heading-5" v-text="$t('pages.secureLogin.autoLock.title')" />
            <p class="text-description" v-text="$t('pages.secureLogin.autoLock.descriptionPart1')" />
            <p class="text-description" v-text="$t('pages.secureLogin.autoLock.descriptionPart2')" />
          </div>

          <div class="form-group-fields">
            <RadioButton
              v-for="(ms) in AUTHENTICATION_TIMEOUTS"
              :key="`timeout-${ms}`"
              :value="+secureLoginTimeoutDecrypted === ms"
              :class="{ active: +secureLoginTimeoutDecrypted === ms }"
              :label="$t('pages.secureLogin.authenticationTimeout', msToMinutes(ms))"
              class="timeout"
              has-label-effect
              @input="secureLoginTimeoutDecrypted = ms.toString()"
            />
          </div>

          <hr>
        </div>

        <!--
          Change password options
        -->
        <div
          v-if="!IS_MOBILE_APP"
          class="form-group"
          :class="{ dimmed: (!IS_MOBILE_APP && isUsingDefaultPassword) }"
        >
          <div>
            <p
              class="text-heading-5"
              v-text="$t('pages.changePassword.title')"
            />
            <p
              class="text-description"
              v-text="$t('pages.changePassword.description')"
            />
          </div>

          <Form
            v-slot="{ errors }"
            @submit="setNewPassword()"
          >
            <InputPassword
              v-model="currentPassword"
              data-cy="current-password"
              :placeholder="$t('pages.changePassword.currentPasswordPlaceholder')"
              :label="$t('pages.changePassword.currentPassword')"
              :message="isAuthFailed ? $t('pages.secureLogin.login.error') : null"
              @input="isAuthFailed = false; isPasswordChangedSuccessfully = false"
            />
            <Field
              v-slot="{ field, errorMessage }"
              key="newPassword"
              name="newPassword"
              :validate-on-blur="true"
              :validate-on-model-update="!!errors.password"
              :rules="{
                password_min_len: 4,
              }"
            >
              <InputPassword
                v-bind="field"
                v-model="newPassword"
                data-cy="new-password"
                :placeholder="$t('pages.changePassword.newPasswordPlaceholder')"
                :label="$t('pages.changePassword.newPassword')"
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
                data-cy="confirm-new-password"
                :placeholder="$t('pages.setPassword.confirmPlaceholder')"
                :label="$t('pages.changePassword.confirmNewPassword')"
                :message="errorMessage"
                hide-eye-icon
              />
            </Field>

            <BtnMain
              class="btn-reset-password"
              variant="primary"
              type="submit"
              extend
              :disabled="(
                !newPassword
                || !currentPassword
                || !confirmNewPassword
                || !!errors.newPassword
                || !!errors.confirmNewPassword
              )"
              :text="$t('pages.changePassword.reset')"
            />
          </Form>

          <Transition name="fade-transition">
            <InfoBox
              v-if="isPasswordChangedSuccessfully"
              class="info-box"
              type="success"
              :text="$t('pages.changePassword.success')"
            />
          </Transition>
        </div>
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

import type { ComponentRef } from '@/types';
import { AUTHENTICATION_TIMEOUTS, IS_MOBILE_APP } from '@/constants';
import { STUB_ACCOUNT } from '@/constants/stubs';
import { useAuth, useModals, useUi } from '@/composables';

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

    const {
      checkBiometricLoginAvailability,
      updatePassword,
      setPassword,
      secureLoginTimeoutDecrypted,
      isUsingDefaultPassword,
    } = useAuth();
    const {
      isBiometricLoginEnabled,
      setBiometricLoginEnabled,
    } = useUi();
    const { openEnableBiometricLoginModal, openSetPasswordModal } = useModals();

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
        infoBoxEl.value?.$el?.scrollBy(0, infoBoxEl.value?.$el?.scrollWidth);
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

    async function setPasswordEnabled(val: boolean) {
      let passwordToSet = STUB_ACCOUNT.password;

      if (val) {
        try {
          isUsingDefaultPassword.value = false;
          passwordToSet = await openSetPasswordModal();
        } catch (error) { /* NOOP */ }
      }

      setPassword(passwordToSet);
      isUsingDefaultPassword.value = (passwordToSet === STUB_ACCOUNT.password);
    }

    function msToMinutes(ms: number) {
      return Math.floor(ms / 60000);
    }

    onMounted(async () => {
      isBiometricLoginAvailable.value = await checkBiometricLoginAvailability();
      if (!isBiometricLoginAvailable.value && IS_MOBILE_APP) {
        openEnableBiometricLoginModal();
      }
    });

    return {
      AUTHENTICATION_TIMEOUTS,
      IS_MOBILE_APP,
      infoBoxEl,
      isBiometricLoginEnabled,
      isBiometricLoginAvailable,
      isPasswordChangedSuccessfully,
      isAuthFailed,
      isUsingDefaultPassword,
      secureLoginTimeoutDecrypted,
      currentPassword,
      newPassword,
      confirmNewPassword,
      setNewPassword,
      setBiometricLoginEnabled,
      msToMinutes,
      setPasswordEnabled,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';
@use '@/styles/typography';

.secure-login-settings {
  padding-top: 16px;
  padding-bottom: 24px;

  .form-group {
    padding-inline: var(--screen-padding-x);

    .form-group-fields {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-top: 16px;
    }
  }

  .dimmed {
    opacity: 0.5;
    pointer-events: none;
  }

  .btn-reset-password {
    margin-top: 40px;
  }

  .info-box {
    margin-top: 24px;
  }
}
</style>
