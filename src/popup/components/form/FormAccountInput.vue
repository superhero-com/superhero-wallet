<template>
  <FormTextarea
    :readonly="readonly"
    :text-limit="textLimit"
    :model-value="modelValue"
    :hide-error="isDropdownOpen"
    :resizable="false"
    :placeholder="placeholder"
    style="position: relative"
    :disable-label-focus="!!selectedAddress"
    auto-height
    @input="$emit('update:modelValue', $event.target.value)"
  >
    <template v-if="selectedAddress" #default>
      <Truncate
        :str="selectedAddress.name"
        class="truncated-text"
      />
      <AddressTruncated
        :address="selectedAddress.address"
        :protocol="protocol"
      />
    </template>

    <template v-if="selectedAddress" #after>
      <BtnIcon
        v-if="!hideClearIcon"
        :icon="CircleCloseIcon"
        data-cy="clear-address-button"
        class="close-icon"
        size="sm"
        @click="clearAddress"
      />
    </template>

    <template
      v-for="(index, name) in $slots"
      #[name]
    >
      <slot :name="name" />
    </template>

    <template #before-main>
      <div
        class="dropdown-wrapper styled-scrollbar"
        :class="{ open: isDropdownOpen }"
      >
        <div
          v-for="option in filteredOptions"
          :key="option.address"
          class="dropdown-item"
          @click="selectValue(option, $event)"
        >
          <Avatar
            size="sm"
            :address="option.address"
            :name="protocol"
            class="notification-avatar"
          />
          <Truncate
            v-if="option.name"
            :str="option.name"
            class="truncated-text"
          />
          <AddressTruncated
            v-if="option.address"
            :address="option.address"
            :protocol="protocol"
            class="truncated-address"
          />
        </div>
      </div>
    </template>
  </FormTextarea>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted, PropType,
  ref,
  watch,
} from 'vue';

import { IAddressBookEntry, Protocol } from '@/types';
import { useAddressBook } from '@/composables';

import Avatar from '@/popup/components/Avatar.vue';
import AddressTruncated from '@/popup/components/AddressTruncated.vue';
import Truncate from '@/popup/components/Truncate.vue';
import FormTextarea from '@/popup/components/form/FormTextarea.vue';

import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';
import CircleCloseIcon from '@/icons/circle-close.svg?vue-component';

const SIZES = ['xxs', 'xs', 'sm', 'rg', 'md'];

export default defineComponent({
  components: {
    FormTextarea,
    Avatar,
    BtnIcon,
    Truncate,
    AddressTruncated,
  },
  props: {
    type: { type: String, default: '' },
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    textLimit: { type: Number, default: null },
    resizable: { type: Boolean, default: true },
    size: {
      type: String,
      default: null,
      validator: (val: string) => SIZES.includes(val),
    },
    options: {
      type: Array,
      default: () => [],
    },
    enterSubmit: Boolean,
    readonly: Boolean,
    hideClearIcon: Boolean,
    protocol: { type: String as PropType<Protocol>, default: null },
  },
  emits: ['update:modelValue', 'submit'],
  setup(props, { emit }) {
    const {
      addressBookFiltered,
      protocolFilter,
    } = useAddressBook();
    protocolFilter.value = props.protocol;

    const isDropdownOpen = ref(false);
    const selectedAddress = ref<IAddressBookEntry | undefined>();
    const filteredOptions = computed(() => (
      addressBookFiltered.value.filter((entry: IAddressBookEntry) => (
        entry.address.toLowerCase().includes(props.modelValue.toString().toLowerCase())
            || entry.name.toLowerCase().includes(props.modelValue.toString().toLowerCase())
      ))
    ));

    function clearAddress() {
      selectedAddress.value = undefined;
      emit('update:modelValue', '');
    }

    function selectValue(entry: IAddressBookEntry, $event: Event) {
      $event.preventDefault();
      emit('update:modelValue', entry?.address);
      isDropdownOpen.value = false;
    }

    onMounted(() => {
      watch(() => props.modelValue, () => {
        const searchAddress = addressBookFiltered.value
          ?.find((entry: IAddressBookEntry) => (entry.address === props.modelValue));
        if (searchAddress) {
          selectedAddress.value = searchAddress;
        }
        if (!props.modelValue) { // If it's cleared externally
          selectedAddress.value = undefined;
        }

        isDropdownOpen.value = props.modelValue.toString().length >= 2
            && filteredOptions.value.length > 0;
        if (addressBookFiltered.value?.find(
          (entry) => (entry.address === props.modelValue.toString()),
        )) {
          isDropdownOpen.value = false;
        }
      }, { immediate: true });
    });

    return {
      filteredOptions,
      selectedAddress,
      clearAddress,
      selectValue,
      isDropdownOpen,
      CircleCloseIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.close-icon {
  padding: 0;
  opacity: 0.5;
}

.truncated-text {
  color: $color-white;
}

.input-field {
  &:where(
    &:has(input:focus),
    &:has(textarea:focus),
    &:has(label:active)
  ) {
    .dropdown-wrapper {
      display: block;
      top: calc(100% + 4px);
      opacity: 1;
      user-select: all;
      pointer-events: all;
    }
  }

  .dropdown-wrapper {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    display: block;
    background-color: $color-black;
    border: none;
    border-radius: $border-radius-interactive;
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.15), 2px 2px 8px 0px rgba(0, 0, 0, 0.33);
    transition: 100ms ease-in-out;
    max-height: 240px;
    overflow: scroll;
    opacity: 0;
    user-select: none;
    pointer-events: none;
    padding: 5px 2px;
    overflow-x: hidden;
    overflow-y: auto;
    z-index: -1;

    .dropdown-item {
      padding: 8px;
      cursor: pointer;
      user-select: none;
      display: flex;
      gap: 6px;
      justify-content: center;
      align-items: center;
    }

    .dropdown-item:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    }
  }

  &:where(
    &:has(input:focus),
    &:has(textarea:focus),
    &:has(label:active)
  ) .dropdown-wrapper.open {
    display: block;
    top: calc(100% + 4px);
    opacity: 1;
    user-select: all;
    pointer-events: all;
    z-index: 2;
  }
}
</style>
