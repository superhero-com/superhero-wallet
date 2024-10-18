<template>
  <InputAccount
    v-bind="$attrs"
    class="textarea"
    :class="[size, { 'auto-height': autoHeight }]"
    :readonly="readonly"
    :text-limit="textLimit"
    :model-value="modelValue"
    :addresses="addressBookFiltered"
    :protocol="protocol"
    style="position: relative"
    @update:modelValue="handleUpdate"
  >
    <template #default="{ inputId }">
      <textarea
        v-show="!selectedAddress"
        :id="inputId"
        ref="textarea"
        data-cy="textarea"
        class="textarea-input styled-scrollbar"
        :class="{ resizable: resizable && !autoHeight }"
        :style="{ height }"
        :placeholder="placeholder"
        :value="modelValue"
        :rows="1"
        :disabled="selectedAddress || readonly"
        @keydown.enter.prevent="handleEnterClick"
        @input="(payload) => handleInput(payload as InputEvent)"
        @blur="(payload) => handleInput(payload as unknown as InputEvent)"
      />
      <template v-if="selectedAddress">
        <Truncate
          :str="selectedAddress.name"
          class="truncated-text"
        />
        <AddressTruncated
          :address="selectedAddress.address"
          :protocol="protocol"
        />
        <BtnIcon
          v-if="!hideClearIcon"
          :icon="CircleCloseIcon"
          data-cy="clear-address-button"
          class="close-icon"
          size="sm"
          @click="clearAddress"
        />
      </template>
    </template>

    <template
      v-for="(index, name) in $slots"
      #[name]
    >
      <slot :name="name" />
    </template>
  </InputAccount>
</template>

<script lang="ts">
import { useAddressBook } from '@/composables';
import { PROTOCOLS } from '@/constants';
import CircleCloseIcon from '@/icons/circle-close.svg?vue-component';
import AddressTruncated from '@/popup/components/AddressTruncated.vue';
import InputAccount from '@/popup/components/InputAccount.vue';
import Truncate from '@/popup/components/Truncate.vue';
import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';
import { IAddressBookEntry, Protocol } from '@/types';
import {
  defineComponent,
  nextTick,
  onMounted, PropType,
  ref,
  watch,
} from 'vue';

const SIZES = ['xxs', 'xs', 'sm', 'rg', 'md'];

export default defineComponent({
  components: {
    BtnIcon,
    InputAccount,
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
      default() {
        return [];
      },
    },
    enterSubmit: Boolean,
    autoHeight: Boolean,
    readonly: Boolean,
    hideClearIcon: { type: Boolean, default: false },
    protocol: { type: String as PropType<Protocol>, default: null },
  },
  emits: ['update:modelValue', 'submit'],
  setup(props, { emit }) {
    // const addressBook = useStorageRef<IAddressBookEntry[]>([], STORAGE_KEYS.addressBook);
    const {
      addressBookFiltered,
      protocolFilter,
    } = useAddressBook();
    protocolFilter.value = props.protocol;

    const selectedAddress = ref<IAddressBookEntry | undefined>();

    const textarea = ref<HTMLTextAreaElement>();
    const height = ref<string | undefined>();
    function handleInput(event: InputEvent) {
      const { value } = event.target as HTMLInputElement;
      selectedAddress.value = undefined;
      const searchAddress = addressBookFiltered.value
        ?.find((entry) => (entry.address === value));
      if (searchAddress) {
        selectedAddress.value = searchAddress;
        emit('update:modelValue', searchAddress.address);
      } else {
        emit('update:modelValue', value);
      }
    }

    function handleUpdate(payload: IAddressBookEntry) {
      selectedAddress.value = payload;
      emit('update:modelValue', payload.address);
    }

    function handleEnterClick() {
      if (props.enterSubmit) {
        emit('submit');
      }
    }

    function clearAddress() {
      selectedAddress.value = undefined;
      emit('update:modelValue', '');
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

        if (props.autoHeight && textarea.value) {
          height.value = 'auto';
          nextTick(() => {
            if (!textarea.value) return;
            const { scrollHeight, clientHeight } = textarea.value!;
            const newHeight = clientHeight > scrollHeight ? clientHeight : scrollHeight;
            height.value = `${newHeight}px`;
          });
        }
      }, { immediate: true });
    });

    return {
      textarea,
      height,
      addressBookFiltered,
      handleInput,
      handleUpdate,
      handleEnterClick,
      selectedAddress,
      clearAddress,
      CircleCloseIcon,
    };
  },
  computed: {
    PROTOCOLS() {
      return PROTOCOLS;
    },
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.textarea {
  --base-line-height: 1.4em;
  --size: 1; // Amount of text lines

  &-input {
    @extend %face-sans-14-regular;

    min-height: calc(var(--base-line-height) * var(--size));
    width: 100%;
    background: transparent;
    border: none;
    padding: 0;
    color: $color-white;
    outline: none;
    word-break: break-word;
    line-height: var(--base-line-height);
    resize: none;

    &.resizable {
      resize: vertical;
    }
  }

  &.xs {
    --size: 3;
  }

  &.sm {
    --size: 4;
  }

  &.md {
    --size: 8;
  }

  &.auto-height, &.xxs {
    --size: 1;
  }
}

.close-icon {
  padding: 0;
  opacity: 0.5;
}

.truncated-text {
  color: $color-white;
}
</style>
