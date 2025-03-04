<template>
  <FormTextarea
    :readonly="readonly"
    :text-limit="textLimit"
    :model-value="inputValue"
    :resizable="false"
    :placeholder="placeholder"
    :message="message"
    auto-height
    enter-submit
    @update:modelValue="($event: any) => inputValue = $event"
    @submit="handleEnter"
  >
    <template #after>
      <BtnIcon
        v-if="!hideClearIcon && (selectedAddresses.length || inputValue.length)"
        :icon="CircleCloseIcon"
        data-cy="clear-address-button"
        class="close-icon"
        size="sm"
        @click="clearAll"
      />
    </template>
    <template
      v-if="selectedAddresses.length > 1 || (!singleDefaultFormat && selectedAddresses.length)"
      #under
    >
      <div class="selected-addresses-container styled-scrollbar">
        <div
          v-for="(account, idx) in selectedAddresses"
          :key="idx"
          class="selected-address-container"
        >
          <Truncate
            class="truncated-text"
            :class="{
              error: (hasError && messageAsObject?.text?.includes(account.address)),
              warning: (hasWarning && messageAsObject?.text?.includes(account.address)),
            }"
            :str="account.name"
          />
          <AddressTruncated
            v-if="!isNameValid(account.address) && isAccountAddressValid(account.address)"
            :address="account.address"
            :protocol="protocol"
            :class="{
              error: (hasError && messageAsObject?.text?.includes(account.address)),
              warning: (hasWarning && messageAsObject?.text?.includes(account.address)),
            }"
          />
          <BtnIcon
            v-if="!hideClearIcon"
            :icon="TrashIcon"
            data-cy="clear-address-button"
            class="close-icon"
            size="sm"
            @click="clearAddress(idx)"
          />
        </div>
      </div>
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
import { useI18n } from 'vue-i18n';

import type {
  IAddressBookEntry, IInputMessage, IInputMessageRaw, Protocol,
} from '@/types';
import { INPUT_MESSAGE_STATUSES } from '@/constants';
import { useAddressBook, useNetworks, useAccountSelector } from '@/composables';
import { excludeFalsy, removeDuplicates } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { isNameValid } from '@aeternity/aepp-sdk';

import Avatar from '@/popup/components/Avatar.vue';
import AddressTruncated from '@/popup/components/AddressTruncated.vue';
import Truncate from '@/popup/components/Truncate.vue';
import FormTextarea from '@/popup/components/form/FormTextarea.vue';

import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';
import CircleCloseIcon from '@/icons/circle-close.svg?vue-component';
import TrashIcon from '@/icons/trash.svg?vue-component';

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
    modelValue: { type: Array as PropType<string[]>, default: () => [] },
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
    message: {
      type: [String, Object] as PropType<IInputMessageRaw>,
      validator: (value: IInputMessageRaw) => {
        if (typeof value === 'object' && value.status) {
          return !!INPUT_MESSAGE_STATUSES[value.status];
        }
        return true;
      },
      default: null,
    },
    readonly: Boolean,
    hideClearIcon: Boolean,
    singleDefaultFormat: Boolean,
    protocol: { type: String as PropType<Protocol>, default: null },
  },
  emits: ['update:modelValue', 'submit'],
  setup(props, { emit }) {
    const { activeNetwork } = useNetworks();
    const {
      addressBookFiltered,
      protocolFilter,
    } = useAddressBook();
    const { allAccounts } = useAccountSelector();
    const { t } = useI18n();
    protocolFilter.value = props.protocol;

    const inputValue = ref(props.singleDefaultFormat ? (props.modelValue[0] ?? '') : '');
    const isDropdownOpen = ref(false);
    const selectedAddresses = ref<IAddressBookEntry[]>([]);
    const filteredOptions = computed(() => (
      addressBookFiltered.value.filter((entry: IAddressBookEntry) => (
        (entry.address.toLowerCase().includes(inputValue.value.toLowerCase())
            || entry.name.toLowerCase().includes(inputValue.value.toLowerCase()))
            && (
              !selectedAddresses.value.map((account) => account.address)
                .includes(entry.address)
              || !selectedAddresses.value.map((account) => account.name)
                .includes(entry.name)
            )
      ))
    ));
    const messageAsObject = computed(
      (): IInputMessage | null => (typeof props.message === 'object') ? props.message : { text: props.message },
    );
    const hasError = computed(
      () => (
        messageAsObject.value?.status === INPUT_MESSAGE_STATUSES.error
        || !!messageAsObject.value?.text
      ),
    );
    const hasWarning = computed(
      () => (messageAsObject.value?.status === INPUT_MESSAGE_STATUSES.warning),
    );

    function clearAddress(idx: number) {
      selectedAddresses.value.splice(idx, 1);
      emit('update:modelValue', selectedAddresses.value.map((account) => account.address));
    }

    function clearAll() {
      inputValue.value = '';
      selectedAddresses.value = [];
      emit('update:modelValue', []);
    }

    function selectValue(entry: IAddressBookEntry, $event: Event) {
      $event.preventDefault();
      if (props.singleDefaultFormat) {
        inputValue.value = entry.address;
      } else {
        inputValue.value = '';
        emit('update:modelValue', [entry.address, ...props.modelValue]);
      }
      isDropdownOpen.value = false;
    }

    function isAccountAddressValid(value: string) {
      return ProtocolAdapterFactory
        .getAdapter(props.protocol)
        .isAccountAddressValid(value, activeNetwork.value?.type);
    }

    function handleEnter() {
      inputValue.value += ',';
    }

    onMounted(() => {
      watch(() => [props.modelValue, allAccounts.value], () => {
        // Check and remove duplicates
        if (new Set(props.modelValue).size !== props.modelValue.length) {
          emit('update:modelValue', props.modelValue.filter(removeDuplicates));
        } else if (props.modelValue.length > 0) {
          selectedAddresses.value = props.modelValue
            .filter(excludeFalsy)
            .map((address) => {
              const existingAccount = allAccounts.value.find((account) => (
                account.address === address
              ));

              let name = address;
              if (isNameValid(address)) {
                name = address;
              } else if (isAccountAddressValid(address)) {
                name = t('modals.send.recipientLabel');
              }

              return existingAccount || {
                name,
                address,
                isBookmarked: false,
                protocol: props.protocol,
              };
            }) || [];
          if (selectedAddresses.value.length === 1 && props.singleDefaultFormat) {
            inputValue.value = selectedAddresses.value[0].address;
          }
        } else {
          inputValue.value = '';
          selectedAddresses.value = [];
        }
      }, { immediate: true });

      watch(inputValue, () => {
        isDropdownOpen.value = inputValue.value.length >= 2
          && filteredOptions.value.length > 0;
        if (props.singleDefaultFormat) {
          emit('update:modelValue', [inputValue.value]);
          return;
        }
        if (inputValue.value.length) {
          const values = inputValue.value.split(',').map((address: string) => address.trim());
          let parsedValues: string[] = [];
          // If the user has added multiple values (through copy paste), just append everything
          if (values.length > 1) {
            parsedValues = values.filter(excludeFalsy);
          } else {
            // Otherwise append only if the user has typed a valid address
            values.forEach((value) => {
              if (value && (isNameValid(value) || isAccountAddressValid(value))) {
                parsedValues.push(value);
              }
            });
          }
          if (inputValue.value === ',') {
            inputValue.value = '';
          }
          if (parsedValues.length > 0) {
            inputValue.value = '';
            emit('update:modelValue', [...parsedValues, ...props.modelValue].filter(removeDuplicates));
          }
        }
      });
    });

    return {
      messageAsObject,
      hasError,
      hasWarning,
      filteredOptions,
      selectedAddresses,
      clearAddress,
      clearAll,
      selectValue,
      handleEnter,
      inputValue,
      isDropdownOpen,
      isNameValid,
      isAccountAddressValid,
      CircleCloseIcon,
      TrashIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.input-field {
  .close-icon {
    align-self: flex-end;
    padding: 0;
    opacity: 0.5;
  }

  .truncated-text {
    color: $color-white;
  }

  .error {
    color: #{$color-danger};
  }

  .warning {
    color: #{$color-warning};
  }

  .dropdown-wrapper {
    position: absolute;
    z-index: -1;
    left: 0;
    right: 0;
    top: 0;
    display: block;
    opacity: 0;
    overflow-x: hidden;
    overflow-y: auto;
    transition: 100ms ease-in-out;
    box-shadow:
      inset 0 0 0 2px rgba($color-white, 0.15),
      2px 2px 8px 0px rgba($color-black, 0.33);
    border: none;
    border-radius: $border-radius-interactive;
    max-height: 240px;
    padding: 5px 2px;
    background-color: $color-black;
    user-select: none;
    pointer-events: none;

    .dropdown-item {
      justify-content: center;
      align-items: center;
      display: flex;
      padding: 8px;
      gap: 6px;
      cursor: pointer;
    }

    .dropdown-item:not(:last-child) {
      border-bottom: 1px solid rgba($color-white, 0.15);
    }
  }

  .selected-addresses-container {
    flex-direction: column;
    gap: 6px;
    display: flex;
    overflow: auto;
    width: 100%;
    max-height: 158px;
    padding-top: 8px;
    margin-top: 4px;
    border-top: 1px solid rgba($color-white, 0.15);

    .selected-address-container {
      display: flex;
      flex: 1;
      gap: 4px;
    }
  }

  &:where(
    &:has(input:focus),
    &:has(textarea:focus),
    &:has(label:active)
  ) {
    .dropdown-wrapper.open {
      top: calc(100% + 4px);
      display: block;
      opacity: 1;
      pointer-events: all;
      z-index: 2;
    }
  }
}
</style>
