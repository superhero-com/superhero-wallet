<template>
  <BtnPlain
    class="form-select"
    :class="{ unstyled }"
    @click="openOptionsModal"
  >
    {{ currentText }}
    <ChevronDownIcon class="arrow-icon" />
  </BtnPlain>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api';
import { MODAL_FORM_SELECT_OPTIONS } from '../../utils';
import BtnPlain from '../buttons/BtnPlain.vue';
import ChevronDownIcon from '../../../icons/chevron-down.svg?vue-component';

export interface FormSelectOption {
  text: string
  value: string | number
  address?: string
}

export default defineComponent({
  name: 'FormSelect',
  components: {
    BtnPlain,
    ChevronDownIcon,
  },
  model: {
    event: 'select',
  },
  props: {
    value: { type: [String, Number], default: null },
    options: { type: Array as PropType<FormSelectOption[]>, default: () => [] },
    defaultText: { type: String, required: true },
    /**
     * Force to always display the text provided by the `defaultText` prop.
     */
    persistentDefaultText: Boolean,
    /**
     * Decides if the input looks like a regular text instead of a form input element
     */
    unstyled: Boolean,
  },
  setup(props, { emit, root }) {
    const currentText = computed(() => {
      if (props.persistentDefaultText) {
        return props.defaultText;
      }
      return (props.value)
        ? props.options.find(({ value }) => value === props.value)?.text
        : props.defaultText;
    });

    function openOptionsModal() {
      root.$store.dispatch(
        'modals/open',
        {
          name: MODAL_FORM_SELECT_OPTIONS,
          value: props.value,
          options: props.options,
          title: props.defaultText,
        },
      )
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

.form-select {
  display: flex;
  align-items: center;
  gap: 4px;

  .arrow-icon {
    flex-shrink: 0;
    width: 8px;
    opacity: 0.75;
  }

  &:not(.unstyled) {
    padding: 8px 12px;
    background-color: rgba($color-white, 0.08);
    border-radius: $border-radius-interactive;
  }

  &.unstyled {
    font: inherit;
    transition: 200ms;

    &:hover,
    &:active {
      color: $color-success-hover;
    }
  }
}
</style>
