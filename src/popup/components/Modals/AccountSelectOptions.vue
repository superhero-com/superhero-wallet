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
      />
    </template>

    <div>
      <AccountInfoCard
        v-for="(account, index) in optionsFiltered"
        :key="index"
        :address="account.address"
        :idx="account.idx"
        :name="account.name"
        :account="account"
        :is-selected="account.address === value"
        @click="resolve(account.address)"
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
} from '@vue/composition-api';
import type { IFormSelectOption, ResolveRejectCallback } from '../../../types';

import Modal from '../Modal.vue';
import FormSelectOptionsHeader from '../FormSelectOptionsHeader.vue';
import AccountInfoCard from '../AccountInfoCard.vue';

export default defineComponent({
  components: {
    AccountInfoCard,
    FormSelectOptionsHeader,
    Modal,
  },
  props: {
    resolve: { type: Function as ResolveRejectCallback, required: true },
    reject: { type: Function as ResolveRejectCallback, required: true },
    title: { type: String, default: null },
    value: { type: [String, Number], default: null },
    options: { type: Array as PropType<IFormSelectOption[]>, default: () => [] },
  },
  setup(props) {
    const searchPhrase = ref('');

    const optionsFiltered = computed(() => (
      props.options.filter(({ text, value }) => (
        text.toLowerCase().includes(searchPhrase.value)
        || value.toString().includes(searchPhrase.value)
      ))
    ));

    return {
      searchPhrase,
      optionsFiltered,
    };
  },
});
</script>
