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
          unstyled
          :hide-arrow="avatarOnly"
          :default-text="$t('modals.createMultisigAccount.selectAccount')"
          account-select
          @update:modelValue="$emit('update:modelValue', $event)"
        >
          <template #current-text="{ text }">
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
          </template>
        </FormSelect>
      </BtnPill>
      <AddressTruncated
        v-if="!avatarOnly"
        show-explorer-link
        show-protocol-icon
        :address="modelValue.toString()"
        class="address-truncated"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { IFormSelectOption } from '@/types';
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
    modelValue: { type: [String, Number], default: null },
    options: { type: Array as PropType<IFormSelectOption[]>, default: () => null },
    avatarOnly: Boolean,
  },
  emits: ['update:modelValue'],
  setup() {
    const { accountsSelectOptions } = useAccounts();

    return { accountsSelectOptions };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

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
