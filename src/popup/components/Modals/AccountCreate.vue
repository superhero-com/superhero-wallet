<template>
  <Modal
    class="account-create"
    from-bottom
    has-close-button
    no-padding
    centered
    @close="resolve"
  >
    <div class="content-wrapper ">
      <h2 class="text-heading-1">
        {{ $t('modals.createAccount.title') }}
      </h2>

      <p class="message">
        {{ $t('modals.createAccount.msg') }}
      </p>

      <BtnSubheader
        v-for="protocol in PROTOCOLS"
        :key="protocol"
        :header="getProtocolName(protocol)"
        :subheader="$t('modals.createAccount.addProtocolAccount', { name: protocol })"
        :protocol-icon="protocol"
        @click="createAccount(protocol)"
      />
    </div>

    <Loader v-if="loading" />
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { useStore } from 'vuex';
import type { Protocol, ResolveCallback } from '@/types';
import {
  MODAL_AE_ACCOUNT_CREATE,
  PROTOCOL_AETERNITY,
  PROTOCOL_BITCOIN,
  PROTOCOLS,
} from '@/constants';
import { useConnection, useModals } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import Loader from '@/popup/components/Loader.vue';
import BtnSubheader from '../buttons/BtnSubheader.vue';
import Modal from '../Modal.vue';

export default defineComponent({
  components: {
    Loader,
    Modal,
    BtnSubheader,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
  },
  setup(props) {
    const store = useStore();
    const { isOnline } = useConnection();
    const { openModal } = useModals();
    const loading = ref(false);

    async function createAccount(protocol: Protocol) {
      loading.value = true;

      // TODO each of the blocks of this switch should be moved to the specific adapter
      switch (protocol) {
        case PROTOCOL_AETERNITY:
          await openModal(MODAL_AE_ACCOUNT_CREATE);
          break;

        case PROTOCOL_BITCOIN:
          await store.dispatch('accounts/hdWallet/create', {
            isRestored: false,
            protocol: PROTOCOL_BITCOIN,
          });
          break;

        default:
      }
      loading.value = false;
      props.resolve();
    }

    function getProtocolName(protocol: Protocol) {
      return ProtocolAdapterFactory.getAdapter(protocol).protocolName;
    }

    return {
      PROTOCOLS,
      PROTOCOL_AETERNITY,
      PROTOCOL_BITCOIN,
      isOnline,
      loading,
      createAccount,
      getProtocolName,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';

.account-create {
  .content-wrapper {
    padding: 0 16px 32px;
  }

  .message {
    @extend %face-sans-16-medium;

    padding-inline: inherit;
    line-height: 24px;
    margin: 0 auto 36px;
  }
}
</style>
