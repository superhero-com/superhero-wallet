<template>
  <Modal
    class="account-create"
    from-bottom
    has-close-button
    centered
    @close="resolve"
  >
    <h1
      class="text-heading-4 heading"
      v-text="$t('modals.createAccount.title')"
    />

    <p class="text-caption caption">
      {{ $t('modals.createAccount.msg') }}
    </p>

    <BtnSubheader
      v-for="protocol in PROTOCOL_LIST"
      :key="protocol"
      :header="getProtocolName(protocol)"
      :subheader="$t(
        'modals.createAccount.addProtocolAccount', { name: getProtocolName(protocol) })"
      :protocol-icon="protocol"
      @click="createAccount(protocol)"
    />
  </Modal>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType } from 'vue';
import type { Protocol, ResolveCallback } from '@/types';
import {
  ACCOUNT_TYPES,
  MODAL_AE_ACCOUNT_CREATE,
  PROTOCOLS,
  PROTOCOL_LIST,
} from '@/constants';
import {
  useAccounts,
  useConnection,
  useModals,
  useUi,
} from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import BtnSubheader from '../buttons/BtnSubheader.vue';
import Modal from '../Modal.vue';

export default defineComponent({
  components: {
    Modal,
    BtnSubheader,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
  },
  setup(props) {
    const { addRawAccount, setActiveAccountByGlobalIdx } = useAccounts();
    const { isOnline } = useConnection();
    const { openModal, openDefaultModal } = useModals();
    const { setLoaderVisible } = useUi();

    async function createAccount(protocol: Protocol) {
      setLoaderVisible(true);
      let globalIdx: number;

      // TODO each of the blocks of this switch should be moved to the specific adapter
      switch (protocol) {
        case PROTOCOLS.aeternity:
          await openModal(MODAL_AE_ACCOUNT_CREATE);
          break;

        case PROTOCOLS.bitcoin:
        case PROTOCOLS.ethereum:
        case PROTOCOLS.solana:
          globalIdx = addRawAccount({
            isRestored: false,
            protocol,
            type: ACCOUNT_TYPES.hdWallet,
          });
          setActiveAccountByGlobalIdx(globalIdx);
          break;

        default:
          openDefaultModal({ icon: 'alert', msg: `Account creation not possible for protocol: ${protocol}` });
      }
      setLoaderVisible(false);
      props.resolve();
    }

    function getProtocolName(protocol: Protocol) {
      return ProtocolAdapterFactory.getAdapter(protocol).protocolName;
    }

    onMounted(() => {
      setLoaderVisible(false);
    });

    return {
      PROTOCOL_LIST,
      isOnline,
      createAccount,
      getProtocolName,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-create {
  .heading {
    margin-bottom: 1em;
  }

  .caption {
    line-height: 24px;
    margin-bottom: 32px;
  }
}
</style>
