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
} from 'vue';
import type {
  AccountAddress,
  IFormSelectOption,
  RejectCallback,
  ResolveCallback,
} from '@/types';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';

import Modal from '../Modal.vue';
import AccountSelectOptionsItem from '../AccountSelectOptionsItem.vue';
import FormSelectOptionsHeader from '../FormSelectOptionsHeader.vue';

export default defineComponent({
  components: {
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

    const searchPhrase = ref('');

    const optionsFiltered = computed(() => (
      props.options.filter(({ text, value }) => (
        text.toLowerCase().includes(searchPhrase.value)
        || value.toString().includes(searchPhrase.value)
        || getName(value as AccountAddress).value.includes(searchPhrase.value)
      ))
    ));

    return {
      searchPhrase,
      optionsFiltered,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-select-options {
  .items-list {
    display: flex;
    flex-direction: column;
    row-gap: 8px;
    padding-inline: 8px;
  }
}
</style>
