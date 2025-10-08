<template>
  <Modal
    class="account-select-options"
    has-close-button
    no-padding
    from-bottom
    full-screen
    @close="reject()"
  >
    <template #header>
      <FormSelectOptionsHeader
        v-model="searchPhrase"
        :title="title"
        :options-length="options.length"
        :search-placeholder="$t('pages.accounts.searchAccountsPlaceholder')"
        :hide-search="hideSearch"
      />
    </template>

    <FiltersBar
      class="filters"
      @filters-cleared="searchPhrase = ''"
    />

    <div class="items-list">
      <AccountSelectOptionsItem
        v-for="(option, index) in optionsFiltered"
        :key="option.value || index"
        :option="option"
        :selected="option.value === value"
        clickable
        @click="resolve(option.value)"
      />
    </div>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
  watch,
} from 'vue';
import type {
  AccountAddress,
  IFormSelectOption,
  RejectCallback,
  ResolveCallback,
} from '@/types';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';
import { useAccountSelector } from '@/composables';

import Modal from '../Modal.vue';
import AccountSelectOptionsItem from '../AccountSelectOptionsItem.vue';
import FormSelectOptionsHeader from '../FormSelectOptionsHeader.vue';
import FiltersBar from '../FiltersBar.vue';

export default defineComponent({
  components: {
    FiltersBar,
    FormSelectOptionsHeader,
    AccountSelectOptionsItem,
    Modal,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    title: { type: String, default: null },
    value: { type: [String, Number], default: null },
    options: { type: Array as PropType<IFormSelectOption[]>, default: () => [] },
    hideSearch: Boolean,
  },
  setup(props) {
    // TODO AIRGAP: implement multiple accounts selection
    const { getName } = useAeNames();
    const { protocolFilter } = useAccountSelector();

    const searchPhrase = ref('');

    const optionsFiltered = computed(() => {
      const norm = (searchPhrase.value || '').toLowerCase().trim();
      const base = norm
        ? props.options.filter(({ text, value }) => (
          text.toLowerCase().includes(norm)
          || value.toString().toLowerCase().includes(norm)
          || getName(value as AccountAddress).value
            .toLowerCase()
            .includes(norm)
        ))
        : props.options;

      if (!protocolFilter.value) return base;

      return base.filter(({ value }) => (
        String(value).startsWith(`${protocolFilter.value}:`)
        || String(value).includes(`:${protocolFilter.value}:`)
      ));
    });

    watch(
      protocolFilter,
      () => {
        // If user clears protocol (clicks All), ensure list resets even if search was empty
        if (!protocolFilter.value && (searchPhrase.value || '') === '') {
          // Trigger recompute via no-op assignment
          searchPhrase.value = '';
        }
      },
    );

    return {
      searchPhrase,
      optionsFiltered,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-select-options {
  .filters {
    padding: 0 8px 8px 8px;
  }

  .items-list {
    display: flex;
    flex-direction: column;
    row-gap: 8px;
    padding-inline: 8px;
  }
}
</style>
