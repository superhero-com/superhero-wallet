<template>
  <Modal
    class="account-create-modal"
    from-bottom
    has-close-button
    no-padding
    centered
    @close="resolve"
  >
    <div class="content-wrapper">
      <h1 class="text-heading-1">
        {{
          isMultisig
            ? $t('modals.createAccount.titleMultisig')
            : $t('modals.createAccount.titleAeternityAccount')
        }}
      </h1>

      <p class="message">
        {{
          isMultisig
            ? $t('modals.createAccount.msgMultisig')
            : $t('modals.createAccount.msgAeternity')
        }}
      </p>

      <BtnSubheader
        v-if="!isMultisig"
        :header="$t('pages.accounts.addAccount')"
        :subheader="$t('modals.createAccount.btnSubtitle')"
        :icon="PlusCircleIcon"
        :disabled="!isOnline"
        @click="createPlainAccount()"
      />
      <BtnSubheader
        :header="$t('modals.createMultisigAccount.btnText')"
        :subheader="$t('modals.createMultisigAccount.btnSubtitle')"
        :icon="PlusCircleIcon"
        :disabled="!isOnline"
        @click="createMultisigAccount()"
      />
      <BtnSubheader
        v-if="!isMultisig"
        :header="$t('modals.importAirGapAccount.btnText')"
        :subheader="$t('modals.importAirGapAccount.btnSubtitle')"
        :icon="QrScanIcon"
        @click="connectHardwareWallet()"
      />
    </div>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { MODAL_MULTISIG_VAULT_CREATE, PROTOCOLS } from '@/constants';
import {
  useAccounts,
  useAirGap,
  useConnection,
  useModals,
} from '@/composables';

import BtnSubheader from '@/popup/components/buttons/BtnSubheader.vue';
import Modal from '@/popup/components/Modal.vue';

import PlusCircleIcon from '@/icons/plus-circle-fill.svg?vue-component';
import { IAccount } from '@/types';
import { handleUnknownError } from '@/utils';

export default defineComponent({
  components: {
    Modal,
    BtnSubheader,
  },
  props: {
    resolve: { type: Function as PropType<() => void>, required: true },
    isMultisig: Boolean,
  },
  setup(props) {
    const { addRawAccount, setActiveAccountByProtocolAndIdx } = useAccounts();
    const { isOnline } = useConnection();
    const { openModal } = useModals();
    const { extractAccountShareResponseData } = useAirGap();

    async function createPlainAccount() {
      const idx = addRawAccount({
        isRestored: false,
        protocol: PROTOCOLS.aeternity,
      });
      setActiveAccountByProtocolAndIdx(PROTOCOLS.aeternity, idx);
      props.resolve();
    }

    async function createMultisigAccount() {
      await openModal(MODAL_MULTISIG_VAULT_CREATE);
      props.resolve();
    }

    async function connectHardwareWallet() {
      const scanResult = await root.$store.dispatch('modals/open', {
        name: MODAL_READ_QR_CODE,
        heading: root.$t('modals.importAirGapAccount.scanTitle'),
        title: root.$t('modals.importAirGapAccount.scanDescription'),
        icon: 'critical',
      });

      if (!scanResult) return;

      const accounts = await extractAccountShareResponseData(scanResult);

      // Show Account import.
      if (accounts?.length) {
        try {
          const selectedAccounts = await root.$store.dispatch('modals/open', {
            name: MODAL_AIR_GAP_CONFIRM_IMPORT,
            accounts,
          });
          selectedAccounts.forEach((account: IAccount) => {
            root.$store.dispatch('accounts/airgap/import', account);
          });
        } catch (error) {
          handleUnknownError(error);
        }
      }

      props.resolve();
    }

    return {
      PlusCircleIcon,
      isOnline,
      createPlainAccount,
      createMultisigAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';

.account-create-modal {
  .content-wrapper {
    padding: 0 16px 32px;
  }

  .message {
    @extend %face-sans-16-medium;

    line-height: 24px;
    margin: 0 auto 36px;
  }
}
</style>
