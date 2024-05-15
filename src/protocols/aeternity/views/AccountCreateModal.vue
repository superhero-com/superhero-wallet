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
import {
  MODAL_AIR_GAP_IMPORT_ACCOUNTS,
  MODAL_MULTISIG_VAULT_CREATE,
  PROTOCOLS,
} from '@/constants';
import { IAirgapAccountRaw } from '@/types';
import { handleUnknownError } from '@/utils';
import {
  useAccounts,
  useConnection,
  useModals,
} from '@/composables';

import BtnSubheader from '@/popup/components/buttons/BtnSubheader.vue';
import Modal from '@/popup/components/Modal.vue';

import QrScanIcon from '@/icons/qr-scan.svg?vue-component';
import PlusCircleIcon from '@/icons/plus-circle-fill.svg?vue-component';

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
    const {
      addRawAccount,
      addAirGapAccount,
      setActiveAccountByProtocolAndIdx,
      setActiveAccountByGlobalIdx,
    } = useAccounts();
    const { isOnline } = useConnection();
    const { openModal } = useModals();

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
      try {
        const selectedAccounts = await openModal(MODAL_AIR_GAP_IMPORT_ACCOUNTS);
        selectedAccounts.forEach((account: IAirgapAccountRaw) => {
          const globalIdx = addAirGapAccount(account);
          setActiveAccountByGlobalIdx(globalIdx);
          props.resolve();
        });
      } catch (error) {
        handleUnknownError(error);
      }
      props.resolve();
    }

    return {
      PlusCircleIcon,
      QrScanIcon,
      isOnline,
      createPlainAccount,
      createMultisigAccount,
      connectHardwareWallet,
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
