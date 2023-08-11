<template>
  <Modal
    class="account-create"
    from-bottom
    has-close-button
    centered
    @close="resolve"
  >
    <h2 class="text-heading-2">
      {{
        isMultisig
          ? $t('modals.createAccount.titleMultisig')
          : $t('pages.accounts.addAccount')
      }}
    </h2>

    <p class="message">
      {{
        isMultisig
          ? $t('modals.createAccount.msgMultisig')
          : $t('modals.createAccount.msg')
      }}
    </p>

    <BtnSubheader
      v-if="!isMultisig"
      :header="$t('pages.accounts.addAeternityAccount')"
      :subheader="$t('modals.createAccount.btnSubtitle')"
      :icon="PlusCircleIcon"
      :disabled="!isOnline"
      @click="createPlainAccount(PROTOCOL_AETERNITY)"
    />
    <BtnSubheader
      v-if="!isMultisig"
      :header="$t('pages.accounts.addBitcoinAccount')"
      :subheader="$t('modals.createAccount.btnSubtitle')"
      :icon="PlusCircleIcon"
      :disabled="!isOnline"
      @click="createPlainAccount(PROTOCOL_BITCOIN)"
    />
    <BtnSubheader
      :header="$t('modals.createMultisigAccount.btnText')"
      :subheader="$t('modals.createMultisigAccount.btnSubtitle')"
      :icon="PlusCircleIcon"
      :disabled="!isOnline"
      @click="createMultisigAccount()"
    />

    <Loader v-if="loading" />
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { useStore } from 'vuex';
import type { Protocol } from '@/types';
import {
  MODAL_MULTISIG_VAULT_CREATE,
  PROTOCOL_AETERNITY,
  PROTOCOL_BITCOIN,
} from '@/constants';
import { useConnection, useModals } from '@/composables';

import BtnSubheader from '../buttons/BtnSubheader.vue';
import Modal from '../Modal.vue';
import Loader from '../Loader.vue';
import PlusCircleIcon from '../../../icons/plus-circle-fill.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnSubheader,
    Loader,
  },
  props: {
    resolve: { type: Function as PropType<() => void>, required: true },
    isMultisig: Boolean,
  },
  setup(props) {
    const store = useStore();
    const { isOnline } = useConnection();
    const { openModal } = useModals();

    const loading = ref(false);

    async function createPlainAccount(protocol: Protocol) {
      loading.value = true;
      await store.dispatch('accounts/hdWallet/create', {
        isRestored: false,
        protocol,
      });
      loading.value = false;
      props.resolve();
    }

    async function createMultisigAccount() {
      await openModal(MODAL_MULTISIG_VAULT_CREATE);
      props.resolve();
    }

    return {
      PROTOCOL_AETERNITY,
      PROTOCOL_BITCOIN,
      PlusCircleIcon,
      isOnline,
      loading,
      createPlainAccount,
      createMultisigAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/typography';

.account-create {
  .message {
    @extend %face-sans-16-medium;

    line-height: 24px;
    max-width: 280px;
    margin: 0 auto 36px;
  }
}
</style>
