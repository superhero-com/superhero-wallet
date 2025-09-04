<template>
  <div class="account-selector">
    <Avatar
      v-if="!avatarOnly"
      :address="modelValue.toString()"
      size="lg"
    />
    <div>
      <BtnPill
        class="account-select"
        :class="{ 'avatar-only': avatarOnly }"
        :avatar="avatarOnly"
        dense
      >
        <FormSelect
          v-bind="$attrs"
          :avatar="avatarOnly"
          :model-value="modelValue"
          :options="options || accountsSelectOptions"
          :hide-arrow="avatarOnly"
          :default-text="$t('modals.createMultisigAccount.selectAccount')"
          account-select
          unstyled
          @update:modelValue="onSelect"
        >
          <template #current-text="{ text }">
            <slot>
              <div v-if="!avatarOnly">
                <Truncate
                  class="account-select-text"
                  :str="text"
                />
              </div>
              <Avatar
                v-if="avatarOnly"
                :address="modelValue.toString()"
                size="sm"
              />
            </slot>
          </template>
        </FormSelect>
      </BtnPill>
      <AddressTruncated
        v-if="!avatarOnly"
        show-explorer-link
        show-protocol-icon
        :address="modelValue.toString()"
        :protocol="selectedAccount?.protocol!"
        class="address-truncated"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import type { AccountAddress, IFormSelectOption } from '@/types';
import { useAccounts } from '@/composables';

import Avatar from './Avatar.vue';
import AddressTruncated from './AddressTruncated.vue';
import BtnPill from './buttons/BtnPill.vue';
import FormSelect from './form/FormSelect.vue';
import Truncate from './Truncate.vue';

export default defineComponent({
  components: {
    Avatar,
    AddressTruncated,
    BtnPill,
    FormSelect,
    Truncate,
  },
  model: {
    event: 'select',
  },
  props: {
    modelValue: { type: String as PropType<AccountAddress>, default: null },
    options: { type: Array as PropType<IFormSelectOption[]>, default: () => null },
    avatarOnly: Boolean,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { accountsSelectOptions, getAccountByAddress } = useAccounts();

    const selectedAccount = computed(
      () => (props.modelValue)
        ? getAccountByAddress(props.modelValue)
        : undefined,
    );

    function onSelect(value: string) {
      const [, address] = String(value).split(':');
      emit('update:modelValue', address as AccountAddress);
    }
    return {
      accountsSelectOptions,
      selectedAccount,
      onSelect,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.account-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-block: 4px;

  .account-select-text {
    max-width: 220px;
  }

  .account-select {
    margin-bottom: 4px;
    margin-left: -3px; // Compensate roundness
    color: $color-white;

    &.avatar-only {
      margin-bottom: 0;
    }
  }

  .address-truncated {
    color: $color-white;
  }
}
</style>
