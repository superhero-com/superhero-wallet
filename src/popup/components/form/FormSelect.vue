<template>
  <BtnPlain
    v-if="unstyled"
    class="form-select unstyled"
    v-bind="$attrs"
    @click="openOptionsModal"
  >
    <slot
      name="current-text"
      :text="currentText"
    >
      {{ currentText }}
    </slot>
    <ChevronDownIcon class="arrow-icon" />
  </BtnPlain>
  <BtnPlain
    v-else-if="customStyle"
    class="form-select custom-style"
    @click="openOptionsModal"
  >
    <slot
      name="custom-style"
    />
  </BtnPlain>
  <InputField
    v-else
    v-bind="$attrs"
    class="form-select"
    @click="openOptionsModal"
  >
    <div class="input-field-text-wrapper">
      {{ currentText }}
    </div>

    <template #after>
      <ChevronDownIcon class="arrow-icon" />
    </template>
  </InputField>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { MODAL_ACCOUNT_SELECT_OPTIONS, MODAL_FORM_SELECT_OPTIONS } from '@/constants';
import type { IFormSelectOption } from '../../../types';
import { useModals } from '../../../composables';

import BtnPlain from '../buttons/BtnPlain.vue';
import InputField from '../InputField.vue';

import ChevronDownIcon from '../../../icons/chevron-down.svg?vue-component';

export default defineComponent({
  name: 'FormSelect',
  components: {
    BtnPlain,
    ChevronDownIcon,
    InputField,
  },
  model: {
    event: 'select',
  },
  props: {
    modelValue: { type: [String, Number], default: null },
    options: { type: Array as PropType<IFormSelectOption[]>, default: () => [] },
    itemTitle: { type: String as PropType<keyof IFormSelectOption>, default: 'text' },
    defaultText: { type: String, required: true },
    accountSelect: Boolean,
    /**
     * Force to always display the text provided by the `defaultText` prop.
     */
    persistentDefaultText: Boolean,
    /**
     * Decides if the input looks like a regular text instead of a form input element
     */
    unstyled: Boolean,
    /**
     * Decides if the UI can be completely changed
     */
    customStyle: Boolean,
  },
  emits: ['select', 'update:modelValue'],
  setup(props, { emit }) {
    const { openModal } = useModals();

    const currentText = computed(() => props.persistentDefaultText || !props.modelValue
      ? props.defaultText
      : props.options.find(({ value }) => value === props.modelValue)?.[props.itemTitle]);

    function openOptionsModal() {
      openModal(props.accountSelect ? MODAL_ACCOUNT_SELECT_OPTIONS : MODAL_FORM_SELECT_OPTIONS, {
        value: props.modelValue,
        options: props.options,
        title: props.defaultText,
      })
        .then((val) => {
          emit('select', val);
          emit('update:modelValue', val);
        })
        .catch(() => null); // Closing the modal does nothing
    }

    return {
      currentText,
      openOptionsModal,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables' as *;
@use '../../../styles/typography';

.form-select {
  &.unstyled {
    display: flex;
    align-items: center;
    gap: 4px;
    font: inherit;
    transition: 200ms;

    &:hover,
    &:active {
      color: $color-white;
    }
  }

  .arrow-icon {
    flex-shrink: 0;
    width: 8px !important;
    height: 5px !important;
    opacity: 0.75;
  }

  .input-field-text-wrapper {
    flex-grow: 1;
  }
}
</style>
