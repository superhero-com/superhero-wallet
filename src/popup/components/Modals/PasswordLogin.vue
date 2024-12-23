<template>
  <Modal
    class="password-login"
    from-bottom
    centered
    no-bg-blur
  >
    <div class="content-wrapper">
      <div class="icon-wrapper">
        <IconBoxed
          :icon="LockIcon"
          bg-colored
          bg-dimmed
          icon-padded
        />
      </div>
      <div class="info">
        <h3
          class="text-heading-4 heading"
          v-text="$t('pages.secureLogin.enterPassword')"
        />

        <div
          class="text-description"
          v-text="$t('pages.secureLogin.toUnlock')"
        />
      </div>
      <form
        class="password-login-form"
        autocomplete="off"
        @submit.prevent="login"
      >
        <InputPassword
          v-model="password"
          data-cy="password"
          autofocus
          class="password-input"
          :placeholder="$t('pages.secureLogin.login.placeholder')"
          :label="$t('pages.secureLogin.login.label')"
          :message="isAuthFailed ? $t('pages.secureLogin.login.error') : null"
          @input="isAuthFailed = false"
        />

        <LinkButton
          class="forgot-password"
          href="#"
          :text="$t('pages.secureLogin.login.forgot')"
          underlined
          @click.capture.stop.prevent="openForgotPasswordModal()"
        />

        <BtnMain
          class="login-btn"
          data-cy="login-btn"
          variant="primary"
          type="submit"
          :disabled="!password.length || isAuthenticating || isAuthFailed"
          :text="$t('pages.secureLogin.login.unlock')"
          extend
        />
      </form>
    </div>
  </Modal>
</template>

<script lang="ts">
import {
  ref,
  defineComponent,
  PropType,
} from 'vue';

import type { ResolveCallback } from '@/types';
import { MODAL_RESET_WALLET } from '@/constants';
import { useAuth, useModals, useAccounts } from '@/composables';

import Modal from '@/popup/components/Modal.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';
import InputPassword from '@/popup/components/InputPassword.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import LinkButton from '@/popup/components/LinkButton.vue';

import FingerprintIcon from '@/icons/fingerprint.svg?vue-component';
import LockIcon from '@/icons/secure-lock-outline.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    InputPassword,
    BtnMain,
    IconBoxed,
    LinkButton,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
  },
  setup(props) {
    const isAuthFailed = ref(false);
    const isAuthenticating = ref(false);
    const password = ref('');

    const { authenticateWithPassword, isAuthenticated } = useAuth();
    const { accountsRaw } = useAccounts();
    const { openModal } = useModals();

    async function openForgotPasswordModal() {
      await openModal(MODAL_RESET_WALLET, {
        isResetPassword: true,
      });
      // If there are no accounts wallet was reset
      if (accountsRaw.value.length === 0) {
        props.resolve();
      }
    }

    async function login() {
      if (isAuthenticating.value || isAuthenticated.value) {
        return;
      }
      isAuthFailed.value = false;
      isAuthenticating.value = true;
      try {
        await authenticateWithPassword(password.value);
        props.resolve();
      } catch (error) {
        isAuthFailed.value = true;
      } finally {
        isAuthenticating.value = false;
      }
    }

    return {
      password,
      isAuthenticating,
      isAuthFailed,
      login,
      openForgotPasswordModal,
      LockIcon,
      FingerprintIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.password-login {
  z-index: $z-index-login-modal;

  .content-wrapper,
  .password-login-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .password-input {
    width: 100%;
  }

  .forgot-password {
    @extend %face-sans-15-medium;

    align-self: flex-start;
  }

  .login-btn {
    margin-top: 40px;
  }
}
</style>
