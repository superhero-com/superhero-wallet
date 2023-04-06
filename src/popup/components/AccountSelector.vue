<template>
  <div class="account-selector">
    <Avatar :address="value" />
    <div>
      <BtnPill
        class="account-select"
        dense
      >
        <FormSelect
          :value="value"
          :options="options || accountsSelectOptions"
          unstyled
          :default-text="$t('modals.createMultisigAccount.selectAccount')"
          account-select
          v-on="$listeners"
        >
          <template #current-text="{ text }">
            <div>
              <Truncate
                class="account-select-text"
                :str="text"
              />
            </div>
          </template>
        </FormSelect>
      </BtnPill>
      <AddressTruncated
        show-explorer-link
        :address="value"
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
    value: { type: [String, Number], default: null },
    options: { type: Array as PropType<IFormSelectOption[]>, default: () => null },
  },
  setup(props) {
    console.log(props);
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
  }
}
</style>
