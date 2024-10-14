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

    <BtnSubheader
      v-for="protocol in PROTOCOL_LIST"
      :key="protocol"
      :header="getProtocolName(protocol)"
      :subheader="$t(
        'modals.createAccount.addProtocolAccount', { name: getProtocolName(protocol) })"
      :protocol-icon="protocol"
      @click="resolve(protocol)"
    />
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { Protocol, ResolveCallback, RejectCallback } from '@/types';
import { PROTOCOL_LIST } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import BtnSubheader from '../buttons/BtnSubheader.vue';
import Modal from '../Modal.vue';

export default defineComponent({
  components: {
    Modal,
    BtnSubheader,
  },
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    resolve: { type: Function as PropType<ResolveCallback<Protocol>>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup() {
    function getProtocolName(protocol: Protocol) {
      return ProtocolAdapterFactory.getAdapter(protocol).protocolName;
    }

    return {
      PROTOCOL_LIST,
      getProtocolName,
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
}
</style>
