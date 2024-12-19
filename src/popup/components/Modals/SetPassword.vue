<template>
  <Modal
    class="set-password"
    from-bottom
    centered
    @close="handleClose()"
  >
    <div class="icon-wrapper">
      <IconBoxed
        :icon="LockIcon"
        class="icon"
        bg-colored
        bg-dimmed
        icon-padded
      />
    </div>

    <div class="info">
      <h3
        class="text-heading-4"
        v-text="$t('pages.setPassword.title')"
      />
      <p
        class="text-subheading"
        v-text="$t('pages.setPassword.text')"
      />
      <p
        class="text-description"
        v-text="isRestoredWallet
          ? $t('pages.setPassword.textRestoredWallet')
          : $t('pages.setPassword.text-2')"
      />
    </div>

    <div class="inputs">
      <Form v-slot="{ errors, handleSubmit }" class="inputs-form">
        <Field
          v-slot="{ field, errorMessage }"
          key="password"
          name="password"
          :validate-on-blur="true"
          :validate-on-model-update="!!errors.password"
          :rules="{
            password_min_len: 4,
          }"
        >
          <InputPassword
            v-bind="field"
            v-model="password"
            data-cy="password"
            class="password-input"
            :placeholder="$t('pages.setPassword.passwordPlaceholder')"
            :label="$t('pages.setPassword.passwordLabel')"
            :message="errorMessage ?? errors.confirmPassword"
            :help="{
              title: $t('pages.setPassword.help.title'),
              msg: $t('pages.setPassword.help.text'),
              fullscreen: true,
            }"
            show-password-strength
          />
        </Field>
        <Field
          v-slot="{ field, errorMessage }"
          key="confirmPassword"
          name="confirmPassword"
          :rules="{
            passwords_match: password,
          }"
        >
          <InputPassword
            v-bind="field"
            v-model="confirmPassword"
            data-cy="confirm-password"
            class="password-input"
            :placeholder="$t('pages.setPassword.confirmPlaceholder')"
            :label="$t('pages.setPassword.confirmLabel')"
            :message="errorMessage"
            hide-eye-icon
            @keydown.enter="handleSubmit($event, onSubmit)"
          />
        </Field>

        <div class="buttons">
          <BtnMain
            variant="primary"
            extend
            nowrap
            :disabled="(
              !password
              || !confirmPassword
              || !!errors.password
              || !!errors.confirmPassword
            )"
            :text="$t('pages.setPassword.confirm')"
            data-cy="btn-set-password"
            @click="handleSubmit($event, onSubmit)"
          />
          <BtnMain
            variant="muted"
            :text="$t('pages.setPassword.skip')"
            extend
            nowrap
            data-cy="btn-skip-password"
            @click="useDefaultPassword"
          />
        </div>
      </Form>
    </div>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { Form, Field } from 'vee-validate';

import type { RejectCallback, ResolveCallback } from '@/types';
import { STUB_ACCOUNT } from '@/constants/stubs';
import { useAuth } from '@/composables';

import Modal from '@/popup/components/Modal.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';
import InputPassword from '@/popup/components/InputPassword.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';

import LockIcon from '@/icons/secure-lock-outline.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    IconBoxed,
    InputPassword,
    BtnMain,
    Form,
    Field,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    isRestoredWallet: Boolean,
  },
  setup(props) {
    const { isUsingDefaultPassword } = useAuth();

    const password = ref('');
    const confirmPassword = ref('');

    function onSubmit() {
      props.resolve(password.value);
    }

    function handleClose() {
      if (!props.isRestoredWallet) {
        props.reject();
      }
    }

    /**
     * Bypassing password protection means we will still encrypt some important data,
     * but the stub password will be used for the encryption.
     */
    function useDefaultPassword() {
      props.resolve(STUB_ACCOUNT.password);
      isUsingDefaultPassword.value = true;
    }

    return {
      password,
      confirmPassword,
      extensionVersion: process.env.npm_package_version,
      onSubmit,
      handleClose,
      useDefaultPassword,
      LockIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
.set-password {
  .info {
    margin-top: 8px;
    text-align: center;
    display: flex;
    flex-direction: column;
  }

  .inputs {
    width: 100%;
    margin-top: 4px;

    .inputs-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
  }
}
</style>
