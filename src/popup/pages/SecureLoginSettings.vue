<template>
  <PageWrapper ref="wrapper" :page-title="$t('pages.titles.secureLogin')">
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
              :disabled="!isDeviceAuthenticationAvailable"
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
              :disabled="isAuthenticating"
              data-cy="password-protection"
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
  </PageWrapper>
</template>

<script lang="ts">
import {
  defineComponent,
  nextTick,
  onMounted,
  ref,
} from 'vue';
import { Form, Field } from 'vee-validate';

import type { ComponentRef } from '@/types';
import { AUTHENTICATION_TIMEOUTS, IS_MOBILE_APP, STORAGE_KEYS } from '@/constants';
import {
  useAccounts,
  useAuth,
  useModals,
  useUi,
} from '@/composables';
import { generateDefaultPasswordSecret } from '@/composables/defaultPassword';
import {
  discardLegacyCopies,
  VaultLegacyConflictError,
  VaultSecretUnreadableError,
} from '@/lib/WalletVault';
import type { VaultKey } from '@/lib/WalletVault';
import { RejectedByUserError, WrongPasswordError } from '@/lib/errors';
import { handleUnknownError } from '@/utils';
import { tg } from '@/popup/plugins/i18n';

import PageWrapper from '@/popup/components/PageWrapper.vue';
import RadioButton from '@/popup/components/RadioButton.vue';
import SwitchButton from '@/popup/components/SwitchButton.vue';
import InputPassword from '@/popup/components/InputPassword.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import InfoBox from '@/popup/components/InfoBox.vue';

const UNREADABLE_DATA_LABELS: Partial<Record<VaultKey, string>> = {
  [STORAGE_KEYS.privateKeyAccountsRaw]: 'pages.changePassword.unreadableData.privateKeyAccounts',
  [STORAGE_KEYS.preclaimedNames]: 'pages.changePassword.unreadableData.preclaimedNames',
  [STORAGE_KEYS.invitesEncrypted]: 'pages.changePassword.unreadableData.invites',
  [STORAGE_KEYS.secureLoginTimeout]: 'pages.changePassword.unreadableData.secureLoginTimeout',
};

export default defineComponent({
  name: 'SecureLoginSettings',
  components: {
    PageWrapper,
    InputPassword,
    BtnMain,
    RadioButton,
    SwitchButton,
    Form,
    Field,
    InfoBox,
  },
  setup() {
    const infoBoxEl = ref<ComponentRef>();
    const isDeviceAuthenticationAvailable = ref(false);
    const isAuthFailed = ref(false);
    const isAuthenticating = ref(false);
    const isPasswordChangedSuccessfully = ref(false);
    const currentPassword = ref('');
    const newPassword = ref('');
    const confirmNewPassword = ref('');
    const wrapper = ref();

    const {
      canAuthenticateWithDevice,
      updatePassword,
      setPassword,
      removeUnreadableSecret,
      secureLoginTimeoutDecrypted,
      isUsingDefaultPassword,
    } = useAuth();
    const { offerToRemoveUnreadablePrivateKeyAccounts } = useAccounts();
    const {
      isBiometricLoginEnabled,
      setBiometricLoginEnabled,
    } = useUi();
    const {
      openConfirmModal,
      openDefaultModal,
      openEnableBiometricLoginModal,
      openSetPasswordModal,
    } = useModals();

    /** Neither a wrong password nor data to remove: the change failed, e.g. storage full. */
    function showPasswordNotChanged(error: unknown) {
      handleUnknownError(error);
      openDefaultModal({
        icon: 'critical',
        title: tg('pages.changePassword.notChangedTitle'),
        msg: tg('pages.changePassword.failed'),
      });
    }

    /**
     * Says which data refused the password change, offering to remove it.
     * `false` for other errors, e.g. a wrong password.
     */
    function offerPasswordChangeRecovery(error: unknown): boolean {
      if (error instanceof VaultSecretUnreadableError) {
        const label = UNREADABLE_DATA_LABELS[error.storageKey];
        if (!label) return false;
        const title = tg('pages.changePassword.notChangedTitle');
        const msg = tg('pages.changePassword.unreadableDataMsg', { data: tg(label) });
        // Their own removal also frees their indexes.
        if (error.storageKey === STORAGE_KEYS.privateKeyAccountsRaw) {
          offerToRemoveUnreadablePrivateKeyAccounts({ title, msg });
          return true;
        }
        openConfirmModal({
          title,
          msg,
          icon: 'critical',
          buttonMessage: tg('pages.changePassword.unreadableDataRemove'),
        }).then(
          () => removeUnreadableSecret(error.storageKey, error.vault).catch(showPasswordNotChanged),
          () => { /* NOOP - kept */ },
        );
        return true;
      }
      if (error instanceof VaultLegacyConflictError) {
        openConfirmModal({
          title: tg('pages.changePassword.notChangedTitle'),
          msg: tg('pages.changePassword.legacyCopiesMsg'),
          icon: 'critical',
          buttonMessage: tg('pages.changePassword.legacyCopiesRemove'),
        }).then(
          () => discardLegacyCopies(error.expected).catch(showPasswordNotChanged),
          () => { /* NOOP - kept */ },
        );
        return true;
      }
      return false;
    }

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
        const scrollEl: HTMLElement = wrapper.value?.contentEl?.$el;
        scrollEl?.scrollBy(0, scrollEl?.scrollWidth);
      } catch (error) {
        isPasswordChangedSuccessfully.value = false;
        if (error instanceof WrongPasswordError) {
          isAuthFailed.value = true;
        } else if (!offerPasswordChangeRecovery(error)) {
          showPasswordNotChanged(error);
        }
      } finally {
        isAuthenticating.value = false;
        currentPassword.value = '';
        newPassword.value = '';
        confirmNewPassword.value = '';
      }
    }

    /**
     * Toggling password protection on/off no longer pivots on
     * the hardcoded `STUB_ACCOUNT.password`. When disabling, a new per-install
     * 256-bit random secret becomes the password; when enabling, the user's
     * password replaces it. Either way `setPassword` stores the secret, or its
     * removal, in the same commit as the salt. This function is also
     * the natural rotation point for legacy wallets still encrypted
     * with `LEGACY_DEFAULT_PASSWORD` — toggling off+on rotates them
     * onto a fresh per-install secret through the `setPassword` call.
     */
    async function setPasswordEnabled(val: boolean) {
      // Both rotate the password: one at a time.
      if (isAuthenticating.value) {
        return;
      }
      isAuthenticating.value = true;
      try {
        if (val) {
          /**
           * Do NOT flip `isUsingDefaultPassword` to `false` before the password
           * is actually set. `openSetPasswordModal()` can reject (user cancels
           * the dialog), leaving the ref desynced from the on-disk state.
           */
          const { password, isDefaultPasswordSecret } = await openSetPasswordModal();
          await setPassword(password, undefined, { isDefaultPasswordSecret });
          isUsingDefaultPassword.value = isDefaultPasswordSecret;
          return;
        }

        await setPassword(generateDefaultPasswordSecret(), undefined, {
          isDefaultPasswordSecret: true,
        });
        isUsingDefaultPassword.value = true;
      } catch (error) {
        if (!(error instanceof RejectedByUserError) && !offerPasswordChangeRecovery(error)) {
          showPasswordNotChanged(error);
        }
      } finally {
        isAuthenticating.value = false;
      }
    }

    function msToMinutes(ms: number) {
      return Math.floor(ms / 60000);
    }

    onMounted(async () => {
      isDeviceAuthenticationAvailable.value = await canAuthenticateWithDevice();
      if (!isDeviceAuthenticationAvailable.value && IS_MOBILE_APP) {
        openEnableBiometricLoginModal();
      }
    });

    return {
      wrapper,
      AUTHENTICATION_TIMEOUTS,
      IS_MOBILE_APP,
      infoBoxEl,
      isBiometricLoginEnabled,
      isDeviceAuthenticationAvailable,
      isPasswordChangedSuccessfully,
      isAuthFailed,
      isAuthenticating,
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
