<template>
  <div class="account-selector">
    <Avatar
      v-if="!avatarOnly"
      :address="modelValue.toString()"
    />
    <div>
      <BtnPill
        class="account-select"
        :class="{ 'avatar-only': avatarOnly }"
        dense
      >
        <FormSelect
          v-bind="$attrs"
          :model-value="modelValue"
          :options="options || accountsSelectOptions"
          :unstyled="!avatarOnly"
          :custom-style="avatarOnly"
          :default-text="$t('modals.createMultisigAccount.selectAccount')"
          account-select
          @update:modelValue="$emit('update:modelValue', $event)"
        >
          <template
            v-if="!avatarOnly"
            #current-text="{ text }"
          >
            <div>
              <Truncate
                class="account-select-text"
                :str="text"
              />
            </div>
          </template>
          <template
            v-if="avatarOnly"
            #custom-style
          >
            <Avatar
              :address="modelValue.toString()"
              size="sm"
            />
          </template>
        </FormSelect>
      </BtnPill>
      <AddressTruncated
        v-if="!avatarOnly"
        :protocol="modelValue.protocol"
        show-explorer-link
        :address="modelValue.toString()"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { useStore } from 'vuex';
import { useAccounts } from '../../composables';
import type { IFormSelectOption } from '../../types';

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
    avatarOnly: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup() {
    const store = useStore();

    const { accountsSelectOptions } = useAccounts({ store });

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

      &.btn-pill {
        padding: 4px;
        background-color: transparent;

        & .button-plain {
          width: 24px;
          height: 24px;
        }
      }
    }
  }
}
</style>
