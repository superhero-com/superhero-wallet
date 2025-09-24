<template>
  <Modal
    class="protocol-select"
    from-bottom
    has-close-button
    centered
    @close="reject()"
  >
    <h1
      class="text-heading-4 heading"
      v-text="title"
    />

    <p class="text-caption caption">
      {{ subtitle }}
    </p>

    <InputSearch
      v-model="searchTerm"
      class="search-field"
      :placeholder="$t('common.searchForBlockchain')"
    />

    <BtnSubheader
      v-for="protocol in filteredProtocols"
      :key="protocol"
      :header="getProtocolName(protocol)"
      :subheader="$t(
        'modals.createAccount.addProtocolAccount', { name: getProtocolName(protocol) })"
      :protocol-icon="protocol"
      :data-cy="`btn-add-${protocol}`"
      @click="resolve(protocol)"
    />
  </Modal>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  ref,
} from 'vue';
import type { Protocol, ResolveCallback, RejectCallback } from '@/types';
import { PROTOCOL_LIST } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import BtnSubheader from '../buttons/BtnSubheader.vue';
import Modal from '../Modal.vue';
import InputSearch from '../InputSearch.vue';

export default defineComponent({
  components: {
    Modal,
    BtnSubheader,
    InputSearch,
  },
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    resolve: { type: Function as PropType<ResolveCallback<Protocol>>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup() {
    const searchTerm = ref('');

    function getProtocolName(protocol: Protocol) {
      return ProtocolAdapterFactory.getAdapter(protocol).protocolName;
    }

    function normalizeForSearch(value: string) {
      return value
        .toLowerCase()
        .trim()
        // Expand ligatures and remove diacritics
        .normalize('NFKD')
        // Explicitly map common ligatures used in names
        .replace(/\u00E6/g, 'ae') // æ → ae
        .replace(/\u0153/g, 'oe') // œ → oe (future-proofing)
        .replace(/[\u0300-\u036f]/g, '');
    }

    const filteredProtocols = computed(() => {
      const term = normalizeForSearch(searchTerm.value);
      return PROTOCOL_LIST.filter((protocol) => normalizeForSearch(
        getProtocolName(protocol),
      ).includes(term));
    });

    return {
      PROTOCOL_LIST,
      searchTerm,
      filteredProtocols,
      getProtocolName,
      normalizeForSearch,
    };
  },
});
</script>

<style lang="scss" scoped>
.protocol-select {
  .heading {
    margin-bottom: 1em;
  }

  .caption {
    margin-bottom: 32px;
  }

  .search-field {
    margin-bottom: 16px;
  }
}
</style>
