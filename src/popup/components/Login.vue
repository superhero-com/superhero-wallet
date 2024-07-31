<template>
  <div class="login">
    <Field
      v-slot="{ field, errorMessage }"
      key="password"
      name="password"
      :rules="{
        required: true,
      }"
    >
      <InputPassword
        v-bind="field"
        v-model="password"
        data-cy="password"
        autofocus
        class="password-input"
        :placeholder="$t('pages.secureLogin.login.placeholder')"
        :label="$t('pages.secureLogin.login.label')"
        :message="errorMessage"
        @keydown.enter="unlock"
      />
    </Field>
    <BtnMain
      variant="primary"
      extend
      :text="$t('pages.secureLogin.login.login')"
      @click="unlock"
    />
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import { Field } from 'vee-validate';

import InputPassword from '@/popup/components/InputPassword.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';

export default defineComponent({
  components: {
    Field,
    InputPassword,
    BtnMain,
  },
  setup(props, { emit }) {
    const password = ref('');

    function unlock() {
      emit('unlock', password.value);
    }

    return { password, unlock };
  },
});
</script>

<style scoped lang="scss">
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  gap: 20px;

  .password-input {
    width: 100%;
  }
}
</style>
