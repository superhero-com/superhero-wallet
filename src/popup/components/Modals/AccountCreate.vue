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
        v-for="protocol in PROTOCOL_LIST"
        :key="protocol"
        :header="getProtocolName(protocol)"
        :subheader="$t(
          'modals.createAccount.addProtocolAccount', { name: getProtocolName(protocol) })"
        :protocol-icon="protocol"
        @click="createAccount(protocol)"
      />
    </div>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType } from 'vue';
import type { IAccount, Protocol, ResolveCallback } from '@/types';
import {
  MODAL_AE_ACCOUNT_CREATE,
  MODAL_AIR_GAP_CONFIRM_IMPORT,
  MODAL_READ_QR_CODE,
  PROTOCOLS,
  PROTOCOL_LIST,
} from '@/constants';
import {
  useAccounts,
  useAirGap,
  useConnection,
  useModals,
  useUi,
} from '@/composables';
import { tg } from '@/popup/plugins/i18n';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import { handleUnknownError } from '@/utils';
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
    const { addRawAccount, setActiveAccountByProtocolAndIdx } = useAccounts();
    const { isOnline } = useConnection();
    const { openModal } = useModals();
    const { setLoaderVisible } = useUi();
    const { extractAccountShareResponseData } = useAirGap();

    async function createAccount(protocol: Protocol) {
      setLoaderVisible(true);
      let idx: number;

      // TODO each of the blocks of this switch should be moved to the specific adapter
      switch (protocol) {
        case PROTOCOLS.aeternity:
          await openModal(MODAL_AE_ACCOUNT_CREATE);
          break;

        case PROTOCOLS.bitcoin:
        case PROTOCOLS.ethereum:
          idx = addRawAccount({
            isRestored: false,
            protocol,
          });
          setActiveAccountByProtocolAndIdx(protocol, idx);
          break;

        default:
          throw new Error(`createAccount not implemented for protocol: ${protocol}`);
      }
      setLoaderVisible(false);
      props.resolve();
    }

    async function connectHardwareWallet() {
      const scanResult = await openModal(MODAL_READ_QR_CODE, {
        heading: tg('modals.importAirGapAccount.scanTitle'),
        title: tg('modals.importAirGapAccount.scanDescription'),
        icon: 'critical',
      });

      if (!scanResult) return;

      const accounts = await extractAccountShareResponseData(scanResult) || [];

      // Show Account import.
      try {
        const selectedAccounts = await openModal(MODAL_AIR_GAP_CONFIRM_IMPORT, {
          accounts,
        });
        selectedAccounts.forEach((account: IAccount) => {
          root.$store.dispatch('accounts/airgap/import', account);
        });
      } catch (error) {
        handleUnknownError(error);
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
      connectHardwareWallet,
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
