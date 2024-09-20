<template>
  <InputField
    class="input-password"
    v-bind="$attrs"
    :model-value="modelValue"
    :type="isPasswordVisible ? 'text' : 'password'"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <template #after>
      <component
        :is="isPasswordVisible ? EyeClosedIcon : EyeIcon"
        v-if="!hideEyeIcon"
        class="eye-icon"
        @click="toggleVisibility"
      />
    </template>
    <template #label-after>
      <span
        v-if="showPasswordStrength && modelValue"
        class="password-strength"
        :class="[`strength-${passwordStrength}`]"
        v-text="passwordStrengthText"
      />
    </template>
  </InputField>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { PASSWORD_STRENGTH } from '@/constants';
import { checkPasswordStrength } from '@/utils';

import InputField from './InputField.vue';

import EyeIcon from '../../icons/eye-open.svg?vue-component';
import EyeClosedIcon from '../../icons/eye-closed.svg?vue-component';

export default defineComponent({
  components: {
    InputField,
  },
  props: {
    modelValue: { type: String, required: true },
    showPasswordStrength: Boolean,
    hideEyeIcon: Boolean,
  },
  setup(props) {
    const { t } = useI18n();
    const isPasswordVisible = ref(false);

    const passwordStrength = computed(() => checkPasswordStrength(props.modelValue));

    const passwordStrengthText = computed(() => {
      switch (passwordStrength.value) {
        case PASSWORD_STRENGTH.weak:
          return t('pages.secureLogin.passwordStrength.weak');
        case PASSWORD_STRENGTH.medium:
          return t('pages.secureLogin.passwordStrength.medium');
        case PASSWORD_STRENGTH.strong:
          return t('pages.secureLogin.passwordStrength.strong');
        default:
          return '';
      }
    });

    function toggleVisibility() {
      isPasswordVisible.value = !isPasswordVisible.value;
    }

    return {
      passwordStrength,
      passwordStrengthText,
      isPasswordVisible,
      toggleVisibility,
      EyeIcon,
      EyeClosedIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.input-password {
  .eye-icon {
    cursor: pointer;
    --size: 20px;
    opacity: 0.5;

    &:hover {
      opacity: 0.8;
    }
  }

  .password-strength {
    font-weight: 500;

    &.strength {
      &-weak {
        color: $color-danger;
      }

      &-medium {
        color: $color-warning;
      }

      &-strong {
        color: $color-success;
      }
    }
  }
}
</style>
