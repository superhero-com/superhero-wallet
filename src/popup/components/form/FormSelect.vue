<template>
  <BtnPlain
    v-if="unstyled"
    class="form-select unstyled"
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
import { computed, defineComponent, PropType } from '@vue/composition-api';
import { MODAL_FORM_SELECT_OPTIONS } from '../../utils';
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
    value: { type: [String, Number], default: null },
    options: { type: Array as PropType<IFormSelectOption[]>, default: () => [] },
    defaultText: { type: String, required: true },
    itemTitle: { type: String as PropType<keyof IFormSelectOption>, default: 'text' },
    /**
     * Force to always display the text provided by the `defaultText` prop.
     */
    persistentDefaultText: Boolean,
    /**
     * Decides if the input looks like a regular text instead of a form input element
     */
    unstyled: Boolean,
  },
  setup(props, { emit }) {
    const { openModal } = useModals();

    const currentText = computed(() => {
      if (props.persistentDefaultText) {
        return props.defaultText;
      }
      return (props.value)
        ? props.options.find(({ value }) => value === props.value)?.[props.itemTitle]
        : props.defaultText;
    });

    function openOptionsModal() {
      openModal(MODAL_FORM_SELECT_OPTIONS, {
        value: props.value,
        options: props.options,
        title: props.defaultText,
      })
        .then((val) => emit('select', val))
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
