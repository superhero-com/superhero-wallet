<template>
  <Modal
    class="set-password"
    from-bottom
    has-close-button
    centered
    @close="resolve"
  >
    <div class="icon-wrapper">
      <IconBoxed
        :icon="LockIcon"
        class="icon"
        bg-colored
        bg-more-transparent
        icon-padded
      />
    </div>

    <div class="info">
      <h3 class="text-heading-4 heading">
        {{ $t('pages.secureLogin.setPassword.title') }}
      </h3>
      <div class="text-description">
        <p>{{ $t('pages.secureLogin.setPassword.text') }}</p>
        <p>{{ $t('pages.secureLogin.setPassword.text2') }}</p>
      </div>
    </div>

    <div class="inputs">
      <Form v-slot="{ errors, handleSubmit }" @submit="null">
        <Field
          v-slot="{ field, errorMessage }"
          key="password"
          :validate-on-blur="true"
          :validate-on-model-update="false || !!errors.password"
          name="password"
          :rules="{
            required: true,
            password_min_len: 8,
          }"
        >
          <InputPassword
            v-bind="field"
            v-model="password"
            data-cy="password"
            class="password-input"
            :placeholder="$t('pages.secureLogin.setPassword.passwordPlaceholder')"
            :label="$t('pages.secureLogin.setPassword.passwordLabel')"
            :message="errorMessage"
            :help="{
              title: $t('pages.secureLogin.setPassword.help.title'),
              msg: $t('pages.secureLogin.setPassword.help.text'),
            }"
            show-password-strength
          />
        </Field>
        <Field
          v-slot="{ field, errorMessage }"
          key="confirmPassword"
          name="confirmPassword"
          :rules="{
            required: true,
            passwords_match: password,
          }"
        >
          <InputPassword
            v-bind="field"
            v-model="confirmPassword"
            data-cy="confirmPassword"
            class="password-input"
            :placeholder="$t('pages.secureLogin.setPassword.confirmPlaceholder')"
            :label="$t('pages.secureLogin.setPassword.confirmLabel')"
            :message="errorMessage"
            hide-eye-icon
            @keydown.enter="handleSubmit($event, onSubmit)"
          />
        </Field>

        <BtnMain
          class="btn-main"
          variant="primary"
          extend
          :disabled="(
            !password
            || !confirmPassword
            || !!errors.password
            || !!errors.confirmPassword
          )"
          :text="$t('pages.secureLogin.setPassword.confirm')"
          @click="handleSubmit($event, onSubmit)"
        />
      </Form>
    </div>
  </Modal>
</template>

<script lang="ts">
// TODO pin: update according to design
import { defineComponent, PropType, ref } from 'vue';
import { Form, Field } from 'vee-validate';
import type { RejectCallback, ResolveCallback } from '@/types';

import Modal from '@/popup/components/Modal.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';
import InputPassword from '@/popup/components/InputPassword.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';

import LockIcon from '@/icons/lock.svg?vue-component';

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
  },
  setup(props) {
    const password = ref('');
    const confirmPassword = ref('');

    function onSubmit() {
      props.resolve(password.value);
    }

    return {
      password,
      confirmPassword,
      onSubmit,
      LockIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.set-password {
  .info {
    text-align: center;
  }

  .inputs {
    width: 100%;

    .btn-main {
      // TODO pin: update according to design
      margin-top: 20px;
    }
  }
}
</style>
